// packages/shared/src/types.ts
//
// Types shared between apps/api and apps/web (and, in Phase 3, a native
// Android client talking to the same API). Keeping this in one package is
// what prevents frontend/backend drift as the project grows.

export type AircraftState = "overhead" | "approaching" | "departing" | "passing";

/** Live-tracking representation of an aircraft, as served by GET /api/aircraft/nearby. */
export interface Aircraft {
  icaoHex: string;
  callsign?: string;
  flightNumber?: string;
  registration?: string;
  aircraftType?: string;       // ICAO type code, e.g. "A320"
  airlineName?: string;
  airlineIcao?: string;
  originAirport?: string;
  destinationAirport?: string;

  latitude: number;
  longitude: number;
  altitudeFeet?: number;
  groundSpeedKnots?: number;
  trackDegrees?: number;
  verticalRateFpm?: number;
  squawk?: string;
  isMilitary: boolean;
  isCargo: boolean;

  // Present only when the aircraft broadcasts them — see the confidence
  // note in the backend's ADSBProvider.ts for how these are sourced.
  emitterCategory?: string;
  navHeadingDegrees?: number;
  navAltitudeFeet?: number;
  navQnhHpa?: number;
  navModes?: string[];
  outsideAirTempC?: number;
  windDirectionDegrees?: number;
  windSpeedKnots?: number;
  description?: string;         // human-readable type, e.g. "AIRBUS A-320"
  altitudeGeomFeet?: number;    // GNSS/INS altitude, distinct from barometric
  magHeadingDegrees?: number;   // nose heading, distinct from ground track
  emergencyStatus?: string;     // "none" unless the aircraft is squawking an emergency/priority code

  lastUpdated: string; // ISO 8601

  // Computed by the geometry service, relative to the requesting observer.
  distanceMeters?: number;
  bearingDegrees?: number;
  elevationAngleDegrees?: number;
  estimatedSecondsUntilOverhead?: number;
  state?: AircraftState;
  relevanceScore?: number;
}

export interface ObserverPosition {
  latitude: number;
  longitude: number;
  /** Meters above sea level, if known — improves elevation-angle accuracy. */
  altitudeMeters?: number;
}

export interface SpottingLogEntry {
  id: string;
  spottedAt: string;
  latitude: number;
  longitude: number;
  icaoHex: string;
  registration?: string;
  callsign?: string;
  flightNumber?: string;
  airlineName?: string;
  aircraftType?: string;
  originAirport?: string;
  destinationAirport?: string;
  altitudeFeet?: number;
  groundSpeedKnots?: number;
  isMilitary: boolean;
  isCargo: boolean;
}

export type UnitSystem = "METRIC" | "IMPERIAL";
export type Theme = "LIGHT" | "DARK" | "SYSTEM";

export interface AircraftRegistryInfo {
  manufacturer: string | null;
  typeDescription: string | null;
  registeredOwner: string | null;
  operatorFlagCode: string | null;
  registration: string | null;
}

export interface NotificationPreference {
  notifyOverhead: boolean;
  notifyA380: boolean;
  notifyB747: boolean;
  notifyMilitary: boolean;
  notifyCargo: boolean;
  watchedAirlines: string[];
  watchedAircraftTypes: string[];
  watchedRegistrations: string[];
}
