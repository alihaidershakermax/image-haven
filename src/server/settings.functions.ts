import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireDashboard } from "./dashboard-gate";

// ---------- Site settings ----------
export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return { settings: data };
});

const settingsSchema = z.object({
  site_name: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(160).default(""),
  favicon_url: z.string().url().max(500).nullable().optional(),
  logo_url: z.string().url().max(500).nullable().optional(),
  privacy_policy: z.string().max(20000).default(""),
  telegram_bot_enabled: z.boolean().default(false),
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data }) => {
    requireDashboard();
    const { error } = await supabaseAdmin.from("site_settings")
      .update({ ...data, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ---------- About ----------
export const getAbout = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("about_content").select("*").eq("id", 1).maybeSingle();
  return { about: data };
});

const aboutSchema = z.object({
  heading: z.string().trim().min(1).max(120),
  body: z.string().trim().max(5000),
  instagram_url: z.string().url().max(300),
  instagram_handle: z.string().trim().min(1).max(60),
  photo_url: z.string().url().max(500).nullable().optional(),
});

export const updateAbout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => aboutSchema.parse(input))
  .handler(async ({ data }) => {
    requireDashboard();
    const { error } = await supabaseAdmin.from("about_content")
      .update({ ...data, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
