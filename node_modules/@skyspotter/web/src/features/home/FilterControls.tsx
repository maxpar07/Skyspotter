// apps/web/src/features/home/FilterControls.tsx
//
// Two altitude-bound sliders (min/max) plus a radius slider. Altitude
// filtering is applied client-side against already-fetched data (cheap,
// instant); the radius slider changes what's actually fetched from the
// provider, since that's a real query-radius constraint. The radius is
// shown in statute miles (familiar to most users) but converted to
// nautical miles before it ever leaves HomePage, since that's the unit
// the ADS-B providers actually query by — see lib/units.ts.

interface FilterControlsProps {
  radiusMi: number;
  onRadiusChange: (value: number) => void;
  minAltitudeFeet: number;
  maxAltitudeFeet: number;
  onAltitudeChange: (min: number, max: number) => void;
}

const RADIUS_MIN_MI = 5;
const RADIUS_MAX_MI = 175; // ~150nm, the previous cap, expressed in miles
const ALTITUDE_MIN = 0;
const ALTITUDE_MAX = 45000;
const ALTITUDE_STEP = 500;

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  displayValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  displayValue: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs">
        <span className="text-text-muted font-body">{label}</span>
        <span className="text-text-primary font-mono tabular-nums">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

export function FilterControls({
  radiusMi,
  onRadiusChange,
  minAltitudeFeet,
  maxAltitudeFeet,
  onAltitudeChange,
}: FilterControlsProps) {
  return (
    <div className="bg-surface rounded-3xl p-5 flex flex-col gap-5 shadow-lg shadow-black/30">
      <h3 className="font-display font-semibold text-sm text-text-primary tracking-wide">Filters</h3>

      <Slider
        label="Radius"
        value={radiusMi}
        min={RADIUS_MIN_MI}
        max={RADIUS_MAX_MI}
        onChange={onRadiusChange}
        displayValue={`${radiusMi} mi`}
      />

      <Slider
        label="Min altitude"
        value={minAltitudeFeet}
        min={ALTITUDE_MIN}
        max={maxAltitudeFeet}
        step={ALTITUDE_STEP}
        onChange={(v) => onAltitudeChange(Math.min(v, maxAltitudeFeet), maxAltitudeFeet)}
        displayValue={`${minAltitudeFeet.toLocaleString()} ft`}
      />

      <Slider
        label="Max altitude"
        value={maxAltitudeFeet}
        min={minAltitudeFeet}
        max={ALTITUDE_MAX}
        step={ALTITUDE_STEP}
        onChange={(v) => onAltitudeChange(minAltitudeFeet, Math.max(v, minAltitudeFeet))}
        displayValue={maxAltitudeFeet >= ALTITUDE_MAX ? "No limit" : `${maxAltitudeFeet.toLocaleString()} ft`}
      />
    </div>
  );
}

export const FILTER_DEFAULTS = {
  radiusMi: 35, // ~30nm, the previous default, expressed in miles
  minAltitudeFeet: ALTITUDE_MIN,
  maxAltitudeFeet: ALTITUDE_MAX,
};
