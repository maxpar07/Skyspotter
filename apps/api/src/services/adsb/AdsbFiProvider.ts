// apps/api/src/services/adsb/AdsbFiProvider.ts
//
// Second free, keyless community provider — same readsb-family response
// shape as ADSB.lol. Kept as a documented fallback per the requirement
// that ADSB.fi be available if ADSB.lol has an outage; switch via
// ACTIVE_PROVIDER in config/providerConfig.ts.
//
// BUG FIX: this was previously hitting "/api/v2/point/{lat}/{lon}/{dist}",
// which was never a valid adsb.fi path — their actual (now-deprecated) v2
// shape is "/api/v2/lat/{lat}/lon/{lon}/dist/{dist}", and per their own
// docs the current, non-deprecated endpoint is v3 using that same
// lat/lon/dist path shape. That's what's used below. Note from adsb.fi's
// terms: repeated invalid (400/401/403/404/429) requests can themselves
// earn a temporary IP restriction — so the old bug wasn't just failing
// silently, it was actively working against future requests too.

import type { ADSBProvider, ADSBQuery, RawAircraft } from "./ADSBProvider";
import { ADSB_USER_AGENT } from "./userAgent";

interface ReadsbAircraft {
  hex: string;
  flight?: string;
  r?: string;
  t?: string;
  desc?: string;
  category?: string;
  dbFlags?: number;
  lat?: number;
  lon?: number;
  alt_baro?: number | "ground";
  alt_geom?: number;
  gs?: number;
  track?: number;
  mag_heading?: number;
  baro_rate?: number;
  squawk?: string;
  emergency?: string;
  nav_heading?: number;
  nav_altitude_mcp?: number;
  nav_qnh?: number;
  nav_modes?: string[];
  oat?: number;
  wd?: number;
  ws?: number;
}

interface ReadsbResponse {
  ac?: ReadsbAircraft[];
}

const DEFAULT_TIMEOUT_MS = 8000;

export class AdsbFiProvider implements ADSBProvider {
  readonly name = "ADSB.fi";

  constructor(
    private readonly baseUrl = "https://opendata.adsb.fi/api/v3/lat",
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  async fetchNearby(query: ADSBQuery): Promise<RawAircraft[]> {
    const { latitude, longitude, radiusNm } = query;
    const clampedRadius = Math.min(Math.max(radiusNm, 1), 250);
    const url = `${this.baseUrl}/${latitude}/lon/${longitude}/dist/${clampedRadius}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": ADSB_USER_AGENT } });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error(`ADSB.fi request timed out after ${this.timeoutMs}ms`);
      }
      throw new Error(`ADSB.fi request failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`ADSB.fi request failed: ${response.status} ${response.statusText}`);
    }

    let data: ReadsbResponse;
    try {
      data = (await response.json()) as ReadsbResponse;
    } catch {
      throw new Error("ADSB.fi returned an invalid (non-JSON) response");
    }

    const aircraftList = data.ac ?? [];

    return aircraftList
      .filter((a) => typeof a.lat === "number" && typeof a.lon === "number" && !!a.hex)
      .map((a) => this.toRawAircraft(a));
  }

  private toRawAircraft(a: ReadsbAircraft): RawAircraft {
    return {
      icaoHex: a.hex.toUpperCase(),
      callsign: a.flight?.trim() || undefined,
      registration: a.r,
      aircraftType: a.t,
      description: a.desc,
      emitterCategory: a.category,
      dbFlags: a.dbFlags,
      latitude: a.lat!,
      longitude: a.lon!,
      altitudeFeet: a.alt_baro === "ground" ? 0 : a.alt_baro,
      altitudeGeomFeet: a.alt_geom,
      groundSpeedKnots: a.gs,
      trackDegrees: a.track,
      magHeadingDegrees: a.mag_heading,
      verticalRateFpm: a.baro_rate,
      squawk: a.squawk,
      emergencyStatus: a.emergency,
      navHeadingDegrees: a.nav_heading,
      navAltitudeFeet: a.nav_altitude_mcp,
      navQnhHpa: a.nav_qnh,
      navModes: a.nav_modes,
      outsideAirTempC: a.oat,
      windDirectionDegrees: a.wd,
      windSpeedKnots: a.ws,
    };
  }
}
