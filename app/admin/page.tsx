"use client";

import React, { useState } from "react";
import Link from "next/link";

interface DriverRow {
  id: string;
  name: string;
  phone: string;
  status: "approved" | "pending" | "removed";
  busCode: string;
}

export default function AdminPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([
    {
      id: "1",
      name: "R. Verma",
      phone: "90000 00001",
      status: "approved",
      busCode: "01",
    },
    {
      id: "2",
      name: "S. Patel",
      phone: "90000 00002",
      status: "pending",
      busCode: "01",
    },
  ]);

  const [activeTrip, setActiveTrip] = useState<boolean>(true);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");

  const handleApprove = (id: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "approved" } : d))
    );
  };

  const handleRemove = (id: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "removed" } : d))
    );
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone) return;
    setDrivers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newDriverName,
        phone: newDriverPhone,
        status: "pending",
        busCode: "01",
      },
    ]);
    setNewDriverName("");
    setNewDriverPhone("");
  };

  return (
    <div className="max-w-[700px] mx-auto flex flex-col gap-4 sm:gap-5 px-3 sm:px-4">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-[14px] font-bold text-sub hover:text-ink flex items-center gap-1.5 transition-colors active:scale-95 py-1"
        >
          ← Back to Student View
        </Link>
        <span className="text-[12px] font-bold uppercase tracking-wider text-sub">
          Admin Portal
        </span>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="m-0 font-extrabold text-[24px] sm:text-[28px] text-ink leading-tight">
          Bus Tracker Admin
        </h1>
        <p className="m-0 text-sub text-[13px] sm:text-[14px]">
          Manage registered drivers, approve accounts, assign buses, and end active trips.
        </p>
      </header>

      {/* Active Trips Card */}
      <section className="bg-card rounded-[22px] sm:rounded-card p-4 sm:p-6 shadow-phone flex flex-col gap-3.5">
        <h2 className="m-0 font-extrabold text-[18px] sm:text-[20px] text-ink">
          Active Trips
        </h2>
        {activeTrip ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-soft rounded-2xl">
            <div>
              <b className="block text-[15px] sm:text-[16px] text-ink">Bus 01 (Saddu line)</b>
              <span className="text-sub text-[13px]">
                Driver: R. Verma · Started 12 min ago
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTrip(false)}
              className="border-0 bg-red hover:bg-red/90 text-white rounded-xl px-4 py-2 font-bold text-[13px] transition-all cursor-pointer min-h-[40px] active:scale-95"
            >
              Force end trip
            </button>
          </div>
        ) : (
          <p className="m-0 text-sub text-[13px] sm:text-[14px]">
            No buses currently have an active trip.
          </p>
        )}
      </section>

      {/* Drivers List */}
      <section className="bg-card rounded-[22px] sm:rounded-card p-4 sm:p-6 shadow-phone flex flex-col gap-3.5">
        <h2 className="m-0 font-extrabold text-[18px] sm:text-[20px] text-ink">
          Drivers & Approvals
        </h2>

        <div className="flex flex-col gap-2.5">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-soft rounded-2xl"
            >
              <div>
                <b className="block text-[15px] text-ink">{driver.name}</b>
                <span className="text-sub text-[13px]">
                  Phone: {driver.phone} · Bus: {driver.busCode}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[12px] font-bold rounded-full px-2.5 py-1 ${
                    driver.status === "approved"
                      ? "bg-green-light text-green"
                      : driver.status === "pending"
                      ? "bg-orange-light text-orange"
                      : "bg-[#E8EBF0] text-sub"
                  }`}
                >
                  {driver.status}
                </span>

                {driver.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleApprove(driver.id)}
                    className="border-0 bg-yellow hover:bg-yellow-hover text-ink rounded-xl px-3 py-1.5 font-bold text-[12px] transition-all cursor-pointer active:scale-95"
                  >
                    Approve
                  </button>
                )}

                {driver.status !== "removed" && (
                  <button
                    type="button"
                    onClick={() => handleRemove(driver.id)}
                    className="border-0 bg-[#E8EBF0] hover:bg-red-light hover:text-red text-sub rounded-xl px-3 py-1.5 font-bold text-[12px] transition-all cursor-pointer active:scale-95"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Driver Form */}
        <form onSubmit={handleAddDriver} className="flex flex-col gap-3 mt-2 pt-3 border-t border-line">
          <h3 className="m-0 font-bold text-[15px] text-ink">
            Register New Driver
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              placeholder="Full name (e.g. Ramesh Kumar)"
              value={newDriverName}
              onChange={(e) => setNewDriverName(e.target.value)}
              className="p-3 rounded-xl border border-line bg-card text-ink text-[14px] font-semibold focus:outline-none focus:border-blue"
            />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Phone (e.g. 90000 00003)"
              value={newDriverPhone}
              onChange={(e) => setNewDriverPhone(e.target.value)}
              className="p-3 rounded-xl border border-line bg-card text-ink text-[14px] font-semibold focus:outline-none focus:border-blue"
            />
          </div>
          <button
            type="submit"
            className="self-start border-0 bg-yellow hover:bg-yellow-hover text-ink rounded-xl px-5 py-2.5 font-bold text-[14px] transition-all cursor-pointer active:scale-95"
          >
            Add Driver
          </button>
        </form>
      </section>
    </div>
  );
}
