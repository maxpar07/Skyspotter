// apps/api/src/services/adsb/ADSBProvider.ts
//
// Any live ADS-B data source implements this interface. The rest of the
// codebase (aircraft cache, routes, ranking, geometry) depends only on
// this contract — swapping ADS-B Exchange for OpenSky, FlightAware, or a
// self-hosted receiver later means writing one new class, nothing else
// changes.

export interface RawAircraft {
  icaoHex: string;
  callsign?: string;
  registration?: string;
  aircraftType?: string;
  latitude: number;
  longitude: number;
  altitudeFeet?: number;
  groundSpeedKnots?: number;
  trackDegrees?: number;
  verticalRateFpm?: number;
  squawk?: string;
  emitterCategory?: string;

  // The following are readsb/dump1090-family fields — present only when
  // the aircraft actually broadcasts them (many don't), and only decoded
  // by the provider if it exposes them at all. Field NAMES below match
  // readsb's documented JSON schema (used by tar1090, which is what
  // adsb.lol's own map is built on) as best I can verify without live
  // access to the API from this environment — worth confirming against a
  // real response once you're running it.
  navHeadingDegrees?: number;    // selected/FMS heading (nav_heading)
  navAltitudeFeet?: number;      // selected/FMS altitude (nav_altitude_mcp)
  navQnhHpa?: number;            // selected altimeter setting (nav_qnh)
  navModes?: string[];           // active autopilot/FMS modes, e.g. ["autopilot","lnav","althold"]
  outsideAirTempC?: number;      // from Meteorological Routine Air Report (BDS 4,4), when broadcast
  windDirectionDegrees?: number; // ditto
  windSpeedKnots?: number;       // ditto

  // Confirmed directly against readsb's official field documentation (not
  // just the response shape, the actual spec) — higher confidence than the
  // fields above.
  description?: string;          // human-readable type, e.g. "AIRBUS A-320" (desc)
  dbFlags?: number;               // bitfield: military=&1, interesting=&2, PIA=&4, LADD=&8
  emergencyStatus?: string;       // "none" | "general" | "lifeguard" | "minfuel" | "nordo" | "unlawful" | "downed" | "reserved"
  altitudeGeomFeet?: number;      // GNSS/INS altitude, distinct from barometric (alt_geom)
  magHeadingDegrees?: number;     // nose heading, distinct from ground track (mag_heading)
}

export interface ADSBQuery {
  latitude: number;
  longitude: number;
  radiusNm: number;
}

export interface ADSBProvider {
  /** Human-readable name, used in logs/diagnostics. */
  readonly name: string;

  /** Fetch all aircraft currently within radiusNm of the given point. */
  fetchNearby(query: ADSBQuery): Promise<RawAircraft[]>;
}
