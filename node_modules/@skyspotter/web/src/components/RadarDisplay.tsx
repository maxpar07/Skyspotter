// apps/web/src/components/RadarDisplay.tsx
//
// A distance/bearing radar, center = observer. Concentric rings mark the
// user's configured mile distances; the outermost active ring defines the
// radar's range. An aircraft within range is drawn as a dot at its true
// scaled position — size/opacity also step down with distance so "close"
// reads as close even before checking a number. An aircraft beyond every
// ring is drawn only as an arrow pinned to the edge, since its distance
// isn't meaningfully placeable on this scale — direction is all that's
// shown for it.

import { useId } from "react";

interface RadarDisplayProps {
  bearingDegrees: number | null;
  distanceMeters: number | null;
  ringsMiles: number[];
  isOverhead?: boolean;
  size?: number;
}

const METERS_PER_MILE = 1609.34;

export function RadarDisplay({
  bearingDegrees,
  distanceMeters,
  ringsMiles,
  isOverhead = false,
  size = 200,
}: RadarDisplayProps) {
  const arrowheadId = useId();
  const center = size / 2;
  const maxRadius = size / 2 - 24; // leave room for compass + ring labels

  const sortedRings = [...ringsMiles].filter((mi) => mi > 0).sort((a, b) => a - b);
  const maxRangeMiles = sortedRings.length > 0 ? sortedRings[sortedRings.length - 1] : 20;

  const distanceMiles = distanceMeters != null ? distanceMeters / METERS_PER_MILE : null;
  const bearingKnown = bearingDegrees != null;
  const inRange = distanceMiles != null && distanceMiles <= maxRangeMiles;

  const milesToRadius = (miles: number) => Math.min(miles / maxRangeMiles, 1) * maxRadius;

  const color = isOverhead ? "#FF9F0A" : "#0A84FF";

  // In-range: a dot at the aircraft's true scaled distance.
  const dotPos =
    inRange && bearingKnown && distanceMiles != null ? polarToXY(center, milesToRadius(distanceMiles), bearingDegrees!) : null;
  const dotStyle = dotStyleForDistance(distanceMiles, maxRangeMiles, isOverhead);

  // Out of range (or in range but distance unknown): an arrow pinned to
  // the edge, pointing outward along the bearing — "it's out there, this
  // way" rather than a fabricated position on the scale.
  const showArrow = !inRange && bearingKnown;
  const arrowStart = showArrow ? polarToXY(center, maxRadius - 14, bearingDegrees!) : null;
  const arrowTip = showArrow ? polarToXY(center, maxRadius + 10, bearingDegrees!) : null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Radar showing the aircraft's distance and direction from your location"
    >
      <defs>
        <marker id={arrowheadId} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>

      {/* Range rings, one per configured mile mark */}
      {sortedRings.map((mi) => {
        const r = milesToRadius(mi);
        const labelPos = polarToXY(center, r, 55);
        return (
          <g key={mi}>
            <circle cx={center} cy={center} r={r} fill="none" stroke="#38383A" strokeWidth={1} />
            <text x={labelPos.x + 3} y={labelPos.y} textAnchor="start" className="fill-text-muted text-[8px] font-mono">
              {mi}mi
            </text>
          </g>
        );
      })}

      {/* Compass cross */}
      <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="#38383A" strokeWidth={1} opacity={0.6} />
      <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="#38383A" strokeWidth={1} opacity={0.6} />

      {/* Compass labels */}
      <text x={center} y={center - maxRadius - 8} textAnchor="middle" className="fill-text-muted text-[10px] font-mono">N</text>
      <text x={center + maxRadius + 10} y={center + 4} textAnchor="middle" className="fill-text-muted text-[10px] font-mono">E</text>
      <text x={center} y={center + maxRadius + 16} textAnchor="middle" className="fill-text-muted text-[10px] font-mono">S</text>
      <text x={center - maxRadius - 10} y={center + 4} textAnchor="middle" className="fill-text-muted text-[10px] font-mono">W</text>

      {/* Out-of-range direction arrow */}
      {arrowStart && arrowTip && (
        <line
          x1={arrowStart.x}
          y1={arrowStart.y}
          x2={arrowTip.x}
          y2={arrowTip.y}
          stroke={color}
          strokeWidth={2.5}
          opacity={0.9}
          markerEnd={`url(#${arrowheadId})`}
        />
      )}

      {/* In-range aircraft dot */}
      {dotPos && (
        <g>
          <circle cx={dotPos.x} cy={dotPos.y} r={dotStyle.radius} fill={color} opacity={dotStyle.opacity} />
          {isOverhead && (
            <circle cx={dotPos.x} cy={dotPos.y} r={12} fill="none" stroke="#FF9F0A" strokeWidth={1.5} opacity={0.5}>
              <animate attributeName="r" values="7;16;7" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      )}

      {/* Observer marker */}
      <circle cx={center} cy={center} r={2} fill="#8E8E93" />
    </svg>
  );
}

function polarToXY(center: number, radius: number, bearingDegrees: number): { x: number; y: number } {
  // Bearing 0 = North = straight up on screen, increasing clockwise.
  const rad = ((bearingDegrees - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

// Closer aircraft render as a bigger, more opaque dot; farther ones (but
// still in range) fade and shrink slightly — so "how far away" reads from
// the dot itself, not just its position against the rings.
function dotStyleForDistance(
  distanceMiles: number | null,
  maxRangeMiles: number,
  isOverhead: boolean
): { radius: number; opacity: number } {
  if (isOverhead) return { radius: 7, opacity: 1 };
  if (distanceMiles == null) return { radius: 5, opacity: 1 };
  const t = Math.min(Math.max(distanceMiles / maxRangeMiles, 0), 1); // 0 = close, 1 = at the edge
  return {
    radius: 7 - t * 3,
    opacity: 1 - t * 0.45,
  };
}
