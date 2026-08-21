"use strict";
// apps/api/src/config/providerConfig.ts
//
// Single source of truth for which ADSBProvider is active. Adding a new
// provider later means: (1) implement ADSBProvider, (2) add a case here.
// Nothing else in the codebase needs to change — routes, the cache, and
// the frontend all depend only on the ADSBProvider interface.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_PROVIDER = void 0;
exports.ACTIVE_PROVIDER = process.env.ACTIVE_PROVIDER || "airplanes_live";
