// apps/web/src/services/aircraftService.ts
//
// Thin API client. No business logic here — geometry/ranking already
// happened server-side. Keeping this file dumb is what the "isolate API
// communication inside a dedicated service layer" requirement means.

import type { Aircraft, AircraftRegistryInfo } from "@skyspotter/shared";
import { apiUrl } from "../lib/apiBase";

export interface NearbyAircraftResponse {
  aircraft: Aircraft[];
}

export async function fetchNearbyAircraft(
  latitude: number,
  longitude: number,
  radiusNm = 30
): Promise<Aircraft[]> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    radiusNm: String(radiusNm),
  });

  const res = await fetch(apiUrl(`/api/aircraft/nearby?${params}`));
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Failed to fetch nearby aircraft (${res.status})`);
  }

  const data = (await res.json()) as NearbyAircraftResponse;
  return data.aircraft;
}

export async function searchAircraft(query: string): Promise<Aircraft[]> {
  const res = await fetch(apiUrl(`/api/aircraft/search?q=${encodeURIComponent(query)}`));
  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }
  const data = (await res.json()) as { results: Aircraft[] };
  return data.results;
}

export async function fetchAircraftRegistryInfo(icaoHex: string): Promise<AircraftRegistryInfo | null> {
  const res = await fetch(apiUrl(`/api/registry/${icaoHex}`));
  if (!res.ok) {
    // A missing/failed lookup isn't fatal — it just means less detail in
    // the full-screen view, not an error state over otherwise-working data.
    return null;
  }
  const data = (await res.json()) as { info: AircraftRegistryInfo | null };
  return data.info;
}
