"use strict";
// apps/api/src/services/adsb/ADSBProvider.ts
//
// Any live ADS-B data source implements this interface. The rest of the
// codebase (aircraft cache, routes, ranking, geometry) depends only on
// this contract — swapping ADS-B Exchange for OpenSky, FlightAware, or a
// self-hosted receiver later means writing one new class, nothing else
// changes.
Object.defineProperty(exports, "__esModule", { value: true });
