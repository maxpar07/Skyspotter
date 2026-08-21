"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
// Errors surfaced from AircraftCache (provider down, timed out, or rate
// limited) are user-facing and not server bugs — mark them 503 so the
// frontend can distinguish "try again shortly" from a real 500.
function isUpstreamError(message) {
    return /couldn't reach|timed out|too many requests/i.test(message);
}
function errorHandler(err, _req, res, _next) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unexpected server error";
    const status = isUpstreamError(message) ? 503 : 500;
    res.status(status).json({ error: message });
}
