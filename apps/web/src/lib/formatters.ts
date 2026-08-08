// apps/web/src/lib/formatters.ts

export function formatDistance(meters: number | undefined, imperial = true): string {
  if (meters == null) return "—";
  if (imperial) {
    const miles = meters / 1609.34;
    return miles < 0.1 ? `${Math.round(meters * 3.281)} ft` : `${miles.toFixed(1)} mi`;
  }
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function formatAltitude(feet: number | undefined, imperial = true): string {
  if (feet == null) return "—";
  return imperial ? `${Math.round(feet).toLocaleString()} ft` : `${Math.round(feet * 0.3048).toLocaleString()} m`;
}

export function formatSpeed(knots: number | undefined, imperial = true): string {
  if (knots == null) return "—";
  return imperial ? `${Math.round(knots)} kt` : `${Math.round(knots * 1.852)} km/h`;
}

export function formatEta(seconds: number | undefined): string {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)} min`;
}

export function formatBearing(degrees: number | undefined): string {
  if (degrees == null) return "—";
  const compassPoints = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return `${compassPoints[index]} ${Math.round(degrees)}°`;
}

export function formatTemperature(celsius: number | undefined, imperial = true): string {
  if (celsius == null) return "—";
  return imperial ? `${Math.round((celsius * 9) / 5 + 32)}°F` : `${Math.round(celsius)}°C`;
}

export function formatWind(speedKnots: number | undefined, directionDegrees: number | undefined, imperial = true): string {
  if (speedKnots == null && directionDegrees == null) return "—";
  if (directionDegrees == null) return formatSpeed(speedKnots, imperial);
  if (speedKnots == null) return formatBearing(directionDegrees);
  return `${formatBearing(directionDegrees)} @ ${formatSpeed(speedKnots, imperial)}`;
}

export function formatNavModes(modes: string[] | undefined): string {
  if (!modes || modes.length === 0) return "—";
  return modes.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ");
}
