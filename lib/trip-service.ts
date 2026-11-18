import { haversineDistanceMeters, computeCumulativeDistances, LatLng } from "./geo";
import { computeEta, EtaResult } from "./eta";

export interface RouteStop {
  id: string;
  name: string;
  short: string;
  seq: number;
  lat: number;
  lng: number;
  isCollege: boolean;
  distanceAlongRouteMeters: number;
  progressPercent: number;
}

// Exact Raipur college bus route path coordinates (GeoJSON [lng, lat] sequence)
// Connecting all 8 official stops:
// Saddu petrol pump -> Science centre -> Ashoka Ratan -> Turning point shankar nagar ->
// Marine drive -> p.w.bridge -> Dronacharya -> College
export const RAIPUR_ROUTE_COORDS: [number, number][] = [
  [81.7006, 21.2788], // 1. Saddu petrol pump
  [81.6910, 21.2775],
  [81.6824, 21.2770], // 2. Science centre
  [81.6780, 21.2710],
  [81.6720, 21.2630],
  [81.6680, 21.2542], // 3. Ashoka Ratan
  [81.6678, 21.2526], // 4. Turning point shankar nagar
  [81.6640, 21.2460],
  [81.6590, 21.2390], // 5. Marine drive (Telibandha Talab)
  [81.6500, 21.2340],
  [81.6414, 21.2291], // 6. p.w.bridge
  [81.6465, 21.2245], // 7. Dronacharya
  [81.6550, 21.2050], // Santoshi Nagar
  [81.6620, 21.1800], // Boria Kal
  [81.6660, 21.1550], // Mujgahan
  [81.6677, 21.1345], // 8. SSIPMT College
];

// Convert to LatLng for accurate distance calculations
const LAT_LNG_PATH: LatLng[] = RAIPUR_ROUTE_COORDS.map(([lng, lat]) => ({
  lat,
  lng,
}));

export const CUMULATIVE_DISTANCES = computeCumulativeDistances(LAT_LNG_PATH);
export const TOTAL_ROUTE_DISTANCE =
  CUMULATIVE_DISTANCES[CUMULATIVE_DISTANCES.length - 1];

// The 8 official bus stops
export const RAIPUR_STOPS: RouteStop[] = [
  {
    id: "stop-1",
    name: "Saddu petrol pump",
    short: "Saddu",
    seq: 1,
    lat: 21.2788,
    lng: 81.7006,
    isCollege: false,
    distanceAlongRouteMeters: CUMULATIVE_DISTANCES[0],
    progressPercent: 0,
  },
  {
    id: "stop-2",
    name: "Science centre",
    short: "Science Ctr",
    seq: 2,
    lat: 21.2770,
    lng: 81.6824,
    isCollege: false,
    distanceAlongRouteMeters: CUMULATIVE_DISTANCES[2],
    progressPercent: (CUMULATIVE_DISTANCES[2] / TOTAL_ROUTE_DISTANCE) * 100,
  },
  {
    id: "stop-3",
    name: "Ashoka Ratan",
    short: "Ashoka Ratan",
    seq: 3,
    lat: 21.2542,
    lng: 81.6680,
    isCollege: false,
    distanceAlongRouteMeters: CUMULATIVE_DISTANCES[5],
    progressPercent: (CUMULATIVE_DISTANCES[5] / TOTAL_ROUTE_DISTANCE) * 100,
  },
  {
    id: "stop-4",
    name: "Turning point shankar nagar",
    short: "Turning Pt",
    seq: 4,
    lat: 21.2526,
    lng: 81.6678,
    isCollege: false,
    distanceAlongRouteMeters: CUMULATIVE_DISTANCES[6],
    progressPercent: (CUMULATIVE_DISTANCES[6] / TOTAL_ROUTE_DISTANCE) * 100,
  },
  {
    id: "stop-5",
    name: "Marine drive",
    short: "Marine Drive",
    seq: 5,
    lat: 21.2390,
    lng: 81.6590,
    isCollege: false,
    distanceAlongRouteMeters: CUMULATIVE_DISTANCES[8],
    progressPercent: (CUMULATIVE_DISTANCES[8] / TOTAL_ROUTE_DISTANCE) * 100,
  },
  {
    id: "stop-6",
    name: "p.w.bridge",
    short: "PW Bridge",
    seq: 6,
    lat: 21.2291,
    lng: 81.6414,
    isCollege: false,
    distanceAlongRouteMeters: CUMULATIVE_DISTANCES[10],
    progressPercent: (CUMULATIVE_DISTANCES[10] / TOTAL_ROUTE_DISTANCE) * 100,
  },
  {
    id: "stop-7",
    name: "Dronacharya",
    short: "Dronacharya",
    seq: 7,
    lat: 21.2245,
    lng: 81.6465,
    isCollege: false,
    distanceAlongRouteMeters: CUMULATIVE_DISTANCES[11],
    progressPercent: (CUMULATIVE_DISTANCES[11] / TOTAL_ROUTE_DISTANCE) * 100,
  },
  {
    id: "stop-8",
    name: "SSIPMT College",
    short: "College",
    seq: 8,
    lat: 21.1345,
    lng: 81.6677,
    isCollege: true,
    distanceAlongRouteMeters: TOTAL_ROUTE_DISTANCE,
    progressPercent: 100,
  },
];

