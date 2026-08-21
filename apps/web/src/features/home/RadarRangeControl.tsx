// apps/web/src/features/home/RadarRangeControl.tsx
//
// Which mile rings draw on the radar — this also sets the radar's range,
// since the range is simply the largest active ring. Defaults match the
// standard spotting distances (1/2/3/5/10/20mi); the user can toggle any
// of those off, or add their own custom distance.

import { useState } from "react";

export const DEFAULT_RADAR_RINGS_MI = [1, 2, 3, 5, 10, 20];
const MAX_RINGS = 8;

interface RadarRangeControlProps {
  ringsMiles: number[];
  onChange: (rings: number[]) => void;
}

export function RadarRangeControl({ ringsMiles, onChange }: RadarRangeControlProps) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (mi: number) => {
    if (ringsMiles.includes(mi)) {
      if (ringsMiles.length === 1) return; // always keep at least one ring
      onChange(ringsMiles.filter((r) => r !== mi));
    } else {
      onChange([...ringsMiles, mi].sort((a, b) => a - b));
    }
  };

  const addCustom = () => {
    const value = parseFloat(customInput);
    if (!Number.isFinite(value) || value <= 0 || value > 500) return;
    if (!ringsMiles.includes(value) && ringsMiles.length < MAX_RINGS) {
      onChange([...ringsMiles, value].sort((a, b) => a - b));
    }
    setCustomInput("");
  };

  const customRings = ringsMiles.filter((mi) => !DEFAULT_RADAR_RINGS_MI.includes(mi));

  return (
    <div className="bg-surface rounded-3xl p-5 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-sm text-text-primary tracking-wide">Radar rings</h3>
          <p className="text-text-muted text-xs mt-0.5">Range: {Math.max(...ringsMiles)} mi</p>
        </div>
        <button
          onClick={() => onChange(DEFAULT_RADAR_RINGS_MI)}
          className="text-accent text-xs font-body active:opacity-60 transition-opacity duration-150"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {DEFAULT_RADAR_RINGS_MI.map((mi) => {
          const active = ringsMiles.includes(mi);
          return (
            <button
              key={mi}
              onClick={() => toggle(mi)}
              aria-pressed={active}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors duration-150 ${
                active ? "bg-accent text-white font-semibold" : "bg-surfaceRaised text-text-muted"
              }`}
            >
              {mi} mi
            </button>
          );
        })}
        {customRings.map((mi) => (
          <button
            key={mi}
            onClick={() => toggle(mi)}
            aria-label={`Remove custom ring at ${mi} miles`}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-accent text-white font-semibold"
          >
            {mi} mi ×
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0.1}
          max={500}
          step="any"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Custom distance (mi)"
          className="flex-1 min-w-0 bg-surfaceRaised rounded-lg px-3 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted outline-none"
        />
        <button
          onClick={addCustom}
          disabled={ringsMiles.length >= MAX_RINGS || !customInput}
          className="px-3 py-1.5 rounded-lg bg-surfaceRaised text-accent text-xs font-body font-semibold disabled:text-text-muted disabled:opacity-40 active:bg-white/10 transition-colors duration-150 flex-shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}
