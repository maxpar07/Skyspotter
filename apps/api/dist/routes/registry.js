"use strict";
// apps/api/src/routes/registry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistryRouter = createRegistryRouter;
const express_1 = require("express");
function createRegistryRouter(registryCache) {
    const router = (0, express_1.Router)();
    // GET /api/registry/:hex
    router.get("/:hex", async (req, res, next) => {
        try {
            const hex = req.params.hex.trim();
            if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
                return res.status(400).json({ error: "hex must be a 6-character ICAO hex code" });
            }
            const info = await registryCache.getRegistryInfo(hex);
            res.json({ info });
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
