// apps/api/src/services/registry/HexDbRegistryProvider.ts
//
// Owner/manufacturer/registration data is NOT part of live ADS-B telemetry
// — a position broadcast has no idea who owns the airframe. This queries a
// separate, free, keyless registry lookup (hexdb.io) keyed by ICAO hex.
//
// Honesty note: hexdb.io's response shape below is based on its commonly-
// documented schema, not a live response I've been able to fetch from this
// environment (same network restriction as the other free providers) — if
// fields come back named differently than expected, they'll just show as
// missing rather than crash, but it's worth confirming against a real
// response. Also: hexdb.io does not provide a "year built" field — that
// level of detail typically requires a national aviation registry (e.g.
// the FAA registry for US-registered aircraft only), which isn't wired up
// here.

export interface AircraftRegistryInfo {
  manufacturer: string | null;
  typeDescription: string | null;
  registeredOwner: string | null;
  operatorFlagCode: string | null;
  registration: string | null;
}

interface HexDbResponse {
  Manufacturer?: string;
  Type?: string;
  ICAOTypeCode?: string;
  RegisteredOwners?: string;
  OperatorFlagCode?: string;
  Registration?: string;
}

const DEFAULT_TIMEOUT_MS = 8000;

export class HexDbRegistryProvider {
  constructor(
    private readonly baseUrl = "https://hexdb.io/api/v1/aircraft",
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  async fetchRegistryInfo(icaoHex: string): Promise<AircraftRegistryInfo | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/${icaoHex.toLowerCase()}`, {
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error(`hexdb.io request timed out after ${this.timeoutMs}ms`);
      }
      throw new Error(`hexdb.io request failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      // hexdb.io returns 404 for an unregistered/unknown hex — a normal,
      // expected outcome, not every airframe is in the registry.
      if (response.status === 404) return null;
      throw new Error(`hexdb.io request failed: ${response.status} ${response.statusText}`);
    }

    let data: HexDbResponse;
    try {
      data = (await response.json()) as HexDbResponse;
    } catch {
      throw new Error("hexdb.io returned an invalid (non-JSON) response");
    }

    // hexdb.io returns an empty object (not a 404) for some unknown hexes —
    // treat "nothing useful in the payload" the same as "not found".
    const hasAnyField = Object.values(data).some((v) => v != null && v !== "");
    if (!hasAnyField) return null;

    return {
      manufacturer: data.Manufacturer ?? null,
      typeDescription: data.Type ?? data.ICAOTypeCode ?? null,
      registeredOwner: data.RegisteredOwners ?? null,
      operatorFlagCode: data.OperatorFlagCode ?? null,
      registration: data.Registration ?? null,
    };
  }
}
