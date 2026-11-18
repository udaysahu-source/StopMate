import React, { useState } from "react";
import { TripButton } from "./TripButton";
import { DriverTrack } from "./DriverTrack";
import { StopItem } from "./StopChips";

interface DriverDashboardProps {
  driverName: string;
  busName?: string;
  isTripActive: boolean;
  isTripEnded: boolean;
  tripDurationFormatted: string;
  speedKmh: number;
  nextStopName: string;
  toCollegeMinutes: number | null;
  routeProgressPercent: number;
  stops: (StopItem & { progressPercent: number })[];
  onToggleTrip: () => void;
  onSignOut: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  driverName,
  busName = "Bus 01",
  isTripActive,
  isTripEnded,
  tripDurationFormatted,
  speedKmh,
  nextStopName,
  toCollegeMinutes,
  routeProgressPercent,
  stops,
  onToggleTrip,
  onSignOut,
}) => {
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOutClick = () => {
    if (isTripActive) {
      setSignOutError("End your trip before signing out.");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
      return;
    }
    setSignOutError(null);
    onSignOut();
  };

  const handleTripToggle = () => {
    setSignOutError(null);
    onToggleTrip();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2.5">
        <div>
          <b className="font-extrabold text-[19px] sm:text-[20px] text-ink block leading-tight">
            {busName}
          </b>
          <span className="text-sub text-[13px] sm:text-[14px]">Driver: {driverName}</span>
        </div>
        <span className="font-bold text-[12px] sm:text-[13px] rounded-full px-3 py-1 bg-green-light text-green whitespace-nowrap border border-green/20 flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          GPS strong
        </span>
      </div>

      {/* Trip Status Card */}
      <div
        className={`rounded-[22px] p-4.5 sm:p-5 text-center flex flex-col gap-1 transition-colors ${
          isTripActive ? "bg-green-light border border-green/20" : "bg-soft"
        }`}
      >
        <h2 className="m-0 font-extrabold text-[24px] sm:text-[26px] leading-tight text-ink">
          {isTripActive
            ? "Trip live"
            : isTripEnded
            ? "Reached College"
            : "Trip ended"}
        </h2>
        <p className="m-0 text-sub text-[13px] sm:text-[14px]">
          {isTripActive
            ? "Sharing your location with students."
            : isTripEnded
            ? "Trip ended automatically. Location sharing is off."
            : "You ended this trip early. Location sharing is off."}
        </p>
        <div className="font-extrabold text-[32px] sm:text-[36px] leading-none tabular-nums text-ink mt-1.5 tracking-tight">
          {tripDurationFormatted}
        </div>
      </div>

      {/* Main Start / End Trip Button */}
      <TripButton
        isTripActive={isTripActive}
        isTripEnded={isTripEnded}
        onClick={handleTripToggle}
      />

      {/* Stats Grid */}
      <dl className="grid grid-cols-3 gap-2 sm:gap-2.5 m-0">
        <div className="bg-soft rounded-2xl p-2.5 sm:p-3 text-center sm:text-left">
          <dt className="font-bold text-[10px] sm:text-[11px] leading-none uppercase tracking-[0.08em] text-sub mb-1.5">
            Speed
          </dt>
          <dd className="m-0 font-extrabold text-[18px] sm:text-[20px] leading-tight text-ink tabular-nums">
            {speedKmh} <small className="text-[11px] sm:text-[12px] font-semibold text-sub">km/h</small>
          </dd>
        </div>

        <div className="bg-soft rounded-2xl p-2.5 sm:p-3 text-center sm:text-left">
          <dt className="font-bold text-[10px] sm:text-[11px] leading-none uppercase tracking-[0.08em] text-sub mb-1.5">
            Next stop
          </dt>
          <dd className="m-0 font-extrabold text-[13px] sm:text-[15px] leading-tight text-ink truncate">
            {nextStopName}
          </dd>
        </div>

        <div className="bg-soft rounded-2xl p-2.5 sm:p-3 text-center sm:text-left">
          <dt className="font-bold text-[10px] sm:text-[11px] leading-none uppercase tracking-[0.08em] text-sub mb-1.5">
            To college
          </dt>
          <dd className="m-0 font-extrabold text-[18px] sm:text-[20px] leading-tight text-ink tabular-nums">
            {toCollegeMinutes === null ? "0" : Math.ceil(toCollegeMinutes)}{" "}
            <small className="text-[11px] sm:text-[12px] font-semibold text-sub">min</small>
          </dd>
        </div>
      </dl>

      {/* Route Progress Track */}
      <DriverTrack
        stops={stops}
        currentProgressPercent={routeProgressPercent}
      />

      <p className="m-0 text-[12px] sm:text-[13px] text-sub text-center sm:text-left">
        The trip ends automatically when you reach College.
      </p>

      {/* Sign out */}
      <div>
        <button
          type="button"
          onClick={handleSignOutClick}
          className="w-full border border-line bg-soft hover:bg-[#E8EBF0] text-ink rounded-2xl py-3.5 px-4 font-bold text-[15px] transition-all cursor-pointer min-h-[48px] active:scale-[0.98]"
        >
          Sign out
        </button>
        {signOutError && (
          <p
            role="status"
            className="m-0 mt-2 bg-orange-light text-orange rounded-xl p-2.5 font-semibold text-[13px] text-center"
          >
            {signOutError}
          </p>
        )}
      </div>
    </div>
  );
};
