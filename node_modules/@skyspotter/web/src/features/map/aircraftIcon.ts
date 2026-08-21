// apps/web/src/features/map/aircraftIcon.ts
//
// Builds a Leaflet divIcon per aircraft: a generic top-down airplane
// silhouette (fuselage + swept wings + tail — the universally-recognized
// "flight" glyph shape, nose pointing up at heading 0) rotated to the
// aircraft's track, tinted amber if overhead (matching the rest of the
// app's "amber = overhead now" convention) or accent blue otherwise.
// divIcon (not a static image) is what makes per-aircraft rotation and
// color possible without pre-rendering an icon for every heading.

import L from "leaflet";
import type { Aircraft } from "@skyspotter/shared";

const AMBER = "#FF9F0A";
const ACCENT = "#0A84FF";

export function buildAircraftIcon(aircraft: Aircraft, isSelected = false): L.DivIcon {
  const heading = aircraft.trackDegrees ?? 0;
  const color = aircraft.state === "overhead" ? AMBER : ACCENT;
  const isOverhead = aircraft.state === "overhead";
  const ringColor = isOverhead ? AMBER : ACCENT;

  const html = `
    <div style="
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      transform: rotate(${heading}deg);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="#000" stroke-width="0.4">
        <path d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,21V22.5L11.5,21L15.5,22.5V21L13,19V13.5L21,16Z" />
      </svg>
      ${isOverhead || isSelected ? `<div style="
        position: absolute; width: 34px; height: 34px; border-radius: 999px;
        border: 1.5px solid ${ringColor}; opacity: 0.6;
      "></div>` : ""}
    </div>
  `;

  return L.divIcon({
    html,
    className: "skyspotter-aircraft-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
