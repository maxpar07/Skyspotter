// apps/web/src/features/home/RefreshRateControl.tsx
//
// iOS-style stepper: - | value | + in one pill, rather than a slider —
// this is a small discrete range (3-30s) where a stepper reads faster
// than dragging a track.

interface RefreshRateControlProps {
  seconds: number;
  onChange: (seconds: number) => void;
}

const MIN_SECONDS = 3;
const MAX_SECONDS = 30;
const STEP = 1;

export function RefreshRateControl({ seconds, onChange }: RefreshRateControlProps) {
  const decrease = () => onChange(Math.max(MIN_SECONDS, seconds - STEP));
  const increase = () => onChange(Math.min(MAX_SECONDS, seconds + STEP));

  return (
    <div className="bg-surface rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-black/30">
      <div>
        <h3 className="font-display font-semibold text-sm text-text-primary tracking-wide">Refresh rate</h3>
        <p className="text-text-muted text-xs mt-0.5">Every {seconds}s</p>
      </div>

      <div className="flex items-center bg-surfaceRaised rounded-xl overflow-hidden">
        <button
          onClick={decrease}
          disabled={seconds <= MIN_SECONDS}
          aria-label="Decrease refresh rate"
          className="w-9 h-9 flex items-center justify-center text-accent text-lg font-medium disabled:text-text-muted disabled:opacity-40 active:bg-white/10 transition-colors duration-150"
        >
          −
        </button>
        <div className="w-px h-5 bg-separator" />
        <button
          onClick={increase}
          disabled={seconds >= MAX_SECONDS}
          aria-label="Increase refresh rate"
          className="w-9 h-9 flex items-center justify-center text-accent text-lg font-medium disabled:text-text-muted disabled:opacity-40 active:bg-white/10 transition-colors duration-150"
        >
          +
        </button>
      </div>
    </div>
  );
}
