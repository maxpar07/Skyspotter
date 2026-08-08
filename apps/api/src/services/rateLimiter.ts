// apps/api/src/services/rateLimiter.ts
//
// Protects the upstream ADS-B provider from being flooded — free
// community providers (adsb.lol, adsb.fi) don't publish hard quotas, but
// good-citizen behavior means capping our own outbound rate regardless of
// how many concurrent SkySpotter users are polling.

export class RateLimiter {
  private timestamps: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  /** Returns true if a request is allowed right now (and records it). */
  tryAcquire(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  /** Milliseconds until the next request would be allowed, if currently blocked. */
  retryAfterMs(): number {
    if (this.timestamps.length === 0) return 0;
    const oldest = this.timestamps[0];
    return Math.max(0, this.windowMs - (Date.now() - oldest));
  }
}
