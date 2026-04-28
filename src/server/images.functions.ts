import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const listSchema = z.object({
  search: z.string().max(100).optional().default(""),
  tag: z.string().max(50).optional().default(""),
  range: z.enum(["all", "week", "month", "year"]).optional().default("all"),
  page: z.number().int().min(0).max(500).optional().default(0),
  pageSize: z.number().int().min(4).max(48).optional().default(18),
});

export const listImages = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("images").select("*", { count: "exact" });

    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "")}%`;
      q = q.or(`title.ilike.${term},description.ilike.${term}`);
    }
    if (data.tag) {
      q = q.contains("tags", [data.tag]);
    }
    if (data.range !== "all") {
      const days = data.range === "week" ? 7 : data.range === "month" ? 30 : 365;
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      q = q.gte("taken_at", since);
    }

    const from = data.page * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count, error } = await q
      .order("taken_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("listImages failed:", error);
      return { items: [], total: 0, hasMore: false, error: error.message };
    }
    const total = count ?? 0;
    return { items: rows ?? [], total, hasMore: to + 1 < total, error: null };
  });

export const listTags = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("images").select("tags");
  if (error || !data) return { tags: [] as string[] };
  const set = new Set<string>();
  for (const r of data) (r.tags as string[] | null)?.forEach((t) => set.add(t));
  return { tags: Array.from(set).sort() };
});

export const trackView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("images")
      .select("view_count")
      .eq("id", data.id)
      .single();
    if (row) {
      await supabaseAdmin
        .from("images")
        .update({ view_count: (row.view_count ?? 0) + 1 })
        .eq("id", data.id);
    }
    return { ok: true };
  });

export const trackDownload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("images")
      .select("download_count")
      .eq("id", data.id)
      .single();
    if (row) {
      await supabaseAdmin
        .from("images")
        .update({ download_count: (row.download_count ?? 0) + 1 })
        .eq("id", data.id);
    }
    return { ok: true };
  });