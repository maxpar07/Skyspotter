// apps/web/src/components/SkyDial.tsx
//
// The signature element: a polar azimuth/elevation plot — the same
// convention used for sun-path and satellite-pass charts. Center = zenith
// AND the observer's GPS location projected straight up; edge = horizon.
// An arrow is drawn from center to the aircraft's position, so the
// direction to the plane from the user's location is explicit, not just
// implied by where the dot happens to sit.

import { useId } from "react";

interface SkyDialProps {
  bearingDegrees: number | null;
  elevationDegrees: number | null;
  isOverhead?: boolean;
  size?: number;
}

const RING_ELEVATIONS = [0, 30, 60]; // horizon, mid-sky, near-zenith reference rings

export function SkyDial({ bearingDegrees, elevationDegrees, isOverhead = false, size = 200 }: SkyDialProps) {
  const arrowheadId = useId();
  const center = size / 2;
  const maxRadius = size / 2 - 24; // leave room for compass labels

  const elevationToRadius = (elevation: number) => ((90 - elevation) / 90) * maxRadius;

  const markerRadius = isOverhead ? 7 : 5;
  const color = isOverhead ? "#FF9F0A" : "#0A84FF";

  const markerPos =
    bearingDegrees != null && elevationDegrees != null
      ? polarToXY(center, elevationToRadius(Math.max(0, Math.min(90, elevationDegrees))), bearingDegrees)
      : null;

  // Shorten the arrow so it stops just short of the marker circle rather
  // than disappearing underneath it — the arrowhead should visibly point
  // AT the plane, not be hidden by it.
  const arrowEnd = markerPos ? shortenToward(center, center, markerPos.x, markerPos.y, markerRadius + 6) : null;
  const arrowLength = markerPos ? Math.hypot(markerPos.x - center, markerPos.y - center) : 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Direction and elevation of the aircraft from your location">
      <defs>
        <marker
          id={arrowheadId}
          markerWidth={8}
          markerHeight={8}
          refX={6}
          refY={3}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>

      {/* Reference rings */}
      {RING_ELEVATIONS.map((el) => (
        <circle
          key={el}
          cx={center}
          cy={center}
          r={elevationToRadius(el)}
          fill="none"
          stroke="#38383A"
          strokeWidth={1}
        />
      ))}

      {/* Compass cross */}
      <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="#38383A" strokeWidth={1} opacity={0.6} />
      <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="#38383A" strokeWidth={1} opacity={0.6} />

      {/* Compass labels */}
      <text x={center} y={center - maxRadius - 8} textAnchor="middle" className="fill-text-muted text-[10px] font-mono">N</text>
      <text x={center + maxRadius + 10} y={center + 4} textAnchor="middle" className="fill-text-muted text-[10px] font-mono">E</text>
      <text x={center} y={center + maxRadius + 16} textAnchor="middle" className="fill-text-muted text-[10px] font-mono">S</text>
      <text x={center - maxRadius - 10} y={center + 4} textAnchor="middle" className="fill-text-muted text-[10px] font-mono">W</text>

      {/* Direction arrow: points from the user's GPS location (center)
          toward the aircraft's current bearing. Skipped when the plane is
          essentially directly overhead (arrowLength ~0) — there's no
          meaningful horizontal direction to point at that point. */}
      {markerPos && arrowEnd && arrowLength > 10 && (
        <line
          x1={center}
          y1={center}
          x2={arrowEnd.x}
          y2={arrowEnd.y}
          stroke={color}
          strokeWidth={2}
          opacity={0.85}
          markerEnd={`url(#${arrowheadId})`}
        />
      )}

      {/* Aircraft marker */}
      {markerPos && (
        <g>
          <circle cx={markerPos.x} cy={markerPos.y} r={markerRadius} fill={color} />
          {isOverhead && (
            <circle cx={markerPos.x} cy={markerPos.y} r={12} fill="none" stroke="#FF9F0A" strokeWidth={1.5} opacity={0.5}>
              <animate attributeName="r" values="7;16;7" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      )}

      {/* Zenith / observer marker */}
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

/** Point along the line from (x1,y1) to (x2,y2), stopped `shrinkBy` px short of (x2,y2). */
function shortenToward(x1: number, y1: number, x2: number, y2: number, shrinkBy: number): { x: number; y: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist <= shrinkBy) return { x: x1, y: y1 };
  const t = (dist - shrinkBy) / dist;
  return { x: x1 + dx * t, y: y1 + dy * t };
}
