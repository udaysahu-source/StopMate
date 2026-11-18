import { NextResponse } from "next/server";
import { tripStore } from "@/lib/trip-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, driverName, driverPhone } = body;

    if (action === "start") {
      const state = tripStore.startTrip(driverName, driverPhone);
      return NextResponse.json({ status: "started", trip: state });
    } else if (action === "end") {
      const state = tripStore.endTrip("driver");
      return NextResponse.json({ status: "ended", trip: state });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
