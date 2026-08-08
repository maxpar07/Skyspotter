// apps/api/src/services/adsb/providerFactory.ts
//
// The only file that imports concrete provider classes. Everything else
// (aircraftCache, routes) depends on the ADSBProvider interface only.

import type { ADSBProvider } from "./ADSBProvider";
import { AirplanesLiveProvider } from "./AirplanesLiveProvider";
import { AdsbLolProvider } from "./AdsbLolProvider";
import { AdsbFiProvider } from "./AdsbFiProvider";
import { ADSBExchangeProvider } from "./ADSBExchangeProvider";
import { ACTIVE_PROVIDER } from "../../config/providerConfig";

export function createActiveProvider(): ADSBProvider {
  switch (ACTIVE_PROVIDER) {
    case "airplanes_live":
      return new AirplanesLiveProvider();
    case "adsb_lol":
      return new AdsbLolProvider();
    case "adsb_fi":
      return new AdsbFiProvider();
    case "adsb_exchange": {
      const apiKey = process.env.ADSBX_API_KEY;
      if (!apiKey) {
        throw new Error(
          "ACTIVE_PROVIDER is 'adsb_exchange' but ADSBX_API_KEY is not set — see .env.example"
        );
      }
      return new ADSBExchangeProvider(apiKey);
    }
    default: {
      // Exhaustiveness check — a new ProviderName without a case here is a compile error.
      const _exhaustive: never = ACTIVE_PROVIDER;
      throw new Error(`Unknown ACTIVE_PROVIDER: ${_exhaustive}`);
    }
  }
}
