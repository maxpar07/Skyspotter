// apps/web/src/features/home/RadarSizeControl.tsx
//
// Simple pixel-size slider for the radar. Kept separate from
// RadarRangeControl (which controls the rings/range) since size is a
// display preference, not a data one — no reason to couple their state.

export const DEFAULT_RADAR_SIZE_PX = 200;
const MIN_SIZE_PX = 160;
const MAX_SIZE_PX = 420;

interface RadarSizeControlProps {
  sizePx: number;
  onChange: (sizePx: number) => void;
}

export function RadarSizeControl({ sizePx, onChange }: RadarSizeControlProps) {
  return (
    <div className="bg-surface rounded-3xl p-5 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-semibold text-sm text-text-primary tracking-wide">Radar size</h3>
        <span className="text-text-muted text-xs font-mono tabular-nums">{sizePx}px</span>
      </div>
      <input
        type="range"
        min={MIN_SIZE_PX}
        max={MAX_SIZE_PX}
        step={10}
        value={sizePx}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Radar display size"
        className="w-full"
      />
    </div>
  );
}
