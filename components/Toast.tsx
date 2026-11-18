import React from "react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss, visible }) => {
  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-2.5 bg-blue text-white rounded-2xl p-3 sm:px-3.5 font-semibold text-[14px] shadow-sm animate-fadeIn"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="border-0 bg-white/20 hover:bg-white/30 text-white rounded-xl px-2.5 py-1.5 font-bold text-[13px] transition-colors cursor-pointer whitespace-nowrap min-h-[36px]"
      >
        Got it
      </button>
    </div>
  );
};
