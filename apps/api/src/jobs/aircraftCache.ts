// apps/api/src/jobs/aircraftCache.ts
//
// Owns the live polling loop against the configured ADSBProvider.
// Clients hit our /api/aircraft/nearby route, which reads from this
// in-memory cache — they never call the provider directly. This is what
// keeps provider rate limits sane and lets Phase 2/3 clients (PWA push,
// Android) share one source of truth.
//
// Step 6 additions: TTL-based caching (5s) so nearby users reuse one
// upstream call, in-flight request de-duplication (concurrent requests
// for the same region await one shared fetch instead of firing N), a
// rate limiter protecting the free upstream provider, and graceful
// degradation to stale cache on provider failure instead of throwing.

import type { ADSBProvider, RawAircraft } from "../services/adsb/ADSBProvider";
import {
  computeSpottingMetrics,
  computeRelevanceScore,
  type ObserverPoint,
} from "../services/geometry/geometry";
import { RateLimiter } from "../services/rateLimiter";
import type { Aircraft } from "@skyspotter/shared";

const WIDEBODY_TYPE_PREFIXES = ["A33", "A34", "A35", "A38", "B74", "B76", "B77", "B78"];

// Callsign prefixes for dedicated all-cargo carriers only — chosen to be
// conservative (low false-positive risk) rather than exhaustive. Airlines
// that fly both passenger and freighter variants under the same callsign
// prefix (e.g. most combination carriers) are deliberately left out, since
// there's no reliable per-flight signal here to distinguish them.
const CARGO_CALLSIGN_PREFIXES = ["FDX", "UPS", "GTI", "ABX", "CLX", "GEC", "CKS", "BOX", "NCA"];

const CACHE_TTL_MS = 5000;
// Free community providers publish no hard quota — this is a conservative
// self-imposed ceiling so SkySpotter stays a good citizen regardless of
// how many users are polling concurrently.
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Uses readsb's `dbFlags` bitfield (military = bit 0) — confirmed directly
 * against readsb's field documentation, not a heuristic. Falls back to
 * false only when the provider doesn't supply dbFlags at all (e.g. an
 * aircraft with no registration-database match).
 */
function inferIsMilitary(raw: RawAircraft): boolean {
  if (raw.dbFlags == null) return false;
  return (raw.dbFlags & 1) !== 0;
}

/**
 * No dbFlags bit for cargo — this stays a callsign-prefix heuristic against
 * a short, conservative list of dedicated all-cargo carriers. Expect false
 * negatives (freighters flown by combination carriers won't be caught);
 * false positives should be rare given the list is limited to airlines
 * that don't also fly passenger service under the same prefix.
 */
function inferIsCargo(raw: RawAircraft): boolean {
  if (!raw.callsign) return false;
  const prefix = raw.callsign.trim().slice(0, 3).toUpperCase();
  return CARGO_CALLSIGN_PREFIXES.includes(prefix);
}

function isWidebody(aircraftType: string | undefined): boolean {
  if (!aircraftType) return false;
  return WIDEBODY_TYPE_PREFIXES.some((prefix) => aircraftType.startsWith(prefix));
}

interface CacheEntry {
  aircraft: Aircraft[];
  fetchedAt: number;
}

export class AircraftCache {
  private latestByRegion = new Map<string, CacheEntry>();
  /** In-flight fetches per region, so concurrent requests share one upstream call. */
  private pendingByRegion = new Map<string, Promise<Aircraft[]>>();
  private readonly rateLimiter: RateLimiter;

