export type AppRole = 'admin' | 'driver';
export type DriverStatus = 'pending' | 'approved' | 'removed';
export type TripEndReason = 'driver' | 'arrived' | 'admin' | 'timeout';

export interface Route {
  id: string;
  name: string;
  path: GeoJSON.LineString | null;
}

export interface Stop {
  id: string;
  route_id: string;
  name: string;
  short_name: string;
  seq: number;
  lat: number;
  lng: number;
  is_college: boolean;
}

export interface Bus {
  id: string;
  code: string;
  name: string;
  route_id: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: AppRole;
  status: DriverStatus;
  bus_id: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  bus_id: string;
  driver_id: string;
  started_at: string;
  ended_at: string | null;
  end_reason: TripEndReason | null;
}

export interface BusPosition {
  bus_id: string;
  trip_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed_kmh: number | null;
  updated_at: string;
}

export type StudentTripStatus = 'live' | 'idle' | 'ended' | 'offline';
