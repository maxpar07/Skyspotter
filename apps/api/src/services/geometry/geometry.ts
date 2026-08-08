// apps/api/src/services/geometry/geometry.ts
//
// Pure, stateless geometry math: distance, bearing, elevation angle, and
// overhead-ETA estimation relative to an observer. No I/O, no state —
// easy to unit test independent of any live ADS-B data.

import type { AircraftState } from "@skyspotter/shared";

const EARTH_RADIUS_METERS = 6_371_000;

export interface ObserverPoint {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
}

export interface TrackedPoint {
  latitude: number;
  longitude: number;
  altitudeFeet?: number;
  groundSpeedKnots?: number;
  trackDegrees?: number;
}

export interface SpottingMetrics {
  distanceMeters: number;
  bearingDegrees: number;
  elevationAngleDegrees: number;
  estimatedSecondsUntilOverhead?: number;
  state: AircraftState;
}

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance between two lat/lon points, in meters (haversine). */
export function haversineDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from point a to point b, degrees (0-360). */
export function bearingDegrees(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const theta = Math.atan2(y, x);
  return (toDegrees(theta) + 360) % 360;
}

/**
 * Angle above the horizon (0 = at the horizon, 90 = straight up) as seen by
 * the observer, accounting for the aircraft's altitude and slant distance.
 */
export function elevationAngleDegrees(
  observer: ObserverPoint,
  aircraft: TrackedPoint,
  groundDistanceMeters: number
): number {
  const observerAltM = observer.altitudeMeters ?? 0;
  const aircraftAltM = (aircraft.altitudeFeet ?? 0) * 0.3048;
  const heightDiffM = aircraftAltM - observerAltM;

  if (groundDistanceMeters < 1) return 90; // directly overhead, avoid atan(inf) edge noise

  return toDegrees(Math.atan2(heightDiffM, groundDistanceMeters));
}

/**
 * Component of the aircraft's ground speed that is closing the distance to
 * the observer (positive = closing, negative = opening), in meters/second.
 */
function closingSpeedMetersPerSecond(
  observer: { latitude: number; longitude: number },
  aircraft: TrackedPoint
): number | undefined {
  if (aircraft.groundSpeedKnots == null || aircraft.trackDegrees == null) {
    return undefined;
  }

  const bearingToObserver = bearingDegrees(aircraft, observer);
  const headingDeltaRad = toRadians(bearingToObserver - aircraft.trackDegrees);
  const speedMps = aircraft.groundSpeedKnots * 0.514444;

  return speedMps * Math.cos(headingDeltaRad);
}

const OVERHEAD_ELEVATION_THRESHOLD_DEG = 70;
const APPROACHING_CLOSING_SPEED_THRESHOLD_MPS = 5;

export function classifyState(
  elevation: number,
  closingSpeedMps: number | undefined
): AircraftState {
  if (elevation >= OVERHEAD_ELEVATION_THRESHOLD_DEG) return "overhead";
  if (closingSpeedMps == null) return "passing";
  if (closingSpeedMps >= APPROACHING_CLOSING_SPEED_THRESHOLD_MPS) return "approaching";
  if (closingSpeedMps <= -APPROACHING_CLOSING_SPEED_THRESHOLD_MPS) return "departing";
  return "passing";
}

/** Computes the full set of spotting metrics for one aircraft relative to one observer. */
export function computeSpottingMetrics(
  observer: ObserverPoint,
  aircraft: TrackedPoint
): SpottingMetrics {
  const distanceMeters = haversineDistanceMeters(observer, aircraft);
  const bearing = bearingDegrees(observer, aircraft);
  const elevation = elevationAngleDegrees(observer, aircraft, distanceMeters);
  const closingSpeed = closingSpeedMetersPerSecond(observer, aircraft);

  const estimatedSecondsUntilOverhead =
    closingSpeed && closingSpeed > 0 ? distanceMeters / closingSpeed : undefined;

  return {
    distanceMeters,
    bearingDegrees: bearing,
    elevationAngleDegrees: elevation,
    estimatedSecondsUntilOverhead,
    state: classifyState(elevation, closingSpeed),
  };
}

/**
 * Relevance score for ranking the "most interesting aircraft" on the Home
 * screen. Weighted toward things a spotter would actually look up for:
 * overhead > approaching soon > close > high/rare-looking traffic.
 */
export function computeRelevanceScore(
  metrics: SpottingMetrics,
  opts: { isMilitary: boolean; isCargo: boolean; isWidebody: boolean }
): number {
  let score = 0;

  if (metrics.state === "overhead") score += 100;
  else if (metrics.state === "approaching") score += 60;

  score += Math.max(0, 50 - metrics.distanceMeters / 200); // closer = more points, decays over ~10km
  score += Math.max(0, metrics.elevationAngleDegrees / 2);  // higher in the sky = more visible

  if (opts.isMilitary) score += 40;
  if (opts.isCargo) score += 10;
  if (opts.isWidebody) score += 15;

  return score;
}
