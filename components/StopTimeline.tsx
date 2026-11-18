"use client";

import React from "react";
import { StopItem } from "./StopChips";

export interface TimelineStopStatus {
  state: "done" | "now" | "next" | "upcoming";
  timeLabel: string;
}

interface StopTimelineProps {
  stops: StopItem[];
  selectedIndex: number;
  stopStatuses: TimelineStopStatus[];
  onSelectStop?: (index: number) => void;
}

export const StopTimeline: React.FC<StopTimelineProps> = ({
  stops,
  selectedIndex,
  stopStatuses,
  onSelectStop,
}) => {
  const handleStopClick = (index: number) => {
    onSelectStop?.(index);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-[12px] leading-none uppercase tracking-[0.08em] text-sub">
          Stops
        </p>
        <span className="text-[11px] font-semibold text-sub/70 md:hidden">
          Tap stop to select
        </span>
      </div>

      <ul className="list-none m-0 p-0 flex flex-col">
        {stops.map((stop, i) => {
          const status = stopStatuses[i] || { state: "upcoming", timeLabel: "--" };
          const isSelected = i === selectedIndex;
          const isDone = status.state === "done";
          const isNow = status.state === "now";
          const isNext = status.state === "next";

          return (
            <li
              key={stop.name + i}
              onClick={() => handleStopClick(i)}
              className={`relative grid grid-cols-[22px_minmax(0,1fr)_auto] gap-3 items-center min-h-[46px] px-2 py-1 -mx-2 rounded-xl transition-all cursor-pointer select-none active:bg-soft/80 ${
                isSelected ? "bg-blue-light/50 font-bold" : "hover:bg-soft/40"
              }`}
              role="button"
              tabIndex={0}
              aria-label={`Select ${stop.name}`}
            >
              {/* Vertical connector line */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[18px] top-[-23px] bottom-[23px] w-[2px] bg-line"
                />
              )}

              {/* Pip */}
              <span
                className={`w-[12px] h-[12px] rounded-full justify-self-center relative z-10 transition-colors ${
                  isNow
                    ? "border-[3px] border-yellow-hover bg-yellow animate-pulse"
                    : isNext
                    ? "border-[3px] border-blue bg-blue-light"
                    : isDone
                    ? "border-[3px] border-[#B5BECB] bg-[#B5BECB]"
                    : "border-[3px] border-[#B5BECB] bg-white"
                }`}
              />

              {/* Stop Name & 'YOU' indicator */}
              <div
                className={`text-[15px] truncate overflow-wrap-anywhere ${
                  isDone
                    ? "text-[#8A94A4] font-medium"
                    : isSelected
                    ? "text-blue font-bold"
                    : "text-ink font-semibold"
                }`}
              >
                {stop.name}
                {isSelected && (
                  <span className="inline-block ml-1.5 bg-blue text-white text-[10px] font-extrabold rounded-md px-1.5 py-0.5 tracking-[0.04em] align-middle shadow-xs">
                    YOUR STOP
                  </span>
                )}
              </div>

              {/* Time Label */}
              <div
                className={`font-semibold tabular-nums text-[13px] sm:text-[14px] whitespace-nowrap ${
                  isNow
                    ? "text-orange font-bold"
                    : isDone
                    ? "text-[#8A94A4]"
                    : "text-sub"
                }`}
              >
                {status.timeLabel}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