export interface LiveTripState {
  tripId: string;
  busCode: string;
  busName: string;
  driverName: string;
  driverPhone: string;
  status: "live" | "idle" | "ended";
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  distanceAlongRouteMeters: number;
  progressPercent: number;
  nextStopSeq: number;
  startedAt: number;
  updatedAt: number;
  endedAt: number | null;
  endReason: "driver" | "arrived" | "admin" | "timeout" | null;
}

// In-memory single active trip for the bus (retained across requests in same process)
class TripStore {
  private state: LiveTripState;

  constructor() {
    this.state = {
      tripId: "demo-trip-1",
      busCode: "01",
      busName: "Saddu line",
      driverName: "R. Verma",
      driverPhone: "9000000001",
      status: "live",
      lat: RAIPUR_ROUTE_COORDS[2][1],
      lng: RAIPUR_ROUTE_COORDS[2][0],
      heading: 205,
      speedKmh: 32,
      distanceAlongRouteMeters: CUMULATIVE_DISTANCES[2],
      progressPercent: (CUMULATIVE_DISTANCES[2] / TOTAL_ROUTE_DISTANCE) * 100,
      nextStopSeq: 3,
      startedAt: Date.now() - 360000,
      updatedAt: Date.now(),
      endedAt: null,
      endReason: null,
    };
  }

  getState(): LiveTripState {
    return { ...this.state };
  }

  startTrip(driverName = "R. Verma", driverPhone = "9000000001"): LiveTripState {
    this.state = {
      tripId: "trip-" + Date.now(),
      busCode: "01",
      busName: "Saddu line",
      driverName,
      driverPhone,
      status: "live",
      lat: RAIPUR_ROUTE_COORDS[0][1],
      lng: RAIPUR_ROUTE_COORDS[0][0],
      heading: 210,
      speedKmh: 28,
      distanceAlongRouteMeters: 0,
      progressPercent: 0,
      nextStopSeq: 2,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      endedAt: null,
      endReason: null,
    };
    return this.getState();
  }

  endTrip(reason: "driver" | "arrived" | "admin" = "driver"): LiveTripState {
    this.state = {
      ...this.state,
      status: "ended",
      speedKmh: 0,
      endedAt: Date.now(),
      updatedAt: Date.now(),
      endReason: reason,
    };
    return this.getState();
  }

  // Snap raw GPS coordinate to closest road segment
  snapToRoute(lat: number, lng: number): {
    snappedLat: number;
    snappedLng: number;
    distanceAlongRouteMeters: number;
    heading: number;
  } {
    let bestDist = Infinity;
    let bestProgress = 0;
    let bestLat = lat;
    let bestLng = lng;
    let bestHeading = 210;

    for (let i = 0; i < LAT_LNG_PATH.length - 1; i++) {
      const p1 = LAT_LNG_PATH[i];
      const p2 = LAT_LNG_PATH[i + 1];
      const segLen = haversineDistanceMeters(p1, p2) || 1;

      const d1 = haversineDistanceMeters({ lat, lng }, p1);
      const d2 = haversineDistanceMeters({ lat, lng }, p2);

      const t = Math.max(0, Math.min(1, (d1 * d1 - d2 * d2 + segLen * segLen) / (2 * segLen * segLen)));
      const candidateLat = p1.lat + (p2.lat - p1.lat) * t;
      const candidateLng = p1.lng + (p2.lng - p1.lng) * t;
      const distToSegment = haversineDistanceMeters({ lat, lng }, { lat: candidateLat, lng: candidateLng });

      if (distToSegment < bestDist) {
        bestDist = distToSegment;
        bestLat = candidateLat;
        bestLng = candidateLng;
        bestProgress = CUMULATIVE_DISTANCES[i] + segLen * t;

        const dLngRad = ((p2.lng - p1.lng) * Math.PI) / 180;
        const lat1Rad = (p1.lat * Math.PI) / 180;
        const lat2Rad = (p2.lat * Math.PI) / 180;
        const y = Math.sin(dLngRad) * Math.cos(lat2Rad);
        const x =
          Math.cos(lat1Rad) * Math.sin(lat2Rad) -
          Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLngRad);
        bestHeading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      }
    }

