import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import { Trip, OilBatch, OliveBatch, RecentTransaction } from '../types';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mock Data Generators for fallback or demonstration if DB is empty
export const generateMockTrips = (): Trip[] => [
  { id: 101, start_location: "Sidi Bouzid", destination: "Sfax (Gremda)", status: "in_transit", vehicle_id: "TRK-001" },
  { id: 102, start_location: "Kairouan", destination: "Sousse", status: "in_transit", vehicle_id: "TRK-023" },
  { id: 103, start_location: "Tunis", destination: "Bizerte", status: "delivered", vehicle_id: "TRK-009" },
  { id: 104, start_location: "Gafsa", destination: "Sfax", status: "in_transit", vehicle_id: "TRK-112" },
  { id: 105, start_location: "Nabeul", destination: "Tunis", status: "delivered", vehicle_id: "TRK-055" },
];

export const generateMockStats = () => ({
  totalOlivesKg: 125400,
  totalOilLiters: 24500,
  activeTrips: 3
});

export const generateMockTransactions = (): RecentTransaction[] => [
  { id: "TX-992", type: "Collection", source: "Ahmed Ben Ali", destination: "Sfax Press", amount: "5,000 kg", timestamp: "2023-10-24 08:30", status: "Completed" },
  { id: "TX-993", type: "Production", source: "Sfax Press", destination: "Storage A", amount: "950 L", timestamp: "2023-10-24 10:15", status: "Completed" },
  { id: "TX-994", type: "Shipment", source: "Sfax HQ", destination: "Tunis Export", amount: "2,000 L", timestamp: "2023-10-24 11:45", status: "In Transit" },
  { id: "TX-995", type: "Collection", source: "Domaine El Jem", destination: "Mahdia Press", amount: "12,000 kg", timestamp: "2023-10-24 13:20", status: "Processing" },
];

// Service functions that attempt to fetch from Supabase, but fallback gracefully
export const fetchDashboardData = async () => {
  try {
    // Attempt parallel fetch
    const [tripsRes, oilRes, oliveRes] = await Promise.all([
      supabase.from('trips').select('*'),
      supabase.from('oil_batches').select('*'),
      supabase.from('olive_batches').select('*')
    ]);

    // Check if we have data, if not (or error), use mock
    if (tripsRes.error || !tripsRes.data || tripsRes.data.length === 0) {
      console.warn("Using mock data due to Supabase fetch result:", tripsRes.error);
      return {
        trips: generateMockTrips(),
        stats: generateMockStats(),
        transactions: generateMockTransactions()
      };
    }

    const trips = tripsRes.data as Trip[];
    const oilBatches = oilRes.data as OilBatch[];
    const oliveBatches = oliveRes.data as OliveBatch[];

    // Calculate stats
    const totalOlivesKg = oliveBatches.reduce((acc, curr) => acc + (curr.quantity_kg || 0), 0);
    const totalOilLiters = oilBatches.reduce((acc, curr) => acc + (curr.quantity_liters || 0), 0);
    const activeTrips = trips.filter(t => t.status === 'in_transit').length;

    // Convert batches to transactions for the table (simplified mapping)
    const transactions: RecentTransaction[] = [
      ...oliveBatches.slice(0, 5).map(b => ({
        id: `OLV-${b.id}`,
        type: 'Collection' as const,
        source: b.farmer_name || 'Unknown Farmer',
        destination: 'Press',
        amount: `${b.quantity_kg} kg`,
        timestamp: b.date_collected || new Date().toISOString(),
        status: 'Completed'
      })),
      ...oilBatches.slice(0, 5).map(b => ({
        id: `OIL-${b.id}`,
        type: 'Production' as const,
        source: b.press_name || 'Unknown Press',
        destination: 'Storage',
        amount: `${b.quantity_liters} L`,
        timestamp: b.date_produced || new Date().toISOString(),
        status: 'Completed'
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    return {
      trips,
      stats: { totalOlivesKg, totalOilLiters, activeTrips },
      transactions
    };

  } catch (error) {
    console.error("Critical error fetching dashboard data", error);
    return {
      trips: generateMockTrips(),
      stats: generateMockStats(),
      transactions: generateMockTransactions()
    };
  }
};
