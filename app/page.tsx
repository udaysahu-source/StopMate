"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Map } from "@/components/Map";
import { EtaCard } from "@/components/EtaCard";
import { StopChips } from "@/components/StopChips";
import { AlertSwitch } from "@/components/AlertSwitch";
import { StopTimeline, TimelineStopStatus } from "@/components/StopTimeline";
import { Toast } from "@/components/Toast";
import {
  RAIPUR_STOPS,
  RAIPUR_ROUTE_COORDS,
  RouteStop,
  LiveTripState,
} from "@/lib/trip-service";
import { computeEta } from "@/lib/eta";

function formatClock(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = String(m).padStart(2, "0");
  return `${h}:${mm} ${ap}`;
}

export default function StudentTrackingPage() {
  const [selectedStopIndex, setSelectedStopIndex] = useState(2); // Default to Shankar Nagar
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [hasNotified, setHasNotified] = useState(false);

  const [tripState, setTripState] = useState<LiveTripState>({
    tripId: "initial",
    busCode: "01",
    busName: "Saddu line",
    driverName: "R. Verma",
    driverPhone: "9000000001",
    status: "live",
    lat: RAIPUR_ROUTE_COORDS[2][1],
    lng: RAIPUR_ROUTE_COORDS[2][0],
    heading: 205,
    speedKmh: 30,
    distanceAlongRouteMeters: 3500,
    progressPercent: 22,
    nextStopSeq: 3,
    startedAt: Date.now() - 300000,
    updatedAt: Date.now(),
    endedAt: null,
    endReason: null,
  });

  // Fetch live trip state from server API periodically
  const fetchTripState = useCallback(async () => {
    try {
      const res = await fetch("/api/trip/state", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.trip) {
          setTripState(data.trip);
        }
      }
    } catch (err) {
      // Offline fallback: keep current state
    }
  }, []);

  useEffect(() => {
    fetchTripState();
    const interval = setInterval(fetchTripState, 3500);
    return () => clearInterval(interval);
  }, [fetchTripState]);

  // Pure ETA Calculation for the user's selected stop
  const selectedStop = RAIPUR_STOPS[selectedStopIndex] || RAIPUR_STOPS[0];
  const intermediateStopsCount = Math.max(0, selectedStop.seq - tripState.nextStopSeq);

  const etaResult = computeEta({
    busDistanceAlongRouteMeters: tripState.distanceAlongRouteMeters,
    targetStopDistanceMeters: selectedStop.distanceAlongRouteMeters,
    intermediateStopsCount,
    reportedSpeedKmh: tripState.speedKmh,
    previousSmoothedSpeedKmh: 28,
  });

  // Proximity alert trigger
  useEffect(() => {
    if (tripState.status !== "live" || !alertEnabled || hasNotified) return;

    if (
      etaResult.etaMinutes !== null &&
      etaResult.etaMinutes <= 5 &&
      etaResult.etaMinutes > 0 &&
      !etaResult.isPassed
    ) {
      setHasNotified(true);
      setToastMessage(`Bus 01 is about 5 min from ${selectedStop.name}.`);
      setToastVisible(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [etaResult, selectedStop, alertEnabled, hasNotified, tripState.status]);

  // Status message & ETA display formatting
  const isLive = tripState.status === "live";
  const isEnded = tripState.status === "ended";
  const isIdle = tripState.status === "idle";
  const isPassed = etaResult.isPassed;
  const isAtStop =
    isLive &&
    Math.abs(tripState.distanceAlongRouteMeters - selectedStop.distanceAlongRouteMeters) < 60;

  let statusMessage = "";
  let etaOverride: string | undefined = undefined;

  if (isIdle) {
    etaOverride = "Bus stopped";
    statusMessage = "The driver ended this trip. Waiting for next run.";
  } else if (isEnded) {
    etaOverride = "Reached College";
    statusMessage = "Bus completed this run at SSIPMT College.";
  } else if (isAtStop) {
    etaOverride = "At your stop";
    statusMessage = `Bus 01 is boarding at ${selectedStop.name} now.`;
  } else if (isPassed) {
    etaOverride = "Passed your stop";
    statusMessage = `Bus 01 already departed ${selectedStop.name}.`;
  } else if (etaResult.etaMinutes !== null) {
    const arrivalTime = new Date(Date.now() + etaResult.etaMinutes * 60000);
    statusMessage = `Arrives ${formatClock(arrivalTime)} at ${selectedStop.name}`;
  }

  // Build timeline stop statuses
  const stopStatuses: TimelineStopStatus[] = RAIPUR_STOPS.map((stop) => {
    const isStopPassed = stop.seq < tripState.nextStopSeq;
    const isStopHere =
      isLive &&
      Math.abs(tripState.distanceAlongRouteMeters - stop.distanceAlongRouteMeters) < 60;
    const isStopNext = isLive && stop.seq === tripState.nextStopSeq;

    const stopEta = computeEta({
      busDistanceAlongRouteMeters: tripState.distanceAlongRouteMeters,
      targetStopDistanceMeters: stop.distanceAlongRouteMeters,
      intermediateStopsCount: Math.max(0, stop.seq - tripState.nextStopSeq),
      reportedSpeedKmh: tripState.speedKmh,
    });

    let timeLabel = "--";
    if (isStopHere) {
      timeLabel = "Here now";
    } else if (isStopPassed) {
      timeLabel = "Passed";
    } else if (isLive && stopEta.etaMinutes !== null) {
      timeLabel = formatClock(new Date(Date.now() + stopEta.etaMinutes * 60000));
    }

    return {
      state: isStopHere
        ? "now"
        : isStopPassed
        ? "done"
        : isStopNext
        ? "next"
        : "upcoming",
      timeLabel,
    };
  });

  const handleSelectStop = (index: number) => {
    setSelectedStopIndex(index);
    setHasNotified(false);
    setToastVisible(false);
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col justify-between">
      <div>
        {/* Compact Mobile Top App Bar */}
        <header className="px-3.5 py-2.5 flex items-center justify-between bg-bg border-b border-line/40">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-[9px] bg-yellow grid place-items-center flex-none shadow-xs"
              aria-hidden="true"
            >
              <svg width="17" height="17" viewBox="-12 -11 24 22">
                <rect x="-10" y="-9" width="20" height="16" rx="4" fill="#111827" />
                <rect x="-7" y="-6" width="14" height="6" rx="1.5" fill="#FFC400" />
                <circle cx="-5" cy="9" r="2.5" fill="#111827" />
                <circle cx="5" cy="9" r="2.5" fill="#111827" />
              </svg>
            </span>
            <div>
              <h1 className="font-extrabold text-[16px] leading-none text-ink flex items-center gap-1.5">
                Bus Tracker
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              </h1>
              <span className="text-[11px] font-semibold text-sub block mt-0.5">
                Saddu → Shankar Nagar → SSIPMT
              </span>
            </div>
          </div>

          {/* Secure Driver Portal Link */}
          <Link
            href="/driver"
            className="text-[12px] font-bold text-sub hover:text-ink bg-card hover:bg-soft border border-line rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors shadow-xs active:scale-95"
            title="Driver GPS portal"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="11" width="16" height="10" rx="3" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Driver
          </Link>
        </header>

        {/* Live Vector Map with OpenFreeMap & MapLibre */}
        <section className="relative w-full bg-card overflow-hidden" aria-label="Live Map">
          <Map
            busLat={tripState.lat}
            busLng={tripState.lng}
            heading={tripState.heading}
            speedKmh={tripState.speedKmh}
            isLive={isLive}
            isEnded={isEnded}
            selectedStopIndex={selectedStopIndex}
            stops={RAIPUR_STOPS}
            routeCoordinates={RAIPUR_ROUTE_COORDS}
            onSelectStop={handleSelectStop}
          />
        </section>

        {/* Compact Mobile Bottom Sheet */}
        <section className="relative -mt-5 bg-card rounded-t-sheet p-3.5 pb-6 flex flex-col gap-3 shadow-md border-t border-line/30">
          {/* Subtle drag handle */}
          <div className="w-9 h-1 bg-line rounded-full mx-auto -mt-1 mb-0.5" />

          {/* Big ETA and Arrival Subtitle */}
          <EtaCard
            busName="Bus 01"
            routeName="Saddu line"
            statusText={isLive ? "On time" : isEnded ? "Trip ended" : "Not running"}
            isLive={isLive}
            etaMinutes={etaResult.etaMinutes}
            statusMessage={statusMessage}
            mainDisplayOverride={etaOverride}
          />

          {/* 5-minute Proximity Alert Toast */}
          <Toast
            message={toastMessage}
            visible={toastVisible}
            onDismiss={() => setToastVisible(false)}
          />

          {/* Stop Chips Carousel */}
          <StopChips
            stops={RAIPUR_STOPS}
            selectedIndex={selectedStopIndex}
            onSelect={handleSelectStop}
          />

          {/* Alert Switch */}
          <AlertSwitch
            checked={alertEnabled}
            onChange={(enabled) => {
              setAlertEnabled(enabled);
              if (enabled) setHasNotified(false);
            }}
          />

          {/* Stops Timeline */}
          <StopTimeline
            stops={RAIPUR_STOPS}
            selectedIndex={selectedStopIndex}
            stopStatuses={stopStatuses}
            onSelectStop={handleSelectStop}
          />
        </section>
      </div>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-sub/70">
        StopMate v1.0 · Live College Bus Tracking · Raipur
      </footer>
    </div>
  );
}
