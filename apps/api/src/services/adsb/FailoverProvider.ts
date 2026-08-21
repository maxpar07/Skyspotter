// apps/api/src/services/adsb/FailoverProvider.ts
//
// Wraps multiple ADSBProviders and tries them in order, falling through to
// the next one whenever the current one throws (timeout, non-2xx, bad
// JSON — anything ADSBProvider.fetchNearby can throw). This exists because
// every currently-implemented free provider (airplanes.live, adsb.lol,
// adsb.fi) is community-run with no documented hard quota — any of them
// can start throttling a given IP without warning, and previously that
// meant a code change + redeploy to switch. With this wrapper, a single
// provider having a bad day degrades to "slightly slower" instead of
// "aircraft feed is down."
//
// Order matters: put your preferred/most-reliable provider first. This
// does NOT retry a provider that just failed within the same call — it
// moves on immediately so one bad request doesn't block the whole cache
// refresh cycle (aircraftCache.ts already has its own TTL/backoff on top
// of this).

import type { ADSBProvider, ADSBQuery, RawAircraft } from "./ADSBProvider";

export class FailoverProvider implements ADSBProvider {
  readonly name: string;

  constructor(private readonly providers: ADSBProvider[]) {
    if (providers.length === 0) {
      throw new Error("FailoverProvider requires at least one underlying provider");
    }
    this.name = `Failover(${providers.map((p) => p.name).join(" -> ")})`;
  }

  async fetchNearby(query: ADSBQuery): Promise<RawAircraft[]> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        return await provider.fetchNearby(query);
      } catch (err) {
        errors.push(`${provider.name}: ${(err as Error).message}`);
      }
    }

    throw new Error(`All ADS-B providers failed — ${errors.join(" | ")}`);
  }
}
