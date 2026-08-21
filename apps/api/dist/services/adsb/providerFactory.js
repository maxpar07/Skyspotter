"use strict";
// apps/api/src/services/adsb/providerFactory.ts
//
// The only file that imports concrete provider classes. Everything else
// (aircraftCache, routes) depends on the ADSBProvider interface only.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActiveProvider = createActiveProvider;
const AirplanesLiveProvider_1 = require("./AirplanesLiveProvider");
const AdsbLolProvider_1 = require("./AdsbLolProvider");
const AdsbFiProvider_1 = require("./AdsbFiProvider");
const ADSBExchangeProvider_1 = require("./ADSBExchangeProvider");
const FailoverProvider_1 = require("./FailoverProvider");
const providerConfig_1 = require("../../config/providerConfig");
function createActiveProvider() {
    switch (providerConfig_1.ACTIVE_PROVIDER) {
        case "airplanes_live":
            return new AirplanesLiveProvider_1.AirplanesLiveProvider();
        case "adsb_lol":
            return new AdsbLolProvider_1.AdsbLolProvider();
        case "adsb_fi":
            return new AdsbFiProvider_1.AdsbFiProvider();
        case "adsb_exchange": {
            const apiKey = process.env.ADSBX_API_KEY;
            if (!apiKey) {
                throw new Error("ACTIVE_PROVIDER is 'adsb_exchange' but ADSBX_API_KEY is not set — see .env.example");
            }
            return new ADSBExchangeProvider_1.ADSBExchangeProvider(apiKey);
        }
        case "failover":
            // Tries each free provider in turn on failure — see FailoverProvider.ts.
            // Order: airplanes.live, then adsb.lol, then adsb.fi. All three are
            // independent free services, so one throttling doesn't take the app
            // down; it just falls through to the next.
            return new FailoverProvider_1.FailoverProvider([new AirplanesLiveProvider_1.AirplanesLiveProvider(), new AdsbLolProvider_1.AdsbLolProvider(), new AdsbFiProvider_1.AdsbFiProvider()]);
        default: {
            // Exhaustiveness check — a new ProviderName without a case here is a compile error.
            const _exhaustive = providerConfig_1.ACTIVE_PROVIDER;
            throw new Error(`Unknown ACTIVE_PROVIDER: ${_exhaustive}`);
        }
    }
}
