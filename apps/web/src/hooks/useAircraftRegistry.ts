// apps/web/src/hooks/useAircraftRegistry.ts
//
// Keyed by icaoHex only (not the whole Aircraft object, which gets a new
// reference every poll tick) — registry data barely changes, so re-fetching
// it alongside every 5-30s position refresh would be pointless.

import { useEffect, useRef, useState } from "react";
import type { AircraftRegistryInfo } from "@skyspotter/shared";
import { fetchAircraftRegistryInfo } from "../services/aircraftService";

const sessionCache = new Map<string, AircraftRegistryInfo | null>();

export function useAircraftRegistry(icaoHex: string | null): AircraftRegistryInfo | null {
  const [info, setInfo] = useState<AircraftRegistryInfo | null>(
    icaoHex ? sessionCache.get(icaoHex) ?? null : null
  );
  const lastRequestedHex = useRef<string | null>(null);

  useEffect(() => {
    if (!icaoHex) {
      setInfo(null);
      return;
    }

    if (sessionCache.has(icaoHex)) {
      setInfo(sessionCache.get(icaoHex) ?? null);
      return;
    }

    let cancelled = false;
    lastRequestedHex.current = icaoHex;

    fetchAircraftRegistryInfo(icaoHex).then((result) => {
      sessionCache.set(icaoHex, result);
      if (cancelled || lastRequestedHex.current !== icaoHex) return;
      setInfo(result);
    });

    return () => {
      cancelled = true;
    };
  }, [icaoHex]);

  return info;
}
