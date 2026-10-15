import "server-only";
import { timingSafeEqual } from "node:crypto";

export function printMode(): "browser" | "managed" {
  const mode = process.env.ZDROP_PRINT_MODE || "browser";
  if (mode !== "browser" && mode !== "managed")
    throw new Error("ZDROP_PRINT_MODE must be browser or managed.");
  return mode;
}

/** Shared only with the trusted station process, never with the kiosk browser. */
export function stationAuthorized(authorization: string | null) {
  const secret = process.env.ZDROP_STATION_KEY || "";
  if (secret.length < 32 || secret.length > 256) return false;
  const supplied = authorization?.replace(/^Bearer /, "") || "";
  const expected = Buffer.from(secret);
  const actual = Buffer.from(supplied);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
