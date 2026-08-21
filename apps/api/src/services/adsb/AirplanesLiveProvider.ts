// apps/api/src/services/adsb/AirplanesLiveProvider.ts
//
// Free, keyless ADS-B provider (community-run, readsb-based backend — same
// response shape family as adsb.lol and adsb.fi, which is expected since
// all three are built on the same open-source readsb project). Set as the
// active provider by default; see config/providerConfig.ts to switch.

import type { ADSBProvider, ADSBQuery, RawAircraft } from "./ADSBProvider";

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
  // FMS/autopilot + meteorological fields — present only when the
  // aircraft broadcasts them. See the field-name confidence note in
  // ADSBProvider.ts.
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

export class AirplanesLiveProvider implements ADSBProvider {
  readonly name = "airplanes.live";

  constructor(
    // BUG FIX: this was previously defaulting to "https://api.adsb.lol/v2/point"
    // — a copy-paste leftover from AdsbLolProvider — which meant every
    // "airplanes.live" request was silently actually hitting adsb.lol's
    // servers instead. That's almost certainly why adsb.lol started
    // throttling: this provider's traffic was landing there under a
    // different name in the logs/errors.
    private readonly baseUrl = "https://api.airplanes.live/v2/point",
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  async fetchNearby(query: ADSBQuery): Promise<RawAircraft[]> {
    const { latitude, longitude, radiusNm } = query;
    // airplanes.live caps radius at 250nm.
    const clampedRadius = Math.min(Math.max(radiusNm, 1), 250);
    const url = `${this.baseUrl}/${latitude}/${longitude}/${clampedRadius}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error(`airplanes.live request timed out after ${this.timeoutMs}ms`);
      }
      throw new Error(`airplanes.live request failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`airplanes.live request failed: ${response.status} ${response.statusText}`);
    }

    let data: ReadsbResponse;
    try {
      data = (await response.json()) as ReadsbResponse;
    } catch {
      throw new Error("airplanes.live returned an invalid (non-JSON) response");
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
