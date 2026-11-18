import React from "react";

interface EtaCardProps {
  busName?: string;
  routeName?: string;
  statusText?: string;
  isLive?: boolean;
  etaMinutes?: number | null;
  statusMessage?: string;
  mainDisplayOverride?: string;
}

export const EtaCard: React.FC<EtaCardProps> = ({
  busName = "Bus 01",
  routeName = "Saddu line",
  statusText = "On time",
  isLive = true,
  etaMinutes = 14,
  statusMessage = "Arrives at chosen stop",
  mainDisplayOverride,
}) => {
  const displayText = mainDisplayOverride
    ? mainDisplayOverride
    : etaMinutes === null
    ? "--"
    : etaMinutes < 1
    ? "Arriving"
    : Math.ceil(etaMinutes);

  const isNumeric = !isNaN(Number(displayText));

  return (
    <div className="flex flex-col gap-2.5">
      {/* Bus name & status chip row */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-[16px] text-ink flex items-center gap-1.5 truncate">
          <span>{busName}</span>
          <span className="font-medium text-sub text-[14px]">· {routeName}</span>
        </div>
        <span
          className={`font-bold text-[12px] sm:text-[13px] rounded-full px-3 py-1 whitespace-nowrap transition-colors shadow-xs ${
            isLive
              ? "bg-green-light text-green border border-green/20"
              : "bg-[#E8EBF0] text-sub"
          }`}
        >
          {statusText}
        </span>
      </div>

      {/* Big ETA */}
      <div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            id="sBig"
            className={`font-extrabold text-ink tabular-nums tracking-[-0.02em] select-none ${
              !isNumeric
                ? "text-[28px] sm:text-[34px] leading-tight"
                : "text-[48px] sm:text-[54px] leading-none"
            }`}
          >
            {displayText}
          </span>
          {isNumeric && (
            <span id="sUnit" className="font-bold text-[18px] sm:text-[20px] text-sub select-none">
              min
            </span>
          )}
        </div>
        <p id="sSub" className="mt-1 text-[13px] sm:text-[14px] text-sub font-medium leading-snug">
          {statusMessage}
        </p>
      </div>
    </div>
  );
};
