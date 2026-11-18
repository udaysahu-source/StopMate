"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import { RouteStop } from "@/lib/trip-service";

interface MapProps {
  busLat: number;
  busLng: number;
  heading: number;
  speedKmh: number;
  isLive: boolean;
  isEnded?: boolean;
  selectedStopIndex: number;
  stops: RouteStop[];
  routeCoordinates: [number, number][]; // [lng, lat]
  onSelectStop?: (index: number) => void;
}

export const Map: React.FC<MapProps> = ({
  busLat,
  busLng,
  heading,
  speedKmh,
  isLive,
  isEnded,
  selectedStopIndex,
  stops,
  routeCoordinates,
  onSelectStop,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const busMarkerRef = useRef<MapLibreMarker | null>(null);
  const busElementRef = useRef<HTMLDivElement | null>(null);
  const stopMarkersRef = useRef<MapLibreMarker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useFallbackSvg, setUseFallbackSvg] = useState(false);

  // Initialize MapLibre GL
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const maplibregl = (await import("maplibre-gl")).default;

        if (isCancelled) return;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: "https://tiles.openfreemap.org/styles/positron",
          center: [busLng, busLat],
          zoom: 12.8,
          attributionControl: false,
        });

        map.on("load", () => {
          if (isCancelled) return;
          mapRef.current = map;
          setMapLoaded(true);

          // Add Route Source & Line Layer
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: routeCoordinates,
              },
            },
          });

          // Traveled route (grey)
          map.addLayer({
            id: "route-line-bg",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#2563EB",
              "line-width": 6,
              "line-opacity": 0.85,
            },
          });

          // Create Bus Marker DOM Element
          const busEl = document.createElement("div");
          busEl.className = "bus-marker relative cursor-pointer";
          busEl.style.width = "46px";
          busEl.style.height = "46px";
          busEl.innerHTML = `
            <div class="relative w-full h-full flex items-center justify-center">
              <div class="absolute inset-0 rounded-full bg-yellow/40 animate-ping opacity-60"></div>
              <div class="heading-arrow absolute -top-2.5 transform -translate-x-1/2 transition-transform duration-200">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#111827">
                  <polygon points="12 2 22 22 12 17 2 22 12 2"/>
                </svg>
              </div>
              <div class="w-10 h-10 rounded-full bg-yellow border-2 border-ink flex items-center justify-center shadow-md">
                <svg width="20" height="20" viewBox="-12 -11 24 22">
                  <rect x="-10" y="-9" width="20" height="16" rx="4" fill="#111827" />
                  <rect x="-7" y="-6" width="14" height="6" rx="1.5" fill="#FFC400" />
                  <circle cx="-5" cy="9" r="2.5" fill="#111827" />
                  <circle cx="5" cy="9" r="2.5" fill="#111827" />
                </svg>
              </div>
            </div>
          `;
          busElementRef.current = busEl;

          const marker = new maplibregl.Marker({ element: busEl })
            .setLngLat([busLng, busLat])
            .addTo(map);

          busMarkerRef.current = marker;
        });

        map.on("error", () => {
          console.warn("MapLibre GL tile error; switching to SVG view.");
          setUseFallbackSvg(true);
        });
      } catch (err) {
        console.warn("WebGL or MapLibre initialization failed:", err);
        setUseFallbackSvg(true);
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Bus Marker position & heading smoothly
  useEffect(() => {
    if (busMarkerRef.current) {
      busMarkerRef.current.setLngLat([busLng, busLat]);
    }

    if (busElementRef.current) {
      const arrowEl = busElementRef.current.querySelector(".heading-arrow") as HTMLElement;
      if (arrowEl) {
        arrowEl.style.transform = `rotate(${heading}deg)`;
      }
    }
  }, [busLat, busLng, heading]);

  // Update stop markers on map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // Remove existing stop markers
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    import("maplibre-gl").then(({ default: maplibregl }) => {
      stops.forEach((stop, i) => {
        const isSelected = i === selectedStopIndex;

        const el = document.createElement("div");
        el.className = "stop-marker flex flex-col items-center cursor-pointer group select-none";
        el.style.transform = "translate(-50%, -50%)";

        el.innerHTML = isSelected
          ? `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-blue/30 animate-ping"></div>
              <div class="w-5 h-5 rounded-full bg-blue border-2 border-white shadow-sm flex items-center justify-center">
                <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
            </div>
            <span class="mt-1 px-1.5 py-0.5 rounded-md bg-blue text-white text-[10px] font-extrabold shadow-sm whitespace-nowrap">
              Your Stop
            </span>
          `
          : `
            <div class="w-3.5 h-3.5 rounded-full bg-white border-2 border-ink shadow-xs transition-transform group-hover:scale-125"></div>
            <span class="mt-0.5 text-[11px] font-bold text-ink bg-white/90 px-1 rounded shadow-xs whitespace-nowrap">
              ${stop.short}
            </span>
          `;

        el.addEventListener("click", () => {
          onSelectStop?.(i);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(25);
          }
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);

        stopMarkersRef.current.push(marker);
      });
    });
  }, [mapLoaded, stops, selectedStopIndex, onSelectStop]);

  const handleRecenter = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [busLng, busLat],
        zoom: 14,
        speed: 1.2,
      });
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(25);
    }
  }, [busLat, busLng]);

  return (
    <div className="relative h-[270px] sm:h-[320px] bg-[#EAEDF1] overflow-hidden select-none">
      {/* MapLibre Container */}
      {!useFallbackSvg && (
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      )}

      {/* High-Fidelity SVG Fallback (If WebGL is unavailable or offline) */}
      {useFallbackSvg && (
        <svg
          viewBox="0 0 600 480"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full block"
        >
          <rect width="600" height="480" fill="#EAEDF1" />
          <path
            d="M 120 40 L 160 120 L 220 200 L 320 280 L 450 420"
            fill="none"
            stroke="#2563EB"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {stops.map((s, idx) => (
            <circle
              key={s.id}
              cx={120 + idx * 80}
              cy={40 + idx * 95}
              r={idx === selectedStopIndex ? 8 : 5}
              fill={idx === selectedStopIndex ? "#2563EB" : "#FFFFFF"}
              stroke="#111827"
              strokeWidth="2.5"
            />
          ))}
          <circle
            cx={220}
            cy={200}
            r={16}
            fill="#FFC400"
            stroke="#111827"
            strokeWidth="3"
          />
        </svg>
      )}

      {/* Floating Status Badges (Safe area aligned) */}
      <div className="absolute left-3 right-3 top-2.5 flex justify-between items-center gap-2 pointer-events-none z-20">
        <span className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 font-bold text-[12px] sm:text-[13px] shadow-sm inline-flex items-center gap-1.5 text-ink border border-line/50">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isLive ? "bg-green animate-pulse" : "bg-[#9AA3B2]"
            }`}
          />
          <span>{isLive ? "Live" : isEnded ? "Trip ended" : "Not running"}</span>
        </span>

        <span className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 font-bold text-[12px] sm:text-[13px] shadow-sm text-ink tabular-nums border border-line/50">
          {speedKmh} km/h
        </span>
      </div>

      {/* Floating Recenter FAB Button */}
      <button
        type="button"
        onClick={handleRecenter}
        aria-label="Recenter on live bus"
        title="Recenter on live bus"
        className="absolute right-3 bottom-8 z-20 w-10 h-10 rounded-full bg-white text-ink shadow-md border border-line flex items-center justify-center transition-all active:scale-90 hover:bg-soft focus:outline-none"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="7" />
          <line x1="12" y1="1" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="23" />
          <line x1="1" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="23" y2="12" />
        </svg>
      </button>
    </div>
  );
};
