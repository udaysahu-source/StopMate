"use client";

import React from "react";

interface AlertSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
  description?: string;
}

export const AlertSwitch: React.FC<AlertSwitchProps> = ({
  checked,
  onChange,
  title = "Alert me 5 min before",
  description = "In the app this is an in-app banner and vibration.",
}) => {
  const handleToggle = () => {
    const nextVal = !checked;
    onChange(nextVal);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <div
      onClick={handleToggle}
      className="flex items-center justify-between gap-3 bg-soft rounded-2xl p-3 sm:px-3.5 transition-colors cursor-pointer select-none active:bg-[#E8EBF0]"
      role="button"
      tabIndex={0}
      aria-label={title}
    >
      <div className="pr-2">
        <b className="block text-[15px] text-ink font-bold leading-tight">{title}</b>
        <small className="text-sub text-[13px] block mt-0.5">{description}</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={`flex-none w-[50px] h-[30px] rounded-full relative transition-colors duration-200 cursor-pointer touch-manipulation active:scale-95 ${
          checked ? "bg-blue" : "bg-[#C9D0DA]"
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-150 ${
            checked ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};
