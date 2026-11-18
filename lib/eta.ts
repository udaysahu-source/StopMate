// Pure ETA Engine for StopMate
// SYSTEM_DESIGN.md Section 6:
// - Snaps position to route polyline
// - Calculates remaining distance
// - Smoothed speed with floor (15 km/h) and initial default (20 km/h)
// - Dwell time of 30 seconds per intermediate stop

export interface EtaStopInput {
  name: string;
  distanceAlongRouteMeters: number;
}

export interface EtaCalculationInput {
  busDistanceAlongRouteMeters: number;
  targetStopDistanceMeters: number;
  intermediateStopsCount: number;
  reportedSpeedKmh?: number | null;
  previousSmoothedSpeedKmh?: number | null;
  speedFloorKmh?: number; // default 15
  dwellPerStopSeconds?: number; // default 30
}

export interface EtaResult {
  etaSeconds: number | null;
  etaMinutes: number | null;
  isPassed: boolean;
  smoothedSpeedKmh: number;
  remainingDistanceMeters: number;
}

export function computeEta(input: EtaCalculationInput): EtaResult {
  const {
    busDistanceAlongRouteMeters,
    targetStopDistanceMeters,
    intermediateStopsCount,
    reportedSpeedKmh,
    previousSmoothedSpeedKmh,
    speedFloorKmh = 15,
    dwellPerStopSeconds = 30,
  } = input;

  const remainingDistanceMeters =
    targetStopDistanceMeters - busDistanceAlongRouteMeters;

  // If bus has already passed the stop (with a small margin of 10m)
  if (remainingDistanceMeters < -10) {
    return {
      etaSeconds: null,
      etaMinutes: null,
      isPassed: true,
      smoothedSpeedKmh: 0,
      remainingDistanceMeters,
    };
  }

  // Calculate smoothed speed using exponential moving average
  // v = 0.3 * new + 0.7 * v_prev, with floor at 15 km/h
  let currentSpeed = reportedSpeedKmh ?? 20;
  if (previousSmoothedSpeedKmh !== undefined && previousSmoothedSpeedKmh !== null) {
    currentSpeed = 0.3 * currentSpeed + 0.7 * previousSmoothedSpeedKmh;
  }
  const effectiveSpeedKmh = Math.max(speedFloorKmh, currentSpeed);
  const speedMetersPerSecond = (effectiveSpeedKmh * 1000) / 3600;

  // Travel time + dwell time
  const travelTimeSeconds = remainingDistanceMeters / speedMetersPerSecond;
  const dwellTimeSeconds = Math.max(0, intermediateStopsCount) * dwellPerStopSeconds;
  const totalEtaSeconds = Math.max(0, Math.round(travelTimeSeconds + dwellTimeSeconds));
  const totalEtaMinutes = Math.ceil(totalEtaSeconds / 60);

  return {
    etaSeconds: totalEtaSeconds,
    etaMinutes: totalEtaMinutes,
    isPassed: false,
    smoothedSpeedKmh: Math.round(effectiveSpeedKmh * 10) / 10,
    remainingDistanceMeters: Math.max(0, remainingDistanceMeters),
  };
}
