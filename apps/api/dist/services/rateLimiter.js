"use strict";
// apps/api/src/services/rateLimiter.ts
//
// Protects the upstream ADS-B provider from being flooded — free
// community providers (adsb.lol, adsb.fi) don't publish hard quotas, but
// good-citizen behavior means capping our own outbound rate regardless of
// how many concurrent SkySpotter users are polling.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    maxRequests;
    windowMs;
    timestamps = [];
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    /** Returns true if a request is allowed right now (and records it). */
    tryAcquire() {
        const now = Date.now();
        this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
        if (this.timestamps.length >= this.maxRequests) {
            return false;
        }
        this.timestamps.push(now);
        return true;
    }
    /** Milliseconds until the next request would be allowed, if currently blocked. */
    retryAfterMs() {
        if (this.timestamps.length === 0)
            return 0;
        const oldest = this.timestamps[0];
        return Math.max(0, this.windowMs - (Date.now() - oldest));
    }
}
exports.RateLimiter = RateLimiter;
