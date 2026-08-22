// apps/web/src/features/home/ViewModeToggle.tsx

export type ViewMode = "list" | "map";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "list", label: "List" },
  { value: "map", label: "Map" },
];

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex bg-surfaceRaised rounded-xl p-1 gap-0.5 w-fit">
      {OPTIONS.map((opt) => {
        const isActive = mode === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-body transition-all duration-200 active:scale-95 ${
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
  );
}
