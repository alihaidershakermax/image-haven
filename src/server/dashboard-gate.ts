// Server-only helper: throws if the dashboard cookie is invalid.
import { getCookie } from "@tanstack/react-start/server";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "u_dash";

function getSecret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL || "fallback-secret";
}

export function requireDashboard(): void {
  const token = getCookie(COOKIE_NAME);
  if (!token || !token.includes(".")) throw new Error("Forbidden");
  const [body, mac] = token.split(".");
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  const a = Buffer.from(mac); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Forbidden");
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error("Forbidden");
    }
  } catch { throw new Error("Forbidden"); }
}
