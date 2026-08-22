// apps/web/src/features/map/RecenterControl.tsx
//
// The map does NOT auto-recenter on every poll — that fights the user the
// moment they pan to look at something. Instead, a floating button (iOS
// Maps convention) lets them snap back to their location on demand.

import { useMap } from "react-leaflet";

interface RecenterControlProps {
  latitude: number;
  longitude: number;
}

export function RecenterControl({ latitude, longitude }: RecenterControlProps) {
  const map = useMap();

  return (
    <button
      onClick={() => map.flyTo([latitude, longitude], map.getZoom(), { duration: 0.6 })}
      aria-label="Recenter on my location"
      className="absolute bottom-5 right-5 z-[1000] w-11 h-11 rounded-full bg-surface shadow-lg shadow-black/40 flex items-center justify-center active:scale-90 transition-transform duration-150"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
      </svg>
    </button>
  );
}