    return {
      snappedLat: bestLat,
      snappedLng: bestLng,
      distanceAlongRouteMeters: bestProgress,
      heading: Math.round(bestHeading),
    };
  }

  // Update position with incoming GPS coordinate
  updatePosition(input: {
    lat: number;
    lng: number;
    speedKmh?: number | null;
    heading?: number | null;
  }): { state: LiveTripState; autoArrived: boolean } {
    if (this.state.status !== "live") {
      return { state: this.getState(), autoArrived: false };
    }

    const { snappedLat, snappedLng, distanceAlongRouteMeters, heading } =
      this.snapToRoute(input.lat, input.lng);

    const progress = Math.min(
      100,
      Math.max(0, (distanceAlongRouteMeters / TOTAL_ROUTE_DISTANCE) * 100)
    );

    // Determine next stop
    let nextSeq = RAIPUR_STOPS.length;
    for (const stop of RAIPUR_STOPS) {
      if (stop.distanceAlongRouteMeters > distanceAlongRouteMeters + 15) {
        nextSeq = stop.seq;
        break;
      }
    }

    const collegeStop = RAIPUR_STOPS[RAIPUR_STOPS.length - 1];
    const distToCollege = haversineDistanceMeters(
      { lat: input.lat, lng: input.lng },
      { lat: collegeStop.lat, lng: collegeStop.lng }
    );

    const tripAgeMinutes = (Date.now() - this.state.startedAt) / 60000;
    const isAutoArrived = distToCollege <= 120 && tripAgeMinutes >= 3;

    if (isAutoArrived) {
      this.state = {
        ...this.state,
        status: "ended",
        endReason: "arrived",
        endedAt: Date.now(),
        updatedAt: Date.now(),
        speedKmh: 0,
        distanceAlongRouteMeters: TOTAL_ROUTE_DISTANCE,
        progressPercent: 100,
      };
      return { state: this.getState(), autoArrived: true };
    }

    this.state = {
      ...this.state,
      lat: snappedLat,
      lng: snappedLng,
      heading: input.heading ?? heading,
      speedKmh: input.speedKmh !== null && input.speedKmh !== undefined ? Math.max(0, input.speedKmh) : 28,
      distanceAlongRouteMeters,
      progressPercent: progress,
      nextStopSeq: nextSeq,
      updatedAt: Date.now(),
    };

    return { state: this.getState(), autoArrived: false };
  }

  // Calculate ETA to a specific stop index
  getEtaToStop(stopIndex: number): EtaResult {
    const targetStop = RAIPUR_STOPS[stopIndex] || RAIPUR_STOPS[0];
    const intermediateStopsCount = Math.max(
      0,
      targetStop.seq - this.state.nextStopSeq
    );

    return computeEta({
      busDistanceAlongRouteMeters: this.state.distanceAlongRouteMeters,
      targetStopDistanceMeters: targetStop.distanceAlongRouteMeters,
      intermediateStopsCount,
      reportedSpeedKmh: this.state.speedKmh,
      previousSmoothedSpeedKmh: 28,
      speedFloorKmh: 15,
      dwellPerStopSeconds: 30,
    });
  }
}

const globalForTrip = globalThis as unknown as { tripStore?: TripStore };
export const tripStore = globalForTrip.tripStore || new TripStore();
if (process.env.NODE_ENV !== "production") globalForTrip.tripStore = tripStore;
