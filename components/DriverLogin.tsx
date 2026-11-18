"use client";

import React, { useState } from "react";

interface DriverLoginProps {
  onLoginSuccess: (driverInfo: { name: string; phone: string; status: "approved" | "pending" }) => void;
}

export const DriverLogin: React.FC<DriverLoginProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState("90000 00001");
  const [pin, setPin] = useState("1234");
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now < lockUntil) {
      setError(`Too many attempts. Wait ${Math.ceil((lockUntil - now) / 1000)} seconds.`);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter your 10-digit registered phone number.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("Please enter your 4-digit driver PIN.");
      return;
    }

    // Registered demo drivers matching security specification
    const DRIVER_REGISTRY: Record<
      string,
      { pin: string; name: string; status: "approved" | "pending" }
    > = {
      "9000000001": { pin: "1234", name: "R. Verma", status: "approved" },
      "9000000002": { pin: "5678", name: "S. Patel", status: "pending" },
    };

    const user = DRIVER_REGISTRY[cleanPhone];
    if (!user) {
      setError("This phone number is not registered as a driver. Contact admin to be added.");
      return;
    }

    if (user.pin !== pin) {
      const nextTries = tries + 1;
      if (nextTries >= 3) {
        setTries(0);
        setLockUntil(now + 30000);
        setError("Too many invalid attempts. Account temporarily locked for 30 seconds.");
      } else {
        setTries(nextTries);
        setError(`Incorrect PIN. ${3 - nextTries} attempts remaining.`);
      }
      return;
    }

    setError(null);
    setTries(0);
    onLoginSuccess({
      name: user.name,
      phone: cleanPhone,
      status: user.status,
    });
  };

  const handleQuickFill = (presetPhone: string, presetPin: string) => {
    setPhone(presetPhone);
    setPin(presetPin);
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-3.5" noValidate>
      {/* Header with Lock Icon */}
      <div className="flex gap-3 items-center">
        <span
          className="w-10 h-10 rounded-[12px] bg-soft grid place-items-center flex-none border border-line"
          aria-hidden="true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111827"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="11" width="16" height="10" rx="3" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <div>
          <b className="block font-extrabold text-[18px] sm:text-[19px] leading-tight text-ink">
            Driver Verification
          </b>
          <span className="block text-sub text-[12px] sm:text-[13px] mt-0.5">
            Only approved drivers can broadcast bus location.
          </span>
        </div>
      </div>

      {/* Phone Input */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="dPhone"
          className="font-bold text-[11px] leading-none uppercase tracking-[0.08em] text-sub"
        >
          Registered Phone Number
        </label>
        <input
          id="dPhone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="90000 00001"
          maxLength={11}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="font-semibold text-[17px] p-3 rounded-xl border border-line bg-card text-ink w-full transition-colors focus:border-blue focus:outline-none"
        />
      </div>

      {/* PIN Input */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="dPin"
          className="font-bold text-[11px] leading-none uppercase tracking-[0.08em] text-sub"
        >
          4-Digit PIN
        </label>
        <input
          id="dPin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={4}
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="font-semibold text-[17px] p-3 rounded-xl border border-line bg-card text-ink w-full transition-colors focus:border-blue focus:outline-none"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="m-0 bg-orange-light text-orange rounded-xl p-3 font-semibold text-[13px] border border-orange/20"
        >
          {error}
        </p>
      )}

      {/* Sign In Button */}
      <button
        type="submit"
        className="w-full border-0 bg-yellow hover:bg-yellow-hover text-ink rounded-btn py-4 px-4 font-extrabold text-[18px] leading-none transition-all cursor-pointer shadow-sm min-h-[54px] active:scale-[0.98]"
      >
        Sign in to Driver Console
      </button>

      {/* Mobile Testing Quick-Fill helper */}
      <div className="bg-soft rounded-xl p-3 flex flex-col gap-2 border border-line/50">
        <span className="text-[11px] font-bold uppercase tracking-wider text-sub">
          Test Credentials (Tap to fill):
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("9000000001", "1234")}
            className="flex-1 bg-white hover:bg-blue-light border border-line rounded-lg py-2 px-2 text-[12px] font-semibold text-ink transition-colors active:scale-95"
          >
            ✓ Approved Driver
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("9000000002", "5678")}
            className="flex-1 bg-white hover:bg-orange-light border border-line rounded-lg py-2 px-2 text-[12px] font-semibold text-sub transition-colors active:scale-95"
          >
            ⏳ Pending Driver
          </button>
        </div>
      </div>

      <p className="m-0 text-[12px] text-sub text-center leading-normal">
        Students do not sign in. Watch the bus on the public Student screen.
      </p>
    </form>
  );
};
