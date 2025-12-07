export interface Trip {
  id: number;
  start_location: string;
  destination: string;
  status: 'in_transit' | 'delivered' | 'pending';
  driver_name?: string;
  vehicle_id?: string;
  created_at?: string;
}

export interface OilBatch {
  id: number;
  quantity_liters: number;
  press_name: string;
  date_produced: string;
}

export interface OliveBatch {
  id: number;
  quantity_kg: number;
  farmer_name: string;
  date_collected: string;
}

export interface DashboardStats {
  totalOlivesKg: number;
  totalOilLiters: number;
  activeTrips: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RecentTransaction {
  id: string;
  type: 'Collection' | 'Production' | 'Shipment';
  source: string;
  destination: string;
  amount: string;
  timestamp: string;
  status: string;
}