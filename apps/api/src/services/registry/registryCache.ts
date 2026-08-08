// apps/api/src/services/registry/registryCache.ts
//
// Registry data (manufacturer, owner, registration) essentially never
// changes — a 7-day cache is both correct and considerate to the free
// lookup service. Also caches negative results, so repeatedly-spotted
// aircraft with no registry entry don't get re-queried every time.

import { HexDbRegistryProvider, type AircraftRegistryInfo } from "./HexDbRegistryProvider";
import { RateLimiter } from "../rateLimiter";

const REGISTRY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RATE_LIMIT_MAX_REQUESTS = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

interface CacheEntry {
  info: AircraftRegistryInfo | null;
  fetchedAt: number;
}

export class RegistryCache {
  private cache = new Map<string, CacheEntry>();
  private pending = new Map<string, Promise<AircraftRegistryInfo | null>>();
  private readonly rateLimiter = new RateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);

  constructor(private readonly provider = new HexDbRegistryProvider()) {}

  async getRegistryInfo(icaoHex: string): Promise<AircraftRegistryInfo | null> {
    const key = icaoHex.toUpperCase();
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < REGISTRY_CACHE_TTL_MS) {
      return cached.info;
    }

    const pending = this.pending.get(key);
    if (pending) return pending;

    const fetchPromise = this.fetchAndCache(key, cached);
    this.pending.set(key, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      this.pending.delete(key);
    }
  }

  private async fetchAndCache(key: string, staleCache: CacheEntry | undefined): Promise<AircraftRegistryInfo | null> {
    if (!this.rateLimiter.tryAcquire()) {
      if (staleCache) return staleCache.info;
      throw new Error("Too many registry lookups right now — try again shortly.");
    }

    let info: AircraftRegistryInfo | null;
    try {
      info = await this.provider.fetchRegistryInfo(key);
    } catch (err) {
      if (staleCache) return staleCache.info;
      throw new Error(`Couldn't reach the aircraft registry: ${(err as Error).message}`);
    }

    this.cache.set(key, { info, fetchedAt: Date.now() });
    return info;
  }
}
