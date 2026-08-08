// apps/api/src/config/providerConfig.ts
//
// Single source of truth for which ADSBProvider is active. Adding a new
// provider later means: (1) implement ADSBProvider, (2) add a case here.
// Nothing else in the codebase needs to change — routes, the cache, and
// the frontend all depend only on the ADSBProvider interface.

export type ProviderName = "airplanes_live" | "adsb_lol" | "adsb_fi" | "adsb_exchange";

export const ACTIVE_PROVIDER: ProviderName =
  (process.env.ACTIVE_PROVIDER as ProviderName) || "airplanes_live";
