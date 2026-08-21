export type AircraftState = "overhead" | "approaching" | "departing" | "passing";
/** Live-tracking representation of an aircraft, as served by GET /api/aircraft/nearby. */
export interface Aircraft {
    icaoHex: string;
    callsign?: string;
    flightNumber?: string;
    registration?: string;
    aircraftType?: string;
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
    emitterCategory?: string;
    navHeadingDegrees?: number;
    navAltitudeFeet?: number;
    navQnhHpa?: number;
    navModes?: string[];
    outsideAirTempC?: number;
    windDirectionDegrees?: number;
    windSpeedKnots?: number;
    description?: string;
    altitudeGeomFeet?: number;
    magHeadingDegrees?: number;
    emergencyStatus?: string;
    lastUpdated: string;
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
