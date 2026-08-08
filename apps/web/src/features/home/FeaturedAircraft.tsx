// apps/web/src/features/home/FeaturedAircraft.tsx
import { useEffect, useRef, useState } from "react";
import type { Aircraft } from "@skyspotter/shared";
import { SkyDial } from "../../components/SkyDial";
import { useAircraftRegistry } from "../../hooks/useAircraftRegistry";
import {
  formatAltitude,
  formatBearing,
  formatDistance,
  formatEta,
  formatNavModes,
  formatSpeed,
  formatTemperature,
  formatWind,
} from "../../lib/formatters";

export type Units = "imperial" | "metric";

interface FeaturedAircraftProps {
  aircraft: Aircraft;
  isPinned?: boolean;
  onClearPin?: () => void;
  units: Units;
  onUnitsChange: (units: Units) => void;
}

function DataField({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="bg-surfaceRaised rounded-xl px-3 py-2.5">
      <div className={`text-text-muted uppercase tracking-wide font-body ${large ? "text-xs" : "text-[11px]"}`}>{label}</div>
      <div className={`font-mono text-text-primary tabular-nums ${large ? "text-2xl" : "text-base"}`}>{value}</div>
    </div>
  );
}

function UnitsToggle({ units, onChange }: { units: Units; onChange: (u: Units) => void }) {
  return (
    <div className="flex bg-surfaceRaised rounded-lg p-0.5 gap-0.5">
      {(["imperial", "metric"] as const).map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-body transition-colors duration-150 ${
            units === u ? "bg-white text-black font-semibold" : "text-text-muted hover:text-text-primary"
          }`}
        >
          {u === "imperial" ? "mi/ft" : "km/m"}
        </button>
      ))}
    </div>
  );
}

export function FeaturedAircraft({ aircraft, isPinned = false, onClearPin, units, onUnitsChange }: FeaturedAircraftProps) {
  const isOverhead = aircraft.state === "overhead";
  const isImperial = units === "imperial";
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetched whenever there's a featured aircraft (not gated to fullscreen)
  // so the data is already there the instant the user expands — registry
  // lookups are cheap and long-cached both server- and client-side.
  const registry = useAircraftRegistry(aircraft.icaoHex);

  // Tracks the REAL browser fullscreen state (not just our own toggle),
  // since the user can also exit via Escape or the browser's own UI —
  // without this listener, our button label/icon would drift out of sync.
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen API unsupported or blocked (some mobile browsers restrict
      // it to specific elements/gestures) — fall back to an in-page
      // expanded state so the feature still does something useful.
      setIsFullscreen((f) => !f);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-surface rounded-3xl p-6 flex flex-col gap-5 shadow-lg shadow-black/30 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none justify-center overflow-auto bg-base" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        {isPinned ? (
          <button
            onClick={onClearPin}
            className="flex items-center gap-1.5 text-xs font-body text-accent active:opacity-60 transition-opacity duration-150"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Pinned — back to top match
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <UnitsToggle units={units} onChange={onUnitsChange} />
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
            className="w-8 h-8 rounded-lg bg-surfaceRaised flex items-center justify-center active:scale-90 transition-transform duration-150"
          >
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2F2F7" strokeWidth="2">
                <path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2F2F7" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className={`flex gap-6 items-center ${isFullscreen ? "flex-col" : "flex-col md:flex-row md:items-start"}`}>
        <div className="flex flex-col items-center gap-2">
          <SkyDial
            bearingDegrees={aircraft.bearingDegrees ?? null}
            elevationDegrees={aircraft.elevationAngleDegrees ?? null}
            isOverhead={isOverhead}
            size={isFullscreen ? 320 : 200}
          />
          {isOverhead && (
            <span className="text-amber font-display font-semibold text-sm tracking-wide animate-pulse">
              OVERHEAD NOW
            </span>
          )}
        </div>

        <div className={`flex-1 w-full ${isFullscreen ? "max-w-xl" : ""}`}>
          {aircraft.emergencyStatus && aircraft.emergencyStatus !== "none" && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-danger/15 border border-danger/40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse flex-shrink-0" />
              <span className="text-danger font-display font-semibold text-sm">
                EMERGENCY — {aircraft.emergencyStatus.toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-1 flex-wrap">
            <h2 className={`font-display font-semibold text-text-primary ${isFullscreen ? "text-4xl" : "text-2xl"}`}>
              {aircraft.flightNumber ?? aircraft.callsign ?? aircraft.icaoHex}
            </h2>
            {aircraft.aircraftType && (
              <span className="font-mono text-text-muted text-sm">{aircraft.aircraftType}</span>
            )}
            {aircraft.isMilitary && (
              <span className="px-2 py-0.5 rounded-md bg-surfaceRaised text-text-primary text-[10px] font-body font-semibold tracking-wide">
                MILITARY
              </span>
            )}
          </div>
          {aircraft.description && (
            <div className="text-text-muted text-xs mb-2">{aircraft.description}</div>
          )}

          <div className={`grid gap-2.5 mt-4 ${isFullscreen ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
            <DataField label="Altitude" value={formatAltitude(aircraft.altitudeFeet, isImperial)} large={isFullscreen} />
            <DataField label="Speed" value={formatSpeed(aircraft.groundSpeedKnots, isImperial)} large={isFullscreen} />
            <DataField label="Distance" value={formatDistance(aircraft.distanceMeters, isImperial)} large={isFullscreen} />
            <DataField label="Bearing" value={formatBearing(aircraft.bearingDegrees)} large={isFullscreen} />
            <DataField label="ETA overhead" value={formatEta(aircraft.estimatedSecondsUntilOverhead)} large={isFullscreen} />
            <DataField label="Registration" value={aircraft.registration ?? "—"} large={isFullscreen} />
          </div>

          {isFullscreen && <ExtraInfoSection aircraft={aircraft} registry={registry} isImperial={isImperial} />}
        </div>
      </div>
    </div>
  );
}

// Extended detail — only shown in full screen, since it's genuinely extra
// rather than something every glance needs. Combines two different kinds
// of data: (1) live telemetry the aircraft itself broadcasts (nav/FMS
// modes, selected heading/altitude, wind, outside air temp) — only present
// when the specific airframe transmits it, most don't; and (2) a one-time
// registry lookup (manufacturer, owner, operator) — only present when the
// hex is in the free registry database. Fields with no data are simply
// omitted rather than shown as "—", since a wall of dashes isn't useful.
function ExtraInfoSection({
  aircraft,
  registry,
  isImperial,
}: {
  aircraft: Aircraft;
  registry: ReturnType<typeof useAircraftRegistry>;
  isImperial: boolean;
}) {
  const fields: { label: string; value: string }[] = [];

  if (registry?.manufacturer) fields.push({ label: "Manufacturer", value: registry.manufacturer });
  if (registry?.typeDescription) fields.push({ label: "Type", value: registry.typeDescription });
  if (registry?.registeredOwner) fields.push({ label: "Registered owner", value: registry.registeredOwner });
  if (registry?.operatorFlagCode) fields.push({ label: "Operator", value: registry.operatorFlagCode });

  if (aircraft.navModes?.length) fields.push({ label: "FMS / autopilot modes", value: formatNavModes(aircraft.navModes) });
  if (aircraft.navHeadingDegrees != null) fields.push({ label: "Selected heading", value: formatBearing(aircraft.navHeadingDegrees) });
  if (aircraft.navAltitudeFeet != null) fields.push({ label: "Selected altitude", value: formatAltitude(aircraft.navAltitudeFeet, isImperial) });
  if (aircraft.navQnhHpa != null) fields.push({ label: "Selected QNH", value: `${aircraft.navQnhHpa} hPa` });
  if (aircraft.windSpeedKnots != null || aircraft.windDirectionDegrees != null) {
    fields.push({ label: "Wind", value: formatWind(aircraft.windSpeedKnots, aircraft.windDirectionDegrees, isImperial) });
  }
  if (aircraft.outsideAirTempC != null) fields.push({ label: "Outside air temp", value: formatTemperature(aircraft.outsideAirTempC, isImperial) });
  if (aircraft.altitudeGeomFeet != null) fields.push({ label: "Geometric altitude (GPS)", value: formatAltitude(aircraft.altitudeGeomFeet, isImperial) });
  if (aircraft.magHeadingDegrees != null) fields.push({ label: "Heading (nose direction)", value: formatBearing(aircraft.magHeadingDegrees) });

  return (
    <div className="mt-5 pt-5 border-t border-separator/60">
      <h3 className="font-display font-semibold text-sm text-text-primary tracking-wide mb-3">Additional data</h3>
      {fields.length === 0 ? (
        <p className="text-text-muted text-sm">
          No additional data available for this aircraft — not every airframe broadcasts FMS/weather data or has a registry entry.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {fields.map((f) => (
            <DataField key={f.label} label={f.label} value={f.value} />
          ))}
        </div>
      )}
    </div>
  );
}
