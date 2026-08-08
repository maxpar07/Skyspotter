// apps/web/src/features/map/MapView.tsx
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Aircraft } from "@skyspotter/shared";
import { buildAircraftIcon } from "./aircraftIcon";
import { RecenterControl } from "./RecenterControl";
import { MapStyleControl } from "./MapStyleControl";
import { resolveActiveTiles, type MapMode, type StreetTheme } from "./mapStyles";
import { formatAltitude, formatDistance, formatSpeed } from "../../lib/formatters";

interface MapViewProps {
  aircraft: Aircraft[];
  userLatitude: number;
  userLongitude: number;
  selectedHex?: string | null;
  onSelect?: (icaoHex: string) => void;
}

export function MapView({ aircraft, userLatitude, userLongitude, selectedHex = null, onSelect }: MapViewProps) {
  const [mode, setMode] = useState<MapMode>("street");
  const [streetTheme, setStreetTheme] = useState<StreetTheme>("dark"); // matches the app's default dark UI
  const activeTiles = resolveActiveTiles(mode, streetTheme);
  // Distinct key per combination forces a clean tile-layer remount when
  // switching, rather than relying on react-leaflet to diff a changed URL.
  const tileKey = mode === "satellite" ? "satellite" : `street-${streetTheme}`;

  return (
    <div className="rounded-3xl overflow-hidden shadow-lg shadow-black/30 relative" style={{ height: "70vh" }}>
      <MapContainer
        center={[userLatitude, userLongitude]}
        zoom={9}
        style={{ height: "100%", width: "100%", background: "#000" }}
      >
        <TileLayer key={tileKey} url={activeTiles.url} attribution={activeTiles.attribution} maxZoom={activeTiles.maxZoom} />

        <CircleMarker
          center={[userLatitude, userLongitude]}
          radius={7}
          pathOptions={{ color: "#0A84FF", fillColor: "#0A84FF", fillOpacity: 1, weight: 2 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>

        {aircraft
          .filter((a) => a.latitude != null && a.longitude != null)
          .map((a) => (
            <Marker
              key={a.icaoHex}
              position={[a.latitude, a.longitude]}
              icon={buildAircraftIcon(a, a.icaoHex === selectedHex)}
              eventHandlers={{ click: () => onSelect?.(a.icaoHex) }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">
                    {a.flightNumber ?? a.callsign ?? a.icaoHex}
                  </div>
                  <div className="text-xs opacity-70">{a.aircraftType ?? "Unknown type"}</div>
                  <div className="text-xs mt-1">
                    {formatAltitude(a.altitudeFeet)} · {formatSpeed(a.groundSpeedKnots)} · {formatDistance(a.distanceMeters)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        <RecenterControl latitude={userLatitude} longitude={userLongitude} />
      </MapContainer>

      <MapStyleControl
        mode={mode}
        streetTheme={streetTheme}
        onModeChange={setMode}
        onStreetThemeChange={setStreetTheme}
      />
    </div>
  );
}
