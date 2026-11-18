import React from "react";

interface TripButtonProps {
  isTripActive: boolean;
  isTripEnded?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const TripButton: React.FC<TripButtonProps> = ({
  isTripActive,
  isTripEnded,
  onClick,
  disabled = false,
}) => {
  if (isTripActive) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full border-2 border-red bg-white hover:bg-red-light text-red rounded-btn py-6 px-4 font-extrabold text-[20px] leading-none transition-colors duration-150 cursor-pointer min-h-[68px] disabled:opacity-50"
      >
        End trip
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full border-0 bg-yellow hover:bg-yellow-hover text-ink rounded-btn py-6 px-4 font-extrabold text-[20px] leading-none transition-colors duration-150 cursor-pointer shadow-sm min-h-[68px] disabled:opacity-50"
    >
      {isTripEnded ? "Start new trip" : "Start trip"}
    </button>
  );
};
