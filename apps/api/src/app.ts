// apps/api/src/app.ts
import express, { type Express } from "express";
import cors from "cors";
import { createAircraftRouter } from "./routes/aircraft";
import { createRegistryRouter } from "./routes/registry";
import { AircraftCache } from "./jobs/aircraftCache";
import { RegistryCache } from "./services/registry/registryCache";
import { createActiveProvider } from "./services/adsb/providerFactory";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const provider = createActiveProvider();
  const cache = new AircraftCache(provider);
  const registryCache = new RegistryCache();

  app.get("/health", (_req, res) => res.json({ status: "ok", provider: provider.name }));
  app.use("/api/aircraft", createAircraftRouter(cache));
  app.use("/api/registry", createRegistryRouter(registryCache));

  // Auth, logbook, stats, and notification routes are added in later stages.

  app.use(errorHandler);

  return app;
}
