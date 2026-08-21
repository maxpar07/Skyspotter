// apps/web/src/features/home/FeaturedAircraft.tsx
import { useEffect, useRef, useState } from "react";
import type { Aircraft } from "@skyspotter/shared";
import { RadarDisplay } from "../../components/RadarDisplay";
import { VerticalSpeedIndicator } from "../../components/VerticalSpeedIndicator";
import { useAircraftRegistry } from "../../hooks/useAircraftRegistry";
import {
  formatAltitude,
  formatBearing,
  formatDistance,
  formatEmitterCategory,
  formatEta,
  formatFlightState,
  formatNavModes,
  formatQnh,
  formatSpeed,
  formatTemperature,
  formatVerticalSpeed,
  formatWind,
} from "../../lib/formatters";

export type Units = "imperial" | "metric";

interface FeaturedAircraftProps {
  aircraft: Aircraft;
  isPinned?: boolean;
  onClearPin?: () => void;
  units: Units;
  onUnitsChange: (units: Units) => void;
  radarRingsMi: number[];
  radarSizePx: number;
}

function DataField({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="bg-surfaceRaised rounded-xl px-3 py-2.5">
      <div className={`text-text-muted uppercase tracking-wide font-body ${large ? "text-xs" : "text-[11px]"}`}>{label}</div>
      <div className={`font-mono text-text-primary tabular-nums ${large ? "text-2xl" : "text-base"}`}>{value}</div>
    </div>
  );
}

// Same tile shape as DataField, but pairs the number with the VSI graphic
// so climb/descend is legible at a glance, not just as a signed number.
function VerticalSpeedField({
  verticalRateFpm,
  isImperial,
  large = false,
}: {
  verticalRateFpm: number | undefined;
  isImperial: boolean;
  large?: boolean;
}) {
  return (
    <div className="bg-surfaceRaised rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
      <div>
        <div className={`text-text-muted uppercase tracking-wide font-body ${large ? "text-xs" : "text-[11px]"}`}>
          Vertical speed
        </div>
        <div className={`font-mono text-text-primary tabular-nums ${large ? "text-2xl" : "text-base"}`}>
          {formatVerticalSpeed(verticalRateFpm, isImperial)}
        </div>
      </div>
      <VerticalSpeedIndicator verticalRateFpm={verticalRateFpm} size={large ? 48 : 36} />
    </div>
  );
}

