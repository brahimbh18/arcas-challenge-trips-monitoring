import { Trip, Coordinates } from '../types';
import { LOCATION_COORDINATES } from '../constants';

// Logistics Constants
const AVERAGE_SPEED_KPH = 60; // Average truck speed in km/h
const SERVICE_TIME_MINUTES = 20; // Time spent loading/unloading at each stop

// Helper to get coords
const getCoords = (name: string): Coordinates => {
  return LOCATION_COORDINATES[name] || LOCATION_COORDINATES["Unknown"];
};

// Haversine formula for distance in km
const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371; // Earth radius in km
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLon = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
    Math.cos(coord2.lat * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export interface OptimizedStop {
  id: string;
  locationName: string;
  coords: Coordinates;
  sequence: number;
  type: 'pickup' | 'delivery' | 'depot';
  distanceFromLast: number; // km
  cumulativeDistance: number; // km
  estimatedArrivalMinutes: number; // minutes from start
}

export interface OptimizationResult {
  route: OptimizedStop[];
  metrics: {
    totalDistanceKm: number;
    totalDurationMinutes: number;
    stopCount: number;
  };
}

interface Node {
  id: string;
  name: string;
  coords: Coordinates;
  type: 'pickup' | 'delivery' | 'depot';
}

/**
 * Calculates the total distance of a given sequence of nodes.
 */
const calculateRouteCost = (route: Node[]): number => {
  let distance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    distance += calculateDistance(route[i].coords, route[i+1].coords);
  }
  return distance;
};

/**
 * ALNS OPERATOR: Worst Removal
 * Removes n nodes that contribute most to the total distance.
 */
const destroyWorst = (route: Node[], amount: number): { partialRoute: Node[], removed: Node[] } => {
  let currentRoute = [...route];
  const removed: Node[] = [];
  
  // Don't remove start/end depot
  const candidates = currentRoute.slice(1, -1);
  if (candidates.length <= amount) {
    return { partialRoute: [currentRoute[0], currentRoute[currentRoute.length-1]], removed: candidates };
  }

  // Calculate "cost" of each node (distance saved if removed)
  const costs = candidates.map((node, idx) => {
    // idx in candidates corresponds to idx+1 in currentRoute
    const prev = currentRoute[idx]; // node at idx in original (since candidates starts at 1)
    const next = currentRoute[idx + 2];
    const costWith = calculateDistance(prev.coords, node.coords) + calculateDistance(node.coords, next.coords);
    const costWithout = calculateDistance(prev.coords, next.coords);
    return { node, savings: costWith - costWithout };
  });

  // Sort by savings descending
  costs.sort((a, b) => b.savings - a.savings);

  const toRemove = new Set(costs.slice(0, amount).map(c => c.node.id));
  
  removed.push(...costs.slice(0, amount).map(c => c.node));
  currentRoute = currentRoute.filter(n => !toRemove.has(n.id));

  return { partialRoute: currentRoute, removed };
};

/**
 * ALNS OPERATOR: Random Removal
 * Removes n nodes randomly.
 */
const destroyRandom = (route: Node[], amount: number): { partialRoute: Node[], removed: Node[] } => {
  const currentRoute = [...route];
  const removed: Node[] = [];
  const editableIndices = Array.from({ length: currentRoute.length - 2 }, (_, i) => i + 1); // skip 0 and last

  // Shuffle indices
  for (let i = editableIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [editableIndices[i], editableIndices[j]] = [editableIndices[j], editableIndices[i]];
  }

  const indicesToRemove = new Set(editableIndices.slice(0, amount));
  
  const newRoute = currentRoute.filter((_, idx) => {
    if (indicesToRemove.has(idx)) {
      removed.push(currentRoute[idx]);
      return false;
    }
    return true;
  });

  return { partialRoute: newRoute, removed };
};

/**
 * ALNS OPERATOR: Greedy Insertion
 * Inserts nodes back into the route where they add the least distance.
 */
const repairGreedy = (partialRoute: Node[], nodesToInsert: Node[]): Node[] => {
  let route = [...partialRoute];
  const remaining = [...nodesToInsert];

  while (remaining.length > 0) {
    let bestNodeIdx = -1;
    let bestInsertPos = -1;
    let minAddedCost = Infinity;

    // For every unvisited node
    for (let i = 0; i < remaining.length; i++) {
      const node = remaining[i];
      // Try inserting at every valid position (between depotStart and depotEnd)
      for (let pos = 1; pos < route.length; pos++) {
        const prev = route[pos - 1];
        const next = route[pos];
        
        const addedCost = calculateDistance(prev.coords, node.coords) + 
                          calculateDistance(node.coords, next.coords) - 
                          calculateDistance(prev.coords, next.coords);
        
        if (addedCost < minAddedCost) {
          minAddedCost = addedCost;
          bestNodeIdx = i;
          bestInsertPos = pos;
        }
      }
    }

    if (bestNodeIdx !== -1) {
      route.splice(bestInsertPos, 0, remaining[bestNodeIdx]);
      remaining.splice(bestNodeIdx, 1);
    } else {
      break; // Should not happen
    }
  }

  return route;
};

