import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, randomBytes, createHash, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "u_dash";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  // Use the existing service-role-key as the HMAC secret (server-only).
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DB_URL || "fallback-secret";
  return s;
}

function sha256Hex(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function signToken(payload: { iat: number; exp: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const [body, mac] = token.split(".");
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(mac); const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

async function readGate() {
  const { data, error } = await supabaseAdmin
    .from("dashboard_access").select("password_hash, salt").eq("id", 1).maybeSingle();
  if (error || !data) throw new Error("Dashboard gate not initialised");
  return data;
}

// ---------- session check ----------
export const checkDashboardSession = createServerFn({ method: "GET" }).handler(async () => {
  const token = getCookie(COOKIE_NAME);
  return { ok: verifyToken(token) };
});

// ---------- login ----------
export const dashboardLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    // simple in-handler tiny rate hint via random delay
    await new Promise((r) => setTimeout(r, 150 + Math.random() * 250));
    const gate = await readGate();
    const hash = sha256Hex(gate.salt + data.password);
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(gate.password_hash, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "Wrong password" };
    }
    const now = Math.floor(Date.now() / 1000);
    const token = signToken({ iat: now, exp: now + COOKIE_MAX_AGE });
    setCookie(COOKIE_NAME, token, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: COOKIE_MAX_AGE,
    });
    return { ok: true };
  });

// ---------- logout ----------
export const dashboardLogout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(COOKIE_NAME, { path: "/" });
  return { ok: true };
});

// ---------- change password (requires current session) ----------
export const changeDashboardPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(6).max(200),
  }).parse(input))
  .handler(async ({ data }) => {
    if (!verifyToken(getCookie(COOKIE_NAME))) return { ok: false, error: "Not authenticated" };
    const gate = await readGate();
    const cur = sha256Hex(gate.salt + data.currentPassword);
    const a = Buffer.from(cur, "hex"); const b = Buffer.from(gate.password_hash, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "Current password is wrong" };
    }
    const newSalt = randomBytes(16).toString("hex");
    const newHash = sha256Hex(newSalt + data.newPassword);
    const { error } = await supabaseAdmin.from("dashboard_access")
      .update({ salt: newSalt, password_hash: newHash, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
