"use strict";
// apps/api/src/services/adsb/ADSBExchangeProvider.ts
//
// Concrete ADSBProvider backed by the ADS-B Exchange REST API.
// Requires ADSBX_API_KEY (RapidAPI key) in the environment.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADSBExchangeProvider = void 0;
class ADSBExchangeProvider {
    apiKey;
    baseUrl;
    name = "ADS-B Exchange";
    constructor(apiKey, baseUrl = "https://adsbexchange-com1.p.rapidapi.com/v2") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    async fetchNearby(query) {
        const { latitude, longitude, radiusNm } = query;
        const url = `${this.baseUrl}/lat/${latitude}/lon/${longitude}/dist/${radiusNm}/`;
        const response = await fetch(url, {
            headers: {
                "X-RapidAPI-Key": this.apiKey,
                "X-RapidAPI-Host": "adsbexchange-com1.p.rapidapi.com",
            },
        });
        if (!response.ok) {
            throw new Error(`ADS-B Exchange request failed: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json());
        const aircraftList = data.ac ?? [];
        return aircraftList
            .filter((a) => typeof a.lat === "number" && typeof a.lon === "number")
            .map((a) => this.toRawAircraft(a));
    }
    toRawAircraft(a) {
        return {
            icaoHex: a.hex.toUpperCase(),
            callsign: a.flight?.trim() || undefined,
            registration: a.r,
            aircraftType: a.t,
            latitude: a.lat,
            longitude: a.lon,
            altitudeFeet: a.alt_baro === "ground" ? 0 : a.alt_baro,
            groundSpeedKnots: a.gs,
            trackDegrees: a.track,
            verticalRateFpm: a.baro_rate,
            squawk: a.squawk,
        };
    }
}
exports.ADSBExchangeProvider = ADSBExchangeProvider;
