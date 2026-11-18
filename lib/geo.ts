// Haversine formula and Geo utilities for StopMate

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);

  const h =
    sinDlat * sinDlat +
    Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

// Computes cumulative distances along a polyline of LatLng points
export function computeCumulativeDistances(points: LatLng[]): number[] {
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cum[i] = cum[i - 1] + haversineDistanceMeters(points[i - 1], points[i]);
  }
  return cum;
}
