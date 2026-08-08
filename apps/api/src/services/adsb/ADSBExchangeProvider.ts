// apps/api/src/services/adsb/ADSBExchangeProvider.ts
//
// Concrete ADSBProvider backed by the ADS-B Exchange REST API.
// Requires ADSBX_API_KEY (RapidAPI key) in the environment.

import type { ADSBProvider, ADSBQuery, RawAircraft } from "./ADSBProvider";

interface ADSBExchangeAircraftResponse {
  hex: string;
  flight?: string;      // callsign, padded with spaces by the API
  r?: string;            // registration
  t?: string;            // ICAO type code
  lat?: number;
  lon?: number;
  alt_baro?: number | "ground";
  gs?: number;           // ground speed, knots
  track?: number;
  baro_rate?: number;
  squawk?: string;
}

interface ADSBExchangeResponse {
  ac?: ADSBExchangeAircraftResponse[];
}

export class ADSBExchangeProvider implements ADSBProvider {
  readonly name = "ADS-B Exchange";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://adsbexchange-com1.p.rapidapi.com/v2"
  ) {}

  async fetchNearby(query: ADSBQuery): Promise<RawAircraft[]> {
    const { latitude, longitude, radiusNm } = query;
    const url = `${this.baseUrl}/lat/${latitude}/lon/${longitude}/dist/${radiusNm}/`;

    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": this.apiKey,
        "X-RapidAPI-Host": "adsbexchange-com1.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      throw new Error(
        `ADS-B Exchange request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as ADSBExchangeResponse;
    const aircraftList = data.ac ?? [];

    return aircraftList
      .filter((a) => typeof a.lat === "number" && typeof a.lon === "number")
      .map((a) => this.toRawAircraft(a));
  }

  private toRawAircraft(a: ADSBExchangeAircraftResponse): RawAircraft {
    return {
      icaoHex: a.hex.toUpperCase(),
      callsign: a.flight?.trim() || undefined,
      registration: a.r,
      aircraftType: a.t,
      latitude: a.lat!,
      longitude: a.lon!,
      altitudeFeet: a.alt_baro === "ground" ? 0 : a.alt_baro,
      groundSpeedKnots: a.gs,
      trackDegrees: a.track,
      verticalRateFpm: a.baro_rate,
      squawk: a.squawk,
    };
  }
}
