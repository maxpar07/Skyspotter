// apps/web/src/hooks/useAircraftFeed.ts
//
// Polls nearby aircraft on an interval, and automatically pauses that
// polling while the browser tab is not visible (Page Visibility API) —
// resuming, with an immediate refresh, as soon as it becomes visible again.
// This is what keeps SkySpotter from hammering the free upstream provider
// for tabs sitting in the background.

import { useEffect, useRef, useState } from "react";
import type { Aircraft } from "@skyspotter/shared";
import { fetchNearbyAircraft } from "../services/aircraftService";

export interface AircraftFeedState {
  aircraft: Aircraft[];
  featured: Aircraft | null;
  loading: boolean;
  error: string | null;
}

/** Polls the backend for nearby aircraft every `refreshMs`, while lat/lon are known and the tab is visible. */
export function useAircraftFeed(
  latitude: number | null,
  longitude: number | null,
  radiusNm = 30,
  refreshMs = 7000
): AircraftFeedState {
  const [state, setState] = useState<AircraftFeedState>({
    aircraft: [],
    featured: null,
    loading: true,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (latitude == null || longitude == null) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const aircraft = await fetchNearbyAircraft(latitude, longitude, radiusNm);
        if (cancelled) return;
        // Server already sorts by relevanceScore descending.
        setState({
          aircraft,
          featured: aircraft[0] ?? null,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: (err as Error).message }));
      }
    };

    const startPolling = () => {
      if (intervalRef.current) return; // already running
      poll();
      intervalRef.current = setInterval(poll, refreshMs);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling(); // resumes with an immediate refresh
      }
    };

    if (!document.hidden) {
      startPolling();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [latitude, longitude, radiusNm, refreshMs]);

  return state;
}
