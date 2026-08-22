// apps/web/src/features/home/NearbyAircraftList.tsx
import { useState } from "react";
import type { Aircraft } from "@skyspotter/shared";
import { formatAltitude, formatDistance, formatSpeed } from "../../lib/formatters";
import type { Units } from "./FeaturedAircraft";

const DEFAULT_VISIBLE = 10;

interface NearbyAircraftListProps {
  aircraft: Aircraft[];
  selectedHex?: string | null;
  onSelect?: (icaoHex: string) => void;
  units: Units;
}

function AircraftRow({
  aircraft,
  isSelected,
  onSelect,
  units,
}: {
  aircraft: Aircraft;
  isSelected: boolean;
  onSelect?: (icaoHex: string) => void;
  units: Units;
}) {
  const isOverhead = aircraft.state === "overhead";
  const isImperial = units === "imperial";

  return (
    <button
      onClick={() => onSelect?.(aircraft.icaoHex)}
      className={`w-full flex items-center justify-between py-3 px-3 rounded-xl transition-colors duration-150 text-left active:scale-[0.99] ${
        isSelected ? "bg-accent/15 ring-1 ring-accent/40" : "hover:bg-surfaceRaised"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverhead ? "bg-amber" : "bg-accent"}`}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="font-mono text-text-primary text-sm truncate tabular-nums">
            {aircraft.flightNumber ?? aircraft.callsign ?? aircraft.icaoHex}
          </div>
          <div className="text-text-muted text-xs truncate">
            {aircraft.aircraftType ?? "Unknown type"}
            {aircraft.registration ? ` · ${aircraft.registration}` : ""}
          </div>
        </div>
      </div>

      <div className="flex gap-4 text-right flex-shrink-0">
        <div>
          <div className="text-text-muted text-[10px] uppercase">Alt</div>
          <div className="font-mono text-text-primary text-xs tabular-nums">{formatAltitude(aircraft.altitudeFeet, isImperial)}</div>
        </div>
        <div>
          <div className="text-text-muted text-[10px] uppercase">Spd</div>
          <div className="font-mono text-text-primary text-xs tabular-nums">{formatSpeed(aircraft.groundSpeedKnots, isImperial)}</div>
        </div>
        <div>
          <div className="text-text-muted text-[10px] uppercase">Dist</div>
          <div className="font-mono text-text-primary text-xs tabular-nums">{formatDistance(aircraft.distanceMeters, isImperial)}</div>
        </div>
      </div>
    </button>
  );
}

export function NearbyAircraftList({ aircraft, selectedHex = null, onSelect, units }: NearbyAircraftListProps) {
  const [expanded, setExpanded] = useState(false);

  const displayed = expanded ? aircraft : aircraft.slice(0, DEFAULT_VISIBLE);
  const hasMore = aircraft.length > DEFAULT_VISIBLE;

  return (
    <div className="bg-surface rounded-3xl p-5 shadow-lg shadow-black/30">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h3 className="font-display font-semibold text-sm text-text-primary tracking-wide">Nearby</h3>
        <span className="text-text-muted text-xs font-mono tabular-nums">
          {displayed.length} of {aircraft.length}
        </span>
      </div>

      {displayed.length === 0 ? (
        <p className="text-text-muted text-sm py-4 px-1">No aircraft match the current filters.</p>
      ) : (
        <div className="divide-y divide-separator/60">
          {displayed.map((a) => (
            <AircraftRow key={a.icaoHex} aircraft={a} isSelected={a.icaoHex === selectedHex} onSelect={onSelect} units={units} />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 w-full text-center text-sm font-body font-medium text-accent active:scale-[0.98] transition-transform duration-150 py-2.5"
        >
          {expanded ? "Show less" : `Show all ${aircraft.length}`}
        </button>
      )}
    </div>
  );
}
