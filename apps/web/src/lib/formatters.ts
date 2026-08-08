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
  return imperial ? `${Math.round(knots * 1.15078)} mph` : `${Math.round(knots * 1.852)} km/h`;
}

// Altimeter setting (QNH). Aviation convention: North America reads this
// in inches of mercury (inHg, two decimals — e.g. "29.92"), most of the
// rest of the world in hectopascals. Since the app's metric/imperial
// toggle is a general units preference rather than an aviation-specific
// one, mmHg is used for metric here (also a legitimate, if less common,
// pressure convention) per how this app's "metric" mode is defined
// elsewhere (km/h, meters, etc.) — hPa itself is not shown in either mode.
export function formatQnh(hPa: number | undefined, imperial = true): string {
  if (hPa == null) return "—";
  return imperial ? `${(hPa * 0.0295299831).toFixed(2)} inHg` : `${Math.round(hPa * 0.7500616827)} mmHg`;
}

// Vertical rate. fpm (feet per minute) is the standard aviation VSI unit
// and is used for imperial; metric uses m/s, which is the conventional
// metric VSI unit (not m/min) — this matches how vertical speed indicators
// are actually labeled in the two systems, not just a linear unit swap.
// Sign is always shown explicitly (+/-) since direction is the point.
export function formatVerticalSpeed(fpm: number | undefined, imperial = true): string {
  if (fpm == null) return "—";
  if (Math.abs(fpm) < 50) return imperial ? "Level" : "Level";
  const sign = fpm > 0 ? "+" : "";
  return imperial
    ? `${sign}${Math.round(fpm).toLocaleString()} fpm`
    : `${sign}${(fpm * 0.00508).toFixed(1)} m/s`;
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
