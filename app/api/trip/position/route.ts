import { NextResponse } from "next/server";
import { tripStore } from "@/lib/trip-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lng, speed_kmh, heading } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Invalid coordinates provided" },
        { status: 400 }
      );
    }

    const { state, autoArrived } = tripStore.updatePosition({
      lat,
      lng,
      speedKmh: typeof speed_kmh === "number" ? speed_kmh : null,
      heading: typeof heading === "number" ? heading : null,
    });

    return NextResponse.json({
      status: autoArrived ? "arrived" : "ok",
      trip: state,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 }
    );
  }
}