  constructor(
    private readonly provider: ADSBProvider,
    private readonly cacheTtlMs = CACHE_TTL_MS
  ) {
    this.rateLimiter = new RateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);
  }

  /** Key used to bucket cached results by rough observer location. */
  private regionKey(lat: number, lon: number): string {
    // Round to ~0.1 degree (~11km) so nearby users share one poll instead
    // of each triggering a separate provider request.
    return `${lat.toFixed(1)},${lon.toFixed(1)}`;
  }

  /**
   * Returns aircraft near the observer. Reuses a cached response if it's
   * within cacheTtlMs, de-dupes concurrent callers for the same region
   * onto one upstream call, and falls back to stale cache (rather than
   * throwing) if the provider is currently unavailable or rate-limited.
   */
  async getNearby(observer: ObserverPoint, radiusNm: number): Promise<Aircraft[]> {
    const key = this.regionKey(observer.latitude, observer.longitude);
    const cached = this.latestByRegion.get(key);
    const isFresh = cached && Date.now() - cached.fetchedAt < this.cacheTtlMs;

    if (isFresh) {
      return cached.aircraft;
    }

    const pending = this.pendingByRegion.get(key);
    if (pending) {
      return pending;
    }

    const fetchPromise = this.fetchAndCache(observer, radiusNm, key, cached);
    this.pendingByRegion.set(key, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      this.pendingByRegion.delete(key);
    }
  }

  private async fetchAndCache(
    observer: ObserverPoint,
    radiusNm: number,
    key: string,
    staleCache: CacheEntry | undefined
  ): Promise<Aircraft[]> {
    if (!this.rateLimiter.tryAcquire()) {
      if (staleCache) {
        console.warn(
          `[AircraftCache] Rate limit reached for ${this.provider.name}; serving stale cache for ${key}.`
        );
        return staleCache.aircraft;
      }
      const retryAfterS = Math.ceil(this.rateLimiter.retryAfterMs() / 1000);
      throw new Error(
        `Too many requests to ${this.provider.name} right now — try again in ${retryAfterS}s.`
      );
    }

    let raw: RawAircraft[];
    try {
      raw = await this.provider.fetchNearby({
        latitude: observer.latitude,
        longitude: observer.longitude,
        radiusNm,
      });
    } catch (err) {
      if (staleCache) {
        console.warn(
          `[AircraftCache] ${this.provider.name} request failed (${(err as Error).message}); serving stale cache for ${key}.`
        );
        return staleCache.aircraft;
      }
      throw new Error(
        `Couldn't reach ${this.provider.name}: ${(err as Error).message}`
      );
    }

    const enriched = this.enrichAndRank(observer, raw);
    this.latestByRegion.set(key, { aircraft: enriched, fetchedAt: Date.now() });
    return enriched;
  }

  private enrichAndRank(observer: ObserverPoint, raw: RawAircraft[]): Aircraft[] {
    const enriched: Aircraft[] = raw.map((r) => {
      const metrics = computeSpottingMetrics(observer, {
        latitude: r.latitude,
        longitude: r.longitude,
        altitudeFeet: r.altitudeFeet,
        groundSpeedKnots: r.groundSpeedKnots,
        trackDegrees: r.trackDegrees,
      });

      const isMilitary = inferIsMilitary(r);
      const isCargo = inferIsCargo(r);

      const relevanceScore = computeRelevanceScore(metrics, {
        isMilitary,
        isCargo,
        isWidebody: isWidebody(r.aircraftType),
      });

      return {
        icaoHex: r.icaoHex,
        callsign: r.callsign,
        registration: r.registration,
        aircraftType: r.aircraftType,
        latitude: r.latitude,
        longitude: r.longitude,
        altitudeFeet: r.altitudeFeet,
        groundSpeedKnots: r.groundSpeedKnots,
        trackDegrees: r.trackDegrees,
        verticalRateFpm: r.verticalRateFpm,
        squawk: r.squawk,
        isMilitary,
        isCargo,
        emitterCategory: r.emitterCategory,
        navHeadingDegrees: r.navHeadingDegrees,
        navAltitudeFeet: r.navAltitudeFeet,
        navQnhHpa: r.navQnhHpa,
        navModes: r.navModes,
        outsideAirTempC: r.outsideAirTempC,
        windDirectionDegrees: r.windDirectionDegrees,
        windSpeedKnots: r.windSpeedKnots,
        description: r.description,
        altitudeGeomFeet: r.altitudeGeomFeet,
        magHeadingDegrees: r.magHeadingDegrees,
        emergencyStatus: r.emergencyStatus,
        lastUpdated: new Date().toISOString(),
        distanceMeters: metrics.distanceMeters,
        bearingDegrees: metrics.bearingDegrees,
        elevationAngleDegrees: metrics.elevationAngleDegrees,
        estimatedSecondsUntilOverhead: metrics.estimatedSecondsUntilOverhead,
        state: metrics.state,
        relevanceScore,
      };
    });

    enriched.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    return enriched;
  }

  getCached(lat: number, lon: number): Aircraft[] | undefined {
    return this.latestByRegion.get(this.regionKey(lat, lon))?.aircraft;
  }

  /** Searches across all currently cached (in-air, near some observer) aircraft. */
  searchCached(query: string): Aircraft[] {
    const q = query.toUpperCase();
    const all = Array.from(this.latestByRegion.values()).flatMap((entry) => entry.aircraft);
    return all.filter((a) =>
      [a.registration, a.callsign, a.flightNumber, a.icaoHex, a.aircraftType, a.airlineName]
        .filter((field): field is string => Boolean(field))
        .some((field) => field.toUpperCase().includes(q))
    );
  }
}