// Shown whenever the aircraft has route info from either the ADS-B
// provider or the adsbdb fallback lookup (see apps/api's AircraftCache).
// Renders nothing if neither origin nor destination is known — most
// general-aviation and some military flights won't have a route on file,
// and a row of dashes here wouldn't be useful.
function RouteStrip({ aircraft }: { aircraft: Aircraft }) {
  if (!aircraft.originAirport && !aircraft.destinationAirport) return null;

  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" className="flex-shrink-0">
        <path d="M2 16l20-8-8 20-3-9-9-3z" />
      </svg>
      <span className="font-mono text-text-primary text-sm tabular-nums">{aircraft.originAirport ?? "—"}</span>
      <svg width="16" height="10" viewBox="0 0 24 14" fill="none" stroke="#8E8E93" strokeWidth="2" className="flex-shrink-0">
        <path d="M1 7h20M15 1l6 6-6 6" />
      </svg>
      <span className="font-mono text-text-primary text-sm tabular-nums">{aircraft.destinationAirport ?? "—"}</span>
      {aircraft.airlineName && <span className="text-text-muted text-xs">· {aircraft.airlineName}</span>}
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

export function FeaturedAircraft({
  aircraft,
  isPinned = false,
  onClearPin,
  units,
  onUnitsChange,
  radarRingsMi,
  radarSizePx,
}: FeaturedAircraftProps) {
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
      const isFs = document.fullscreenElement === containerRef.current;
      setIsFullscreen(isFs);
      if (!isFs) {
        try {
          screen.orientation?.unlock?.();
        } catch {
          // No-op — nothing to release if it was never locked.
        }
      }
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
        // Best-effort: rotate to landscape on mobile so the radar-left/
        // stats-right layout below doesn't require the user to manually
        // turn the phone. Chrome/Android supports this inside a fullscreen
        // element; iOS Safari and desktop browsers don't — the `landscape:`
        // CSS below still adapts the layout correctly either way, this is
        // just a convenience on top.
        try {
          await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.("landscape");
        } catch {
          // Unsupported or denied — fine, layout still switches via CSS if
          // the user rotates manually.
        }
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

      {isFullscreen && (
        <p className="text-text-muted text-xs text-center sm:hidden landscape:hidden -mt-2">
          Rotate your device for the full radar view
        </p>
      )}

      <div
        className={`flex gap-6 ${
          isFullscreen
            ? "flex-col items-center landscape:flex-row landscape:items-stretch landscape:justify-center landscape:gap-10"
            : "flex-col md:flex-row md:items-start items-center"
        }`}
      >
        <div className="flex flex-col items-center gap-2 landscape:justify-center flex-shrink-0">
          <RadarDisplay
            bearingDegrees={aircraft.bearingDegrees ?? null}
            distanceMeters={aircraft.distanceMeters ?? null}
            ringsMiles={radarRingsMi}
            isOverhead={isOverhead}
            size={isFullscreen ? Math.round(radarSizePx * 1.5) : radarSizePx}
          />
          {isOverhead && (
            <span className="text-amber font-display font-semibold text-sm tracking-wide animate-pulse">
              OVERHEAD NOW
            </span>
          )}
        </div>

        <div
          className={`flex-1 w-full ${
            isFullscreen ? "max-w-xl landscape:max-w-md landscape:overflow-y-auto landscape:max-h-[85vh]" : ""
          }`}
        >
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
            {aircraft.isCargo && (
              <span className="px-2 py-0.5 rounded-md bg-surfaceRaised text-text-primary text-[10px] font-body font-semibold tracking-wide">
                CARGO
              </span>
            )}
            {!isOverhead && formatFlightState(aircraft.state) && (
              <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-body font-semibold tracking-wide">
                {formatFlightState(aircraft.state)?.toUpperCase()}
              </span>
            )}
          </div>
          {aircraft.description && (
            <div className="text-text-muted text-xs mb-2">{aircraft.description}</div>
          )}

          <RouteStrip aircraft={aircraft} />

          <div className={`grid gap-2.5 mt-4 ${isFullscreen ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
            <DataField label="Altitude" value={formatAltitude(aircraft.altitudeFeet, isImperial)} large={isFullscreen} />
            <DataField label="Speed" value={formatSpeed(aircraft.groundSpeedKnots, isImperial)} large={isFullscreen} />
            <DataField label="Distance" value={formatDistance(aircraft.distanceMeters, isImperial)} large={isFullscreen} />
            <DataField label="Bearing" value={formatBearing(aircraft.bearingDegrees)} large={isFullscreen} />
            <DataField label="ETA overhead" value={formatEta(aircraft.estimatedSecondsUntilOverhead)} large={isFullscreen} />
            <DataField label="Registration" value={aircraft.registration ?? "—"} large={isFullscreen} />
            <DataField label="Squawk" value={aircraft.squawk ?? "—"} large={isFullscreen} />
            <VerticalSpeedField verticalRateFpm={aircraft.verticalRateFpm} isImperial={isImperial} large={isFullscreen} />
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
  if (formatEmitterCategory(aircraft.emitterCategory)) {
    fields.push({ label: "Category", value: formatEmitterCategory(aircraft.emitterCategory)! });
  }

  if (aircraft.navModes?.length) fields.push({ label: "FMS / autopilot modes", value: formatNavModes(aircraft.navModes) });
  if (aircraft.navHeadingDegrees != null) fields.push({ label: "Selected heading", value: formatBearing(aircraft.navHeadingDegrees) });
  if (aircraft.navAltitudeFeet != null) fields.push({ label: "Selected altitude", value: formatAltitude(aircraft.navAltitudeFeet, isImperial) });
  if (aircraft.navQnhHpa != null) fields.push({ label: "Selected QNH", value: formatQnh(aircraft.navQnhHpa, isImperial) });
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
