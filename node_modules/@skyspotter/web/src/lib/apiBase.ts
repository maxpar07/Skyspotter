// apps/web/src/lib/apiBase.ts
//
// Locally, `/api/...` works because Vite's dev server proxies it to the
// backend (see vite.config.ts) — but that proxy only exists in `vite dev`.
// A production build is static files with no server behind it, so a
// deployed frontend needs to know the REAL backend URL. VITE_API_BASE_URL
// is empty in local dev (falls back to the relative path + proxy) and set
// to the deployed backend's URL (e.g. a Render URL) in production.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
