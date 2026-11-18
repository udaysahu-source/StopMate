import { NextResponse } from "next/server";
import { tripStore, RAIPUR_STOPS, RAIPUR_ROUTE_COORDS } from "@/lib/trip-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = tripStore.getState();

  const etas = RAIPUR_STOPS.map((stop, i) => {
    return {
      stopId: stop.id,
      seq: stop.seq,
      ...tripStore.getEtaToStop(i),
    };
  });

  return NextResponse.json({
    trip: state,
    stops: RAIPUR_STOPS,
    routeCoordinates: RAIPUR_ROUTE_COORDS,
    etas,
    serverTime: Date.now(),
  });
}
