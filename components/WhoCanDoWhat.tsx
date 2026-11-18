"use client";

import React, { useState } from "react";

export const WhoCanDoWhat: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-card rounded-none sm:rounded-card p-4 sm:p-6 shadow-none sm:shadow-phone flex flex-col gap-3.5 border-t sm:border-t-0 border-line">
      {/* Mobile Accordion Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none py-1"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-soft grid place-items-center text-sub text-[13px] font-bold">
            ℹ️
          </span>
          <h2 className="m-0 font-extrabold text-[17px] sm:text-[20px] leading-tight text-ink">
            Who can do what & Security
          </h2>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
          className="w-8 h-8 rounded-full bg-soft text-sub flex items-center justify-center transition-transform duration-200"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Expandable Content (Always visible on desktop, toggleable on mobile) */}
      <div className={`flex flex-col gap-4 ${isExpanded ? "block" : "hidden sm:flex"}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-soft rounded-[18px] p-3.5 sm:p-4 flex flex-col gap-2">
            <h3 className="m-0 font-extrabold text-[16px] text-ink">Student</h3>
            <p className="m-0 text-sub text-[13px]">
              Anyone with the link. No sign in.
            </p>
            <ul className="m-0 pl-4.5 flex flex-col gap-1 text-[13px] text-ink">
              <li>See the live bus and ETA</li>
              <li>Pick My stop and get alerts</li>
              <li className="text-red font-semibold">Cannot start, stop or change GPS</li>
            </ul>
          </div>

          <div className="bg-soft rounded-[18px] p-3.5 sm:p-4 flex flex-col gap-2">
            <h3 className="m-0 font-extrabold text-[16px] text-ink">Driver</h3>
            <p className="m-0 text-sub text-[13px]">
              Added and approved by admin. Signs in.
            </p>
            <ul className="m-0 pl-4.5 flex flex-col gap-1 text-[13px] text-ink">
              <li>Start and end a trip on their bus</li>
              <li>Phone shares GPS only during a trip</li>
              <li className="text-red font-semibold">Cannot add drivers or control other buses</li>
            </ul>
          </div>

          <div className="bg-soft rounded-[18px] p-3.5 sm:p-4 flex flex-col gap-2">
            <h3 className="m-0 font-extrabold text-[16px] text-ink">Admin</h3>
            <p className="m-0 text-sub text-[13px]">Uday, for now.</p>
            <ul className="m-0 pl-4.5 flex flex-col gap-1 text-[13px] text-ink">
              <li>Add, approve and remove drivers</li>
              <li>Assign each driver to a bus</li>
              <li>End any trip if something goes wrong</li>
            </ul>
          </div>
        </div>

        <h3 className="m-0 font-extrabold text-[16px] sm:text-[18px] leading-tight text-ink mt-1">
          How the real app protects tracking
        </h3>
        <p className="m-0 text-[13px] text-sub">
          The sign in on this page is a demo preview. Hiding a button protects nothing, so in the real app the server makes every decision.
        </p>
        <ul className="m-0 pl-4.5 flex flex-col gap-2 text-[13px] text-ink leading-relaxed">
          <li>
            Roles live in a <code className="font-semibold bg-soft px-1 rounded">profiles</code> table in the database: phone, name, assigned bus, and status of <code className="font-semibold">pending</code>, <code className="font-semibold">approved</code> or <code className="font-semibold">removed</code>.
          </li>
          <li>
            Row Level Security lets everyone read bus positions, but only the approved driver assigned to that bus can write a position or start/end its trip.
          </li>
          <li>
            One active trip per bus. A second Start trip is refused while one is running.
          </li>
          <li>
            The server ends the trip when a position lands within about 100 m of College. If no position arrives for 2 minutes, students see "Bus offline".
          </li>
          <li>
            Location is stored only during a trip. Removing a driver in the admin stops their access at once.
          </li>
        </ul>
      </div>
    </section>
  );
};
