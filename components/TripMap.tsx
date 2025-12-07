import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Trip } from '../types';
import { OptimizedStop } from '../services/optimization';
import { LOCATION_COORDINATES, DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';

// Fix Leaflet's default icon path issues
try {
  if (typeof window !== 'undefined' && L.Icon && L.Icon.Default) {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
} catch (e) {
  console.warn("Leaflet default icon configuration failed:", e);
}

interface TripMapProps {
  trips: Trip[];
  optimizedRoute: OptimizedStop[] | null; // If null, show raw trips
}

const getCoords = (locationName: string) => {
  return LOCATION_COORDINATES[locationName] || LOCATION_COORDINATES["Unknown"];
};

const MapUpdater: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

// Custom Icon for Trucks
const createTruckIcon = () => new L.DivIcon({
  className: 'truck-icon',
  html: `<div class="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full border-2 border-white shadow-xl transform -translate-x-1/2 -translate-y-1/2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Pulsing dot for active start points
const createPulseIcon = () => new L.DivIcon({
  className: 'pulsing-marker',
  html: '<div class="pulsing-dot"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// Format minutes into H:MM
const formatTime = (minutes: number) => {
  if (minutes === 0) return "Start";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `+${h}h ${m}m`;
};

export const TripMap: React.FC<TripMapProps> = ({ trips, optimizedRoute }) => {
  const isOptimized = optimizedRoute !== null && optimizedRoute.length > 0;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative z-0">
      <MapContainer 
        center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} zoom={DEFAULT_ZOOM} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* --- VIEW MODE 1: OPTIMIZED ROUTE --- */}
        {isOptimized && optimizedRoute && (
          <>
            {/* The Path Line */}
            <Polyline
              positions={optimizedRoute.map(stop => [stop.coords.lat, stop.coords.lng])}
              pathOptions={{
                color: '#fbbf24', // Amber/Gold for optimized
                weight: 4,
                opacity: 0.8,
                dashArray: '5, 10'
              }}
            />
            
            {/* Sequence Markers */}
            {optimizedRoute.map((stop, index) => (
              <CircleMarker
                key={stop.id}
                center={[stop.coords.lat, stop.coords.lng]}
                pathOptions={{
                  color: index === 0 || index === optimizedRoute.length - 1 ? '#ef4444' : '#fbbf24',
                  fillColor: '#0f172a',
                  fillOpacity: 1,
                  weight: 2
                }}
                radius={12}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                  <span className="font-bold text-xs">{stop.sequence}</span>
                </Tooltip>
                <Popup>
                  <div className="text-slate-900 min-w-[120px]">
                    <div className="flex justify-between items-center mb-1 border-b border-slate-300 pb-1">
                      <strong className="text-sm">Stop #{stop.sequence}</strong>
                      <span className="text-xs font-mono bg-slate-200 px-1 rounded">{formatTime(stop.estimatedArrivalMinutes)}</span>
                    </div>
                    <div className="text-sm font-semibold mb-1">{stop.locationName}</div>
                    <div className="text-xs text-slate-500 uppercase flex justify-between">
                      <span>{stop.type}</span>
                      <span>{(stop.distanceFromLast).toFixed(1)} km leg</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Simulated Moving Truck on the Optimized Route */}
            {optimizedRoute.length > 1 && (
               <Marker 
               // Simple demo: Place truck between stop 1 and 2
               position={[
                 (optimizedRoute[0].coords.lat + optimizedRoute[1].coords.lat) / 2, 
                 (optimizedRoute[0].coords.lng + optimizedRoute[1].coords.lng) / 2
               ]}
               icon={createTruckIcon()}
             >
               <Popup>
                 Optimized Fleet Vehicle<br/>
                 En route to Stop #2
               </Popup>
             </Marker>
            )}
          </>
        )}

        {/* --- VIEW MODE 2: RAW TRIPS (Standard View) --- */}
        {!isOptimized && trips.map((trip) => {
          const start = getCoords(trip.start_location);
          const end = getCoords(trip.destination);
          const isActive = trip.status === 'in_transit';

          const pathColor = isActive ? '#6366f1' : '#475569';
          const dashArray = isActive ? '10, 10' : undefined;

          return (
            <React.Fragment key={trip.id}>
              <Polyline 
                positions={[[start.lat, start.lng], [end.lat, end.lng]]} 
                pathOptions={{ 
                  color: pathColor, 
                  weight: isActive ? 3 : 2, 
                  dashArray: dashArray,
                  opacity: isActive ? 0.9 : 0.4
                }} 
              />
              {isActive && (
                <Marker position={[start.lat, start.lng]} icon={createPulseIcon()}>
                   <Popup className="text-slate-900">
                    <strong>Origin:</strong> {trip.start_location}
                  </Popup>
                </Marker>
              )}
              <Marker 
                position={isActive 
                  ? [(start.lat + end.lat) / 2, (start.lng + end.lng) / 2] 
                  : [end.lat, end.lng]
                }
                icon={createTruckIcon()}
                opacity={isActive ? 1 : 0.5}
              >
                <Popup className="text-slate-800 text-sm">
                  <div className="font-bold border-b pb-1 mb-1">{trip.vehicle_id || `Truck #${trip.id}`}</div>
                  <div>Status: {trip.status}</div>
                  <div>To: {trip.destination}</div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-lg z-[1000] text-xs shadow-xl">
          <h4 className="font-bold text-slate-300 mb-2 uppercase tracking-wider">
            {isOptimized ? 'Optimization Mode' : 'Live Operations'}
          </h4>
          
          {isOptimized ? (
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-1 bg-amber-400 border-dashed border-t border-b border-amber-600"></div>
                <span className="text-amber-400">Optimal Path</span>
               </div>
               <p className="text-[10px] text-slate-500 italic mt-1">
                 Est. includes 20m service time/stop
               </p>
           </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-slate-400">In Transit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                <span className="text-slate-400">Delivered</span>
              </div>
            </>
          )}
        </div>
      </MapContainer>
    </div>
  );
};