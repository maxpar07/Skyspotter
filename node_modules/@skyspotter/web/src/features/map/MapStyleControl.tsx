// apps/web/src/features/map/MapStyleControl.tsx
//
// A plain overlay div positioned over the map (not inside react-leaflet's
// component tree — it only ever changes props one level up in MapView,
// which swaps the TileLayer, so it doesn't need useMap).

import { useState } from "react";
import type { MapMode, StreetTheme } from "./mapStyles";

interface MapStyleControlProps {
  mode: MapMode;
  streetTheme: StreetTheme;
  onModeChange: (mode: MapMode) => void;
  onStreetThemeChange: (theme: StreetTheme) => void;
}

export function MapStyleControl({ mode, streetTheme, onModeChange, onStreetThemeChange }: MapStyleControlProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end">
      {open && (
        <div className="mb-2 bg-surface rounded-2xl p-1.5 shadow-lg shadow-black/40 flex flex-col gap-1 w-36">
          <button
            onClick={() => onModeChange("street")}
            className={`px-3 py-2 rounded-xl text-xs font-body text-left transition-colors duration-150 ${
              mode === "street" ? "bg-accent text-white font-semibold" : "text-text-primary hover:bg-surfaceRaised"
            }`}
          >
            Street
          </button>

          {/* Light/dark only applies to Street — satellite imagery has no
              day/night theme, so the sub-toggle only shows for Street. */}
          {mode === "street" && (
            <div className="flex gap-1 px-1">
              <button
                onClick={() => onStreetThemeChange("light")}
                className={`flex-1 py-1 rounded-lg text-[11px] font-body transition-colors duration-150 ${
                  streetTheme === "light" ? "bg-surfaceRaised text-white" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => onStreetThemeChange("dark")}
                className={`flex-1 py-1 rounded-lg text-[11px] font-body transition-colors duration-150 ${
                  streetTheme === "dark" ? "bg-surfaceRaised text-white" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Dark
              </button>
            </div>
          )}

          <button
            onClick={() => onModeChange("satellite")}
            className={`px-3 py-2 rounded-xl text-xs font-body text-left transition-colors duration-150 ${
              mode === "satellite" ? "bg-accent text-white font-semibold" : "text-text-primary hover:bg-surfaceRaised"
            }`}
          >
            Satellite
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change map style"
        className="w-11 h-11 rounded-full bg-surface shadow-lg shadow-black/40 flex items-center justify-center active:scale-90 transition-transform duration-150"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2">
          <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" strokeLinejoin="round" />
          <path d="M9 3v15M15 6v15" />
        </svg>
      </button>
    </div>
  );
}
