// apps/api/src/services/routes/AdsbdbRouteProvider.ts
//
// airplanes.live (and the other readsb-family providers) frequently omit
// origin/destination — that data isn't part of the ADS-B broadcast itself,
// it has to be looked up separately from a flight-schedule/route database.
// adsbdb.com is a free, keyless, community-run API built for exactly this:
// given a flight callsign, it returns the known route (if any) plus basic
// airline info.
//
// Not every callsign will resolve to a route — general aviation, some
// military, and any callsign adsbdb doesn't have on file will come back
// empty. That's expected and handled as a normal "no route known" result,
// not an error.

const DEFAULT_TIMEOUT_MS = 6000;
const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — routes for a given callsign essentially never change within a session.
const NEGATIVE_CACHE_TTL_MS = 10 * 60 * 1000; // Cache "no route found" too, but for less long, in case adsbdb's data improves.

export interface RouteInfo {
  airlineName?: string;
  airlineIcao?: string;
  originAirport?: string; // ICAO code, e.g. "KJFK"
  destinationAirport?: string;
}

interface AdsbdbFlightRouteResponse {
  response?: {
    flightroute?: {
      callsign: string;
      airline?: {
        name?: string;
        icao?: string | null;
        iata?: string | null;
      } | null;
      origin?: {
        icao_code?: string;
      } | null;
      destination?: {
        icao_code?: string;
      } | null;
    };
  };
}

interface CacheEntry {
  route: RouteInfo | null; // null = looked up, nothing found (still worth caching)
  cachedAt: number;
}

export class AdsbdbRouteProvider {
  readonly name = "adsbdb";
  private cache = new Map<string, CacheEntry>();
  /** In-flight lookups per callsign, so concurrent requests share one call. */
  private pending = new Map<string, Promise<RouteInfo | null>>();

  constructor(
    private readonly baseUrl = "https://api.adsbdb.com/v0",
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  /**
   * Looks up the route for a callsign. Returns null if no route is known
   * (not an error — most GA and many military flights simply have none).
   * Never throws for a "not found" result; only throws on an actual
   * network/parse failure, and even then callers should treat a missing
   * route as non-fatal (see AircraftCache's usage).
   */
  async lookupRoute(callsign: string): Promise<RouteInfo | null> {
    const key = callsign.trim().toUpperCase();
    if (!key) return null;

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.cachedAt < this.ttlFor(cached.route)) {
      return cached.route;
    }

    const pending = this.pending.get(key);
    if (pending) return pending;

    const fetchPromise = this.fetchAndCache(key);
    this.pending.set(key, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.pending.delete(key);
    }
  }

  private ttlFor(route: RouteInfo | null): number {
    return route ? DEFAULT_CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS;
  }

  private async fetchAndCache(callsign: string): Promise<RouteInfo | null> {
    const url = `${this.baseUrl}/callsign/${encodeURIComponent(callsign)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err) {
      clearTimeout(timeout);
      // Network/timeout failure — don't cache this, so we retry next time
      // rather than remembering a transient outage as "no route".
      throw new Error(`adsbdb request failed: ${(err as Error).message}`);
    }
    clearTimeout(timeout);

    // adsbdb returns 404 for an unknown callsign — that's a normal,
    // cacheable "no route" result, not an error.
    if (response.status === 404) {
      this.cache.set(callsign, { route: null, cachedAt: Date.now() });
      return null;
    }

    if (!response.ok) {
      throw new Error(`adsbdb request failed: ${response.status} ${response.statusText}`);
    }

    let data: AdsbdbFlightRouteResponse;
    try {
      data = (await response.json()) as AdsbdbFlightRouteResponse;
    } catch {
      throw new Error("adsbdb returned an invalid (non-JSON) response");
    }

    const flightroute = data.response?.flightroute;
    if (!flightroute) {
      this.cache.set(callsign, { route: null, cachedAt: Date.now() });
      return null;
    }

    const route: RouteInfo = {
      airlineName: flightroute.airline?.name ?? undefined,
      airlineIcao: flightroute.airline?.icao ?? undefined,
      originAirport: flightroute.origin?.icao_code ?? undefined,
      destinationAirport: flightroute.destination?.icao_code ?? undefined,
    };

    this.cache.set(callsign, { route, cachedAt: Date.now() });
    return route;
  }
}
