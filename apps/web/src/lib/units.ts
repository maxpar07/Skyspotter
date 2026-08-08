// apps/web/src/lib/units.ts
//
// The ADS-B providers (adsb.lol, adsb.fi) query by nautical miles — that's
// a real API contract we don't control. The UI shows statute miles because
// that's what's familiar to most users. This is the single place that
// conversion happens, so the two never drift.

const NM_PER_MILE = 0.868976;
const MILES_PER_NM = 1.15078;

export function milesToNm(miles: number): number {
  return miles * NM_PER_MILE;
}

export function nmToMiles(nm: number): number {
  return nm * MILES_PER_NM;
}
