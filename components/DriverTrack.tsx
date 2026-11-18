import React from "react";
import { StopItem } from "./StopChips";

interface DriverTrackProps {
  stops: (StopItem & { progressPercent: number })[];
  currentProgressPercent: number;
}

export const DriverTrack: React.FC<DriverTrackProps> = ({
  stops,
  currentProgressPercent,
}) => {
  return (
    <div>
      <p className="font-bold text-[12px] leading-none uppercase tracking-[0.08em] text-sub mb-2">
        Route progress
      </p>
      <div className="relative h-[10px] rounded-full bg-line mx-1.5 mt-1.5 mb-7">
        {/* Yellow Fill Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full bg-yellow transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, currentProgressPercent))}%` }}
        />

        {/* Stop Dots and Labels */}
        {stops.map((stop, i) => {
          const isPassed = stop.progressPercent <= currentProgressPercent + 0.1;
          const isFirst = i === 0;
          const isLast = i === stops.length - 1;
          const isMid = i === Math.floor(stops.length / 2);

          return (
            <React.Fragment key={stop.name + i}>
              {/* Dot */}
              <span
                className={`absolute top-1/2 w-[14px] h-[14px] -mt-[7px] -ml-[7px] rounded-full bg-white transition-colors duration-200 ${
                  isPassed
                    ? "border-[3px] border-yellow-hover"
                    : "border-[3px] border-[#B5BECB]"
                }`}
                style={{ left: `${stop.progressPercent}%` }}
              />

              {/* Label: First, Mid, and Last stops */}
              {(isFirst || isLast || isMid) && (
                <span
                  className={`absolute top-[18px] text-[11px] font-semibold text-sub whitespace-nowrap ${
                    isFirst
                      ? "left-0 transform-none"
                      : isLast
                      ? "left-full -translate-x-full"
                      : "-translate-x-1/2"
                  }`}
                  style={{ left: isFirst ? "0%" : isLast ? "100%" : `${stop.progressPercent}%` }}
                >
                  {stop.short}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
