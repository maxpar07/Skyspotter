// apps/web/src/components/VerticalSpeedIndicator.tsx
//
// A compact climb/descend gauge — a vertical bar with a center (level)
// line and a fill that grows up or down from center depending on sign.
// Scaled to a fixed ±2000 fpm range (clamped beyond that) since that
// comfortably covers typical airliner climb/descent rates without the
// bar being dominated by rare extreme values.

const SCALE_MAX_FPM = 2000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface VerticalSpeedIndicatorProps {
  verticalRateFpm: number | undefined;
  size?: number;
}

export function VerticalSpeedIndicator({ verticalRateFpm, size = 40 }: VerticalSpeedIndicatorProps) {
  const width = size * 0.55;
  const height = size;
  const centerY = height / 2;
  const hasData = verticalRateFpm != null;
  const isLevel = hasData && Math.abs(verticalRateFpm!) < 50;
  const isClimbing = hasData && verticalRateFpm! >= 50;

  const clamped = hasData ? clamp(verticalRateFpm!, -SCALE_MAX_FPM, SCALE_MAX_FPM) : 0;
  const fillFraction = Math.abs(clamped) / SCALE_MAX_FPM; // 0–1
  const fillHeight = fillFraction * (height / 2);

  // Neutral gray when no/level data, accent blue when actively climbing or
  // descending — direction is conveyed by the fill position (above/below
  // center) and the arrow, not by color, since red/amber are reserved
  // elsewhere (emergency status, overhead alert) and shouldn't be reused
  // here for something as routine as descending.
  const fillColor = !hasData || isLevel ? "#8E8E93" : "#0A84FF";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Vertical speed">
      {/* Track */}
      <rect x={width / 2 - 2} y={2} width={4} height={height - 4} rx={2} fill="#38383A" />

      {/* Center (level) tick */}
      <line x1={2} y1={centerY} x2={width - 2} y2={centerY} stroke="#8E8E93" strokeWidth={1.5} />

      {/* Fill, growing up from center when climbing, down when descending */}
      {hasData && !isLevel && (
        <rect
          x={width / 2 - 2}
          y={isClimbing ? centerY - fillHeight : centerY}
          width={4}
          height={fillHeight}
          rx={2}
          fill={fillColor}
        />
      )}

      {/* Arrowhead at the leading edge of the fill */}
      {hasData && !isLevel && (
        <path
          d={
            isClimbing
              ? `M ${width / 2 - 5},${centerY - fillHeight + 6} L ${width / 2},${centerY - fillHeight - 2} L ${width / 2 + 5},${centerY - fillHeight + 6} Z`
              : `M ${width / 2 - 5},${centerY + fillHeight - 6} L ${width / 2},${centerY + fillHeight + 2} L ${width / 2 + 5},${centerY + fillHeight - 6} Z`
          }
          fill={fillColor}
        />
      )}
    </svg>
  );
}
