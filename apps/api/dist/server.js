"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/server.ts
require("dotenv/config");
const app_1 = require("./app");
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const app = (0, app_1.createApp)();
app.listen(PORT, () => {
    console.log(`SkySpotter API listening on http://localhost:${PORT}`);
});
