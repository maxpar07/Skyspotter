// apps/web/src/features/home/HomePage.tsx
import { useMemo, useState } from "react";
import type { Aircraft } from "@skyspotter/shared";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useAircraftFeed } from "../../hooks/useAircraftFeed";
import { FeaturedAircraft, type Units } from "./FeaturedAircraft";
import { FilterControls, FILTER_DEFAULTS } from "./FilterControls";
import { NearbyAircraftList } from "./NearbyAircraftList";
import { RefreshRateControl } from "./RefreshRateControl";
import { SortControls, type SortField, type SortDirection } from "./SortControls";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle";
import { MapView } from "../map/MapView";
import { milesToNm } from "../../lib/units";

const DEFAULT_REFRESH_SECONDS = 7;

// Comparator per field. Aircraft missing the relevant value always sort to
// the end, regardless of direction — an unknown speed/altitude/distance
// isn't meaningfully "slow" or "low", it's just missing data, and it
// shouldn't win a sort by accident.
function compareAircraft(a: Aircraft, b: Aircraft, field: SortField, direction: SortDirection): number {
  if (field === "relevance") return 0; // preserve the server's existing relevance order

  const getValue = (ac: Aircraft): number | undefined => {
    if (field === "distance") return ac.distanceMeters;
    if (field === "speed") return ac.groundSpeedKnots;
    return ac.altitudeFeet;
  };

  const av = getValue(a);
  const bv = getValue(b);

  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;

  return direction === "asc" ? av - bv : bv - av;
}

export function HomePage() {
  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();

  const [radiusMi, setRadiusMi] = useState(FILTER_DEFAULTS.radiusMi);
  const [minAltitudeFeet, setMinAltitudeFeet] = useState(FILTER_DEFAULTS.minAltitudeFeet);
  const [maxAltitudeFeet, setMaxAltitudeFeet] = useState(FILTER_DEFAULTS.maxAltitudeFeet);
  const [sortField, setSortField] = useState<SortField>("relevance");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [refreshSeconds, setRefreshSeconds] = useState(DEFAULT_REFRESH_SECONDS);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [pinnedHex, setPinnedHex] = useState<string | null>(null);
  const [units, setUnits] = useState<Units>("imperial");

  const { aircraft, loading, error } = useAircraftFeed(latitude, longitude, milesToNm(radiusMi), refreshSeconds * 1000);

  // Altitude filtering happens here, client-side, against already-fetched
  // data — cheap and instant, unlike radius which requires a re-fetch.
  // Aircraft with unknown altitude are kept only when the range is at its
  // full default span, so they don't silently vanish the moment either
  // slider is touched.
  const filtered = useMemo(() => {
    const rangeIsDefault =
      minAltitudeFeet === FILTER_DEFAULTS.minAltitudeFeet && maxAltitudeFeet === FILTER_DEFAULTS.maxAltitudeFeet;

    return aircraft.filter((a) => {
      if (a.altitudeFeet == null) return rangeIsDefault;
      return a.altitudeFeet >= minAltitudeFeet && a.altitudeFeet <= maxAltitudeFeet;
    });
  }, [aircraft, minAltitudeFeet, maxAltitudeFeet]);

  // Sorted list drives both the nearby list AND the featured card — the
  // top of this array is always "the [closest/fastest/slowest/highest/
  // lowest]" per the active sort, exactly as requested.
  const sorted = useMemo(() => {
    if (sortField === "relevance") return filtered; // server already sorted this
    return [...filtered].sort((a, b) => compareAircraft(a, b, sortField, sortDirection));
  }, [filtered, sortField, sortDirection]);

  // The top box shows whichever aircraft is pinned (clicked in the list or
  // on the map) if it's still in the current filtered/sorted set; otherwise
  // it falls back to the top of the active sort. This means a pin auto-
  // clears itself the moment that aircraft leaves range/filters rather than
  // silently pointing at stale data.
  const pinnedAircraft = pinnedHex ? sorted.find((a) => a.icaoHex === pinnedHex) ?? null : null;
  const featured = pinnedAircraft ?? sorted[0] ?? null;
  const isPinned = pinnedAircraft != null;

  return (
    <main className="min-h-screen bg-base px-4 py-8 md:px-8">
      <header className="mb-8">
        <h1 className="font-display font-bold text-3xl text-text-primary tracking-tight">SkySpotter</h1>
        <p className="text-text-muted text-sm mt-1">What's flying over you right now</p>
      </header>

      {geoLoading && <p className="text-text-muted">Finding your location…</p>}
      {geoError && (
        <p className="text-amber">
          {geoError} — location access is required to spot aircraft near you.
        </p>
      )}

      {!geoLoading && !geoError && loading && (
        <p className="text-text-muted">Scanning the sky…</p>
      )}

      {error && <p className="text-amber">{error}</p>}

      {!geoLoading && !geoError && latitude != null && longitude != null && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />

            {viewMode === "map" ? (
              <MapView
                aircraft={sorted}
                userLatitude={latitude}
                userLongitude={longitude}
                selectedHex={featured?.icaoHex ?? null}
                onSelect={setPinnedHex}
              />
            ) : (
              <>
                {featured ? (
                  <FeaturedAircraft
                    aircraft={featured}
                    isPinned={isPinned}
                    onClearPin={() => setPinnedHex(null)}
                    units={units}
                    onUnitsChange={setUnits}
                  />
                ) : (
                  !loading && <p className="text-text-muted">Nothing matches the current filters right now.</p>
                )}
                <NearbyAircraftList aircraft={sorted} selectedHex={featured?.icaoHex ?? null} onSelect={setPinnedHex} units={units} />
              </>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <SortControls
              field={sortField}
              direction={sortDirection}
              onChange={(field, direction) => {
                setSortField(field);
                setSortDirection(direction);
              }}
            />
            <FilterControls
              radiusMi={radiusMi}
              onRadiusChange={setRadiusMi}
              minAltitudeFeet={minAltitudeFeet}
              maxAltitudeFeet={maxAltitudeFeet}
              onAltitudeChange={(min, max) => {
                setMinAltitudeFeet(min);
                setMaxAltitudeFeet(max);
              }}
            />
            <RefreshRateControl seconds={refreshSeconds} onChange={setRefreshSeconds} />
          </div>
        </div>
      )}
    </main>
  );
}
