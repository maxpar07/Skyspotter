// apps/web/src/features/map/mapStyles.ts
//
// Two top-level modes: Street (with its own light/dark theme) and
// Satellite (imagery has no day/night theme, so it doesn't get one).
// All sources are free and keyless.

export type MapMode = "street" | "satellite";
export type StreetTheme = "light" | "dark";

export interface TileConfig {
  url: string;
  attribution: string;
  maxZoom?: number;
}

export const STREET_TILES: Record<StreetTheme, TileConfig> = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export const SATELLITE_TILES: TileConfig = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  maxZoom: 19,
};

/** Resolves the active tile config for whatever mode/theme combination is selected. */
export function resolveActiveTiles(mode: MapMode, streetTheme: StreetTheme): TileConfig {
  return mode === "satellite" ? SATELLITE_TILES : STREET_TILES[streetTheme];
}
