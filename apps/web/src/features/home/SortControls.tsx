// apps/web/src/features/home/SortControls.tsx

export type SortField = "relevance" | "distance" | "speed" | "altitude";
export type SortDirection = "asc" | "desc";

interface SortControlsProps {
  field: SortField;
  direction: SortDirection;
  onChange: (field: SortField, direction: SortDirection) => void;
}

const FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "distance", label: "Distance" },
  { value: "speed", label: "Speed" },
  { value: "altitude", label: "Altitude" },
];

// Direction toggle label depends on which field is active, so "ascending"
// reads as something meaningful ("Closest first") instead of jargon.
const DIRECTION_LABELS: Record<Exclude<SortField, "relevance">, Record<SortDirection, string>> = {
  distance: { asc: "Closest first", desc: "Farthest first" },
  speed: { asc: "Slowest first", desc: "Fastest first" },
  altitude: { asc: "Lowest first", desc: "Highest first" },
};

export function SortControls({ field, direction, onChange }: SortControlsProps) {
  return (
    <div className="bg-surface rounded-3xl p-5 flex flex-col gap-3 shadow-lg shadow-black/30">
      <h3 className="font-display font-semibold text-sm text-text-primary tracking-wide">Sort by</h3>

      {/* iOS-style segmented control: one pill-shaped track, active segment
          gets a raised white chip rather than a filled color — reserves
          amber/blue for state, not selection chrome. */}
      <div className="flex bg-surfaceRaised rounded-xl p-1 gap-0.5">
        {FIELD_OPTIONS.map((opt) => {
          const isActive = field === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value, opt.value === "distance" ? "asc" : "desc")}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-body transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {field !== "relevance" && (
        <button
          onClick={() => onChange(field, direction === "asc" ? "desc" : "asc")}
          className="text-left text-xs font-mono text-accent active:opacity-60 transition-opacity duration-150"
        >
          {DIRECTION_LABELS[field][direction]} ↕
        </button>
      )}
    </div>
  );
}
