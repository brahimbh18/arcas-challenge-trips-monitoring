import { Coordinates } from './types';

// Supabase Configuration
export const SUPABASE_URL = 'https://uizkpxpemlqswkgngkos.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemtweHBlbWxxc3drZ25na29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjQxNzYsImV4cCI6MjA4MDY0MDE3Nn0._cVNpOvFZlt3lOYlkJl8kpQxUYsYULsu0DTMrlmJ3as';

// Coordinate Mapping System for Tunisia
export const LOCATION_COORDINATES: Record<string, Coordinates> = {
  // Major Cities & Regions
  "Sfax": { lat: 34.7406, lng: 10.7603 },
  "Sfax (Gremda)": { lat: 34.7600, lng: 10.7300 },
  "Tunis": { lat: 36.8065, lng: 10.1815 },
  "Sousse": { lat: 35.8256, lng: 10.6084 },
  "Gabes": { lat: 33.8815, lng: 10.0982 },
  "Kairouan": { lat: 35.6781, lng: 10.0963 },
  "Bizerte": { lat: 37.2744, lng: 9.8739 },
  "Gafsa": { lat: 34.4250, lng: 8.7842 },
  "Ariana": { lat: 36.8625, lng: 10.1956 },
  "Sidi Bouzid": { lat: 35.0382, lng: 9.4849 },
  "Medenine": { lat: 33.3549, lng: 10.5055 },
  "Monastir": { lat: 35.7780, lng: 10.8262 },
  "Mahdia": { lat: 35.5047, lng: 11.0622 },
  "Nabeul": { lat: 36.4561, lng: 10.7376 },
  "Kasserine": { lat: 35.1676, lng: 8.8365 },
  "Tozeur": { lat: 33.9197, lng: 8.1335 },
  "Zarzis": { lat: 33.5041, lng: 11.1122 },
  
  // Generic Fallback
  "Unknown": { lat: 34.7406, lng: 10.7603 } // Default to Sfax
};

export const DEFAULT_CENTER: Coordinates = { lat: 34.5, lng: 9.5 };
export const DEFAULT_ZOOM = 7;
