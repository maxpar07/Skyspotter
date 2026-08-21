"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
// apps/api/src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const aircraft_1 = require("./routes/aircraft");
const registry_1 = require("./routes/registry");
const aircraftCache_1 = require("./jobs/aircraftCache");
const registryCache_1 = require("./services/registry/registryCache");
const providerFactory_1 = require("./services/adsb/providerFactory");
const errorHandler_1 = require("./middleware/errorHandler");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    const provider = (0, providerFactory_1.createActiveProvider)();
    const cache = new aircraftCache_1.AircraftCache(provider);
    const registryCache = new registryCache_1.RegistryCache();
    app.get("/health", (_req, res) => res.json({ status: "ok", provider: provider.name }));
    app.use("/api/aircraft", (0, aircraft_1.createAircraftRouter)(cache));
    app.use("/api/registry", (0, registry_1.createRegistryRouter)(registryCache));
    // Auth, logbook, stats, and notification routes are added in later stages.
    app.use(errorHandler_1.errorHandler);
    return app;
}
