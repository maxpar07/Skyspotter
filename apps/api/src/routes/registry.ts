// apps/api/src/routes/registry.ts

import { Router, type Request, type Response, type NextFunction } from "express";
import { RegistryCache } from "../services/registry/registryCache";

export function createRegistryRouter(registryCache: RegistryCache): Router {
  const router = Router();

  // GET /api/registry/:hex
  router.get("/:hex", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hex = req.params.hex.trim();
      if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return res.status(400).json({ error: "hex must be a 6-character ICAO hex code" });
      }

      const info = await registryCache.getRegistryInfo(hex);
      res.json({ info });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
