"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { DriverLogin } from "@/components/DriverLogin";
import { DriverDashboard } from "@/components/DriverDashboard";
import {
  RAIPUR_STOPS,
  RAIPUR_ROUTE_COORDS,
  CUMULATIVE_DISTANCES,
  TOTAL_ROUTE_DISTANCE,
} from "@/lib/trip-service";

interface DriverAccount {
  name: string;
  phone: string;
  busCode: string;
  busName: string;
  status: "approved" | "pending" | "removed";
}

export default function DriverPortalPage() {
  const [driverUser, setDriverUser] = useState<DriverAccount | null>(null);
  const [isTripActive, setIsTripActive] = useState(false);
  const [isTripEnded, setIsTripEnded] = useState(false);
  const [tripStartedAt, setTripStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [currentProgressPercent, setCurrentProgressPercent] = useState(0);
  const [nextStopName, setNextStopName] = useState("Saddu Stop 2");
  const [toCollegeMinutes, setToCollegeMinutes] = useState<number | null>(35);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"searching" | "active" | "simulating" | "error" | "off">("off");
  const [locationMode, setLocationMode] = useState<"gps" | "sim">("gps");
  const [locationError, setLocationError] = useState<string | null>(null);

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simIndexRef = useRef<number>(0);

  // Restore saved driver session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stopmate_driver_session");
      if (saved) {
        setDriverUser(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleLoginSuccess = (user: { name: string; phone: string; status: "approved" | "pending" }) => {
    const fullAccount: DriverAccount = {
      name: user.name,
      phone: user.phone,
      busCode: "01",
      busName: "Saddu line",
      status: user.status,
    };
    setDriverUser(fullAccount);
    try {
      localStorage.setItem("stopmate_driver_session", JSON.stringify(fullAccount));
    } catch {}
  };

  const handleSignOut = () => {
    if (isTripActive) return;
    setDriverUser(null);
    try {
      localStorage.removeItem("stopmate_driver_session");
    } catch {}
  };

  // Screen Wake Lock API
  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        const lock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = lock;
        setWakeLockActive(true);
        lock.addEventListener("release", () => {
          setWakeLockActive(false);
        });
      } catch (err) {
        console.warn("Screen Wake Lock could not be acquired:", err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  }, []);

  // Post position to server API
  const sendPositionToServer = useCallback(
    async (lat: number, lng: number, reportedSpeed?: number, heading?: number) => {
      try {
        const res = await fetch("/api/trip/position", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat,
            lng,
            speed_kmh: reportedSpeed,
            heading,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "arrived") {
            setIsTripActive(false);
            setIsTripEnded(true);
            releaseWakeLock();
          }
          if (data.trip) {
            setCurrentProgressPercent(data.trip.progressPercent);
            setSpeedKmh(data.trip.speedKmh);
            const nextStop = RAIPUR_STOPS.find((s) => s.seq === data.trip.nextStopSeq);
            if (nextStop) setNextStopName(nextStop.name);
          }
        }
      } catch (err) {
        console.warn("Failed to transmit GPS position to server:", err);
      }
    },
    [releaseWakeLock]
  );

  // Timer loop for active trip duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTripActive && tripStartedAt) {
      timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - tripStartedAt) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTripActive, tripStartedAt]);

  // Geolocation watch management
  const startTracking = useCallback(() => {
    setLocationError(null);

    // Call server API to start trip
    fetch("/api/trip/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        driverName: driverUser?.name || "R. Verma",
        driverPhone: driverUser?.phone || "9000000001",
      }),
    }).catch(() => {});

    if (locationMode === "gps") {
      // Real Phone Hardware GPS
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setLocationError("Geolocation is not supported by your phone browser.");
        setGpsStatus("error");
        return;
      }

      setGpsStatus("searching");

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsStatus("active");
          const speed =
            pos.coords.speed !== null && pos.coords.speed >= 0
              ? Math.round(pos.coords.speed * 3.6)
              : 30;

          sendPositionToServer(
            pos.coords.latitude,
            pos.coords.longitude,
            speed,
            pos.coords.heading ?? undefined
          );
        },
        (err) => {
          console.warn("GPS error:", err);
          setLocationError("GPS location error: " + err.message);
          setGpsStatus("error");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );

      watchIdRef.current = watchId;
    } else {
      // College Route Simulator (Drives Saddu -> Shankar Nagar -> SSIPMT)
      setGpsStatus("simulating");
      simIndexRef.current = 0;

      simIntervalRef.current = setInterval(() => {
        const coords = RAIPUR_ROUTE_COORDS;
        if (simIndexRef.current >= coords.length) {
          simIndexRef.current = coords.length - 1;
        }

        const [lng, lat] = coords[simIndexRef.current];
        sendPositionToServer(lat, lng, 35, 205);

        simIndexRef.current = (simIndexRef.current + 1) % coords.length;
      }, 4000);
    }
  }, [locationMode, driverUser, sendPositionToServer]);

  const stopTracking = useCallback(() => {
    // Clear GPS watch
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Clear Simulation
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    setGpsStatus("off");
    setSpeedKmh(0);

    // Call server API to end trip
    fetch("/api/trip/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    }).catch(() => {});
  }, []);

  const handleToggleTrip = () => {
    if (isTripActive) {
      setIsTripActive(false);
      setIsTripEnded(true);
      releaseWakeLock();
      stopTracking();
    } else {
      setIsTripActive(true);
      setIsTripEnded(false);
      setTripStartedAt(Date.now());
      requestWakeLock();
      startTracking();
    }
  };

  useEffect(() => {
    return () => {
      releaseWakeLock();
      stopTracking();
    };
  }, [releaseWakeLock, stopTracking]);

  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col justify-between bg-bg">
      <div>
        {/* Driver Top Navigation Bar */}
        <header className="px-3.5 py-2.5 flex items-center justify-between bg-card border-b border-line/40">
          <Link
            href="/"
            className="text-[13px] font-bold text-sub hover:text-ink flex items-center gap-1.5 transition-colors active:scale-95"
          >
            ← Student View
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow" />
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-ink">
              Driver Portal
            </span>
          </div>
        </header>

        {/* SECURITY GATE 1: Unauthenticated */}
        {!driverUser && (
          <div className="p-3.5 sm:p-4">
            <div className="bg-card rounded-2xl shadow-sm border border-line/50 overflow-hidden">
              <DriverLogin onLoginSuccess={handleLoginSuccess} />
            </div>
          </div>
        )}

        {/* SECURITY GATE 2: Pending Driver */}
        {driverUser && driverUser.status === "pending" && (
          <div className="p-4 flex flex-col gap-4">
            <div className="bg-orange-light border border-orange/30 rounded-2xl p-5 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange/10 grid place-items-center text-[24px]">
                ⏳
              </div>
              <h2 className="font-extrabold text-[20px] text-ink m-0">
                Waiting for Approval
              </h2>
              <p className="text-[14px] text-sub m-0 leading-relaxed">
                Hello <strong>{driverUser.name}</strong>, your driver account is registered but is currently <strong>pending admin approval</strong>.
              </p>
              <div className="bg-white/80 rounded-xl p-3 text-[13px] text-ink w-full">
                <strong>Status:</strong> Pending Approval
                <br />
                <strong>Registered Phone:</strong> {driverUser.phone}
              </div>
              <p className="text-[12px] text-sub m-0">
                Contact the admin (Uday) to verify and approve your bus assignment. You cannot broadcast GPS until approved.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full mt-2 border border-line bg-white hover:bg-soft text-ink rounded-xl py-3 font-bold text-[14px] cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* SECURITY GATE 3: Approved Driver */}
        {driverUser && driverUser.status === "approved" && (
          <div className="p-3.5 sm:p-4 flex flex-col gap-3">
            {/* GPS & Wake Lock Status Pill */}
            {isTripActive && (
              <div className="bg-[#E4F5EA] border border-green/30 rounded-xl px-3 py-2 flex items-center justify-between text-[12px] font-bold text-green">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green animate-ping" />
                  {gpsStatus === "simulating"
                    ? "🚌 Route Simulation Active"
                    : "🛰️ Phone GPS Live"}
                </span>
                <span className="text-[11px] font-semibold text-sub">Screen Kept Awake</span>
              </div>
            )}

            {locationError && (
              <div className="bg-orange-light border border-orange/30 rounded-xl p-3 text-[13px] text-orange font-semibold">
                ⚠️ {locationError}
              </div>
            )}

            {/* In-Cab Driver Console */}
            <div className="bg-card rounded-2xl shadow-sm border border-line/40 overflow-hidden">
              <DriverDashboard
                driverName={driverUser.name}
                busName={`Bus ${driverUser.busCode} (Saddu line)`}
                isTripActive={isTripActive}
                isTripEnded={isTripEnded}
                tripDurationFormatted={formatTimer(elapsedSeconds)}
                speedKmh={speedKmh}
                nextStopName={nextStopName}
                toCollegeMinutes={toCollegeMinutes}
                routeProgressPercent={currentProgressPercent}
                stops={RAIPUR_STOPS}
                onToggleTrip={handleToggleTrip}
                onSignOut={handleSignOut}
              />
            </div>

            {/* GPS Source Toggle (For Testing Convenience) */}
            {!isTripActive && (
              <div className="bg-soft rounded-xl p-3 flex items-center justify-between border border-line/50">
                <div>
                  <span className="block text-[12px] font-bold text-ink">
                    Tracking Mode
                  </span>
                  <span className="block text-[11px] text-sub">
                    {locationMode === "gps"
                      ? "Uses real phone GPS hardware"
                      : "Simulates route for indoor testing"}
                  </span>
                </div>
                <div className="flex bg-white rounded-lg p-0.5 border border-line">
                  <button
                    type="button"
                    onClick={() => setLocationMode("gps")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      locationMode === "gps"
                        ? "bg-ink text-white"
                        : "text-sub hover:text-ink"
                    }`}
                  >
                    🛰️ Real GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode("sim")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      locationMode === "sim"
                        ? "bg-ink text-white"
                        : "text-sub hover:text-ink"
                    }`}
                  >
                    🚌 Simulate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Driver Footer */}
      <footer className="text-center py-3 text-[11px] text-sub/70">
        StopMate Driver Portal · College Bus GPS Sharing
      </footer>
    </div>
  );
}
