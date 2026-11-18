"use client";

import React, { useRef, useEffect } from "react";

export interface StopItem {
  id?: string;
  name: string;
  short: string;
}

interface StopChipsProps {
  stops: StopItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const StopChips: React.FC<StopChipsProps> = ({
  stops,
  selectedIndex,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-scroll selected chip into view on mobile
  useEffect(() => {
    const activeChip = chipsRef.current[selectedIndex];
    if (activeChip && containerRef.current) {
      activeChip.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const handleChipClick = (index: number) => {
    onSelect(index);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-[12px] leading-none uppercase tracking-[0.08em] text-sub">
          My stop
        </p>
        <span className="text-[11px] font-semibold text-sub/70 md:hidden">
          Swipe to see all stops →
        </span>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5 momentum-scroll"
          role="group"
          aria-label="Choose your stop"
        >
          {stops.map((stop, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                key={stop.name + i}
                ref={(el) => {
                  chipsRef.current[i] = el;
                }}
                type="button"
                className={`flex-none min-h-[44px] px-4 py-2 rounded-full font-semibold text-[14px] transition-all cursor-pointer border-[1.5px] select-none active:scale-95 touch-manipulation ${
                  isSelected
                    ? "bg-ink border-ink text-white shadow-sm ring-2 ring-ink/10"
                    : "bg-card border-line text-ink hover:border-sub/40 active:bg-soft"
                }`}
                aria-pressed={isSelected}
                onClick={() => handleChipClick(i)}
              >
                {stop.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
