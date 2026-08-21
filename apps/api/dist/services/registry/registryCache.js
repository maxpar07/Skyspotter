"use strict";
// apps/api/src/services/registry/registryCache.ts
//
// Registry data (manufacturer, owner, registration) essentially never
// changes — a 7-day cache is both correct and considerate to the free
// lookup service. Also caches negative results, so repeatedly-spotted
// aircraft with no registry entry don't get re-queried every time.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryCache = void 0;
const HexDbRegistryProvider_1 = require("./HexDbRegistryProvider");
const rateLimiter_1 = require("../rateLimiter");
const REGISTRY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RATE_LIMIT_MAX_REQUESTS = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
class RegistryCache {
    provider;
    cache = new Map();
    pending = new Map();
    rateLimiter = new rateLimiter_1.RateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);
    constructor(provider = new HexDbRegistryProvider_1.HexDbRegistryProvider()) {
        this.provider = provider;
    }
    async getRegistryInfo(icaoHex) {
        const key = icaoHex.toUpperCase();
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.fetchedAt < REGISTRY_CACHE_TTL_MS) {
            return cached.info;
        }
        const pending = this.pending.get(key);
        if (pending)
            return pending;
        const fetchPromise = this.fetchAndCache(key, cached);
        this.pending.set(key, fetchPromise);
        try {
            return await fetchPromise;
        }
        finally {
            this.pending.delete(key);
        }
    }
    async fetchAndCache(key, staleCache) {
        if (!this.rateLimiter.tryAcquire()) {
            if (staleCache)
                return staleCache.info;
            throw new Error("Too many registry lookups right now — try again shortly.");
        }
        let info;
        try {
            info = await this.provider.fetchRegistryInfo(key);
        }
        catch (err) {
            if (staleCache)
                return staleCache.info;
            throw new Error(`Couldn't reach the aircraft registry: ${err.message}`);
        }
        this.cache.set(key, { info, fetchedAt: Date.now() });
        return info;
    }
}
exports.RegistryCache = RegistryCache;
