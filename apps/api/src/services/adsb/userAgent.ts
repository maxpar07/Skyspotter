// apps/api/src/services/adsb/userAgent.ts
//
// Node's fetch sends no meaningful User-Agent by default, and several of
// these community providers sit behind Cloudflare — which frequently
// blocks requests with a missing/generic User-Agent as bot traffic,
// independent of actual request volume. Sending a real, identifying UA is
// both more polite (these are free services run by volunteers) and
// measurably reduces false-positive 403s from edge bot protection.

export const ADSB_USER_AGENT = "SkySpotter/1.0 (+https://github.com/maxpar07/Skyspotter)";
