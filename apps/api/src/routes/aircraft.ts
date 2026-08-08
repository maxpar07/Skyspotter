// apps/api/src/routes/aircraft.ts

import { Router, type Request, type Response, type NextFunction } from "express";
import { AircraftCache } from "../jobs/aircraftCache";

export function createAircraftRouter(cache: AircraftCache): Router {
  const router = Router();

  // GET /api/aircraft/nearby?lat=..&lon=..&radiusNm=..
  router.get("/nearby", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lat = parseFloat(String(req.query.lat));
      const lon = parseFloat(String(req.query.lon));
      const radiusNm = req.query.radiusNm ? parseFloat(String(req.query.radiusNm)) : 30;

      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return res.status(400).json({ error: "lat and lon query params are required numbers" });
      }

      const aircraft = await cache.getNearby({ latitude: lat, longitude: lon }, radiusNm);
      res.json({ aircraft });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/aircraft/search?q=..
  router.get("/search", async (req: Request, res: Response) => {
    const q = String(req.query.q ?? "").trim().toUpperCase();
    if (!q) return res.json({ results: [] });

    // Searches across the most recently cached results only — this is a
    // "search what's currently in the air near me" endpoint, not a
    // historical flight lookup (that's the logbook, which is DB-backed).
    res.json({ results: cache.searchCached(q) });
  });

  return router;
}