/**
 * ALNS Main Algorithm
 * Adaptive Large Neighborhood Search
 */
export const solveALNS = (trips: Trip[]): OptimizationResult => {
  const activeTrips = trips.filter(t => t.status === 'in_transit' || t.status === 'pending');
  
  if (activeTrips.length === 0) {
    return {
      route: [],
      metrics: { totalDistanceKm: 0, totalDurationMinutes: 0, stopCount: 0 }
    };
  }

  // 1. Prepare Nodes (Depot + Unique Trip Locations)
  const depotCoords = getCoords("Sfax");
  const depotStart: Node = { id: 'DEPOT-START', name: 'Sfax (HQ)', coords: depotCoords, type: 'depot' };
  const depotEnd: Node = { id: 'DEPOT-END', name: 'Sfax (HQ)', coords: depotCoords, type: 'depot' };
  
  const uniqueNodesMap = new Map<string, Node>();
  
  activeTrips.forEach(t => {
    // Treat Start and End as generic stops to visit for this TSP variation
    const sName = t.start_location;
    const eName = t.destination;
    
    if (!uniqueNodesMap.has(sName)) {
      uniqueNodesMap.set(sName, { id: `STOP-${sName}`, name: sName, coords: getCoords(sName), type: 'pickup' });
    }
    if (!uniqueNodesMap.has(eName)) {
      uniqueNodesMap.set(eName, { id: `STOP-${eName}`, name: eName, coords: getCoords(eName), type: 'delivery' });
    }
  });

  const stopNodes = Array.from(uniqueNodesMap.values());
  
  // 2. Initial Solution (Simple arbitrary order)
  let currentSolution = [depotStart, ...stopNodes, depotEnd];
  let bestSolution = [...currentSolution];
  let bestCost = calculateRouteCost(bestSolution);

  // 3. ALNS Configuration
  const ITERATIONS = 200;
  const REMOVAL_PERCENTAGE = 0.3; // Remove 30% of nodes each iteration
  const removeCount = Math.max(1, Math.floor(stopNodes.length * REMOVAL_PERCENTAGE));

  // 4. Optimization Loop
  for (let i = 0; i < ITERATIONS; i++) {
    // A. Select Destroy Operator (50/50 chance)
    const destroyOp = Math.random() > 0.5 ? destroyWorst : destroyRandom;
    
    // B. Apply Destroy
    const { partialRoute, removed } = destroyOp(currentSolution, removeCount);
    
    // C. Apply Repair (Greedy)
    const newSolution = repairGreedy(partialRoute, removed);
    
    // D. Acceptance Criteria (Simple Hill Climbing + minimal Simulated Annealing logic)
    const newCost = calculateRouteCost(newSolution);
    
    // Accept if better, or with small probability if worse (temperature decreases)
    const temperature = 100 * (1 - i/ITERATIONS);
    const acceptWorse = Math.random() < Math.exp(-(newCost - calculateRouteCost(currentSolution)) / temperature);

    if (newCost < calculateRouteCost(currentSolution) || acceptWorse) {
      currentSolution = newSolution;
      
      if (newCost < bestCost) {
        bestSolution = newSolution;
        bestCost = newCost;
      }
    }
  }

  // 5. Construct Final Result with Time Estimates
  const finalRoute: OptimizedStop[] = [];
  let currentDist = 0;
  let currentTime = 0;

  for (let i = 0; i < bestSolution.length; i++) {
    const node = bestSolution[i];
    let legDist = 0;
    
    if (i > 0) {
      legDist = calculateDistance(bestSolution[i-1].coords, node.coords);
      currentDist += legDist;
      
      // Travel Time
      const legTime = (legDist / AVERAGE_SPEED_KPH) * 60;
      currentTime += legTime;
      
      // Service Time (only for non-depot stops)
      if (node.type !== 'depot') {
        currentTime += SERVICE_TIME_MINUTES;
      }
    }

    finalRoute.push({
      id: node.id,
      locationName: node.name,
      coords: node.coords,
      sequence: i + 1,
      type: node.type,
      distanceFromLast: parseFloat(legDist.toFixed(1)),
      cumulativeDistance: parseFloat(currentDist.toFixed(1)),
      estimatedArrivalMinutes: Math.round(currentTime)
    });
  }

  return {
    route: finalRoute,
    metrics: {
      totalDistanceKm: parseFloat(currentDist.toFixed(1)),
      totalDurationMinutes: Math.round(currentTime),
      stopCount: stopNodes.length
    }
  };
};
