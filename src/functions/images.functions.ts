import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireDashboard } from "./dashboard-gate";

// ---------- Public listing ----------
const listSchema = z.object({
  search: z.string().max(100).optional().default(""),
  categorySlug: z.string().max(60).optional().default(""),
  tag: z.string().max(50).optional().default(""),
  sort: z.enum(["newest", "popular", "downloads"]).optional().default("newest"),
  page: z.number().int().min(0).max(500).optional().default(0),
  pageSize: z.number().int().min(4).max(48).optional().default(18),
});

export const listImages = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    let categoryId: string | null = null;
    if (data.categorySlug) {
      const { data: cat } = await supabaseAdmin
        .from("categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) return { items: [], total: 0, hasMore: false, error: null };
    }

    let q = supabaseAdmin.from("images").select("*", { count: "exact" }).eq("published", true);

    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "")}%`;
      q = q.or(`title.ilike.${term},description.ilike.${term}`);
    }
    if (categoryId) q = q.eq("category_id", categoryId);
    if (data.tag) q = q.contains("tags", [data.tag]);

    const orderCol = data.sort === "popular" ? "view_count" : data.sort === "downloads" ? "download_count" : "taken_at";
    const from = data.page * data.pageSize;
    const to = from + data.pageSize - 1;

    const { data: rows, count, error } = await q.order(orderCol, { ascending: false }).range(from, to);
    if (error) {
      console.error("listImages failed:", error);
      return { items: [], total: 0, hasMore: false, error: error.message };
    }
    const total = count ?? 0;
    return { items: rows ?? [], total, hasMore: to + 1 < total, error: null };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("categories").select("*").order("sort_order", { ascending: true });
  if (error) return { categories: [] };
  return { categories: data ?? [] };
});

export const getOverallStats = createServerFn({ method: "GET" }).handler(async () => {
  const [imgs, dls, views] = await Promise.all([
    supabaseAdmin.from("images").select("*", { count: "exact", head: true }).eq("published", true),
    supabaseAdmin.from("images").select("download_count.sum()" as any).eq("published", true).maybeSingle(),
    supabaseAdmin.from("images").select("view_count.sum()" as any).eq("published", true).maybeSingle(),
  ]);
  return {
    images: imgs.count ?? 0,
    downloads: Number((dls.data as any)?.sum ?? 0),
    views: Number((views.data as any)?.sum ?? 0),
  };
});

// ---------- Tracking ----------
export const trackView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin.from("images").select("view_count").eq("id", data.id).single();
    if (row) {
      await supabaseAdmin.from("images").update({ view_count: (row.view_count ?? 0) + 1 }).eq("id", data.id);
    }
    return { ok: true };
  });

export const trackDownload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid(),
    resolution: z.enum(["original", "4k", "hd", "thumb"]).default("original"),
  }).parse(input))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin.from("images").select("download_count").eq("id", data.id).single();
    if (row) {
      await supabaseAdmin.from("images").update({ download_count: (row.download_count ?? 0) + 1 }).eq("id", data.id);
    }
    await supabaseAdmin.from("download_logs").insert({ image_id: data.id, resolution: data.resolution });
    return { ok: true };
  });

// ---------- Categories admin ----------
export const createCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      name: z.string().trim().min(1).max(60),
      slug: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/),
      description: z.string().max(300).optional().nullable(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    requireDashboard();
    const { data: row, error } = await supabaseAdmin.from("categories").insert(data).select().single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, category: row };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    requireDashboard();
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ---------- Image admin ----------
export const deleteImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    requireDashboard();
    const { data: img } = await supabaseAdmin.from("images").select("storage_path").eq("id", data.id).maybeSingle();
    if (img?.storage_path) {
      await supabaseAdmin.storage.from("wallpapers").remove([
        `${img.storage_path}/original.jpg`,
        `${img.storage_path}/4k.jpg`,
        `${img.storage_path}/hd.jpg`,
        `${img.storage_path}/thumb.jpg`,
      ]);
    }
    const { error } = await supabaseAdmin.from("images").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const togglePublish = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), published: z.boolean() }).parse(input))
  .handler(async ({ data }) => {
    requireDashboard();
    const { error } = await supabaseAdmin.from("images").update({ published: data.published }).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ---------- Upload + multi-resolution generation ----------
const uploadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9 _-]+$/)).max(15).optional().default([]),
  categoryId: z.string().uuid().optional().nullable(),
  imageBase64: z.string().min(20).max(40_000_000),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/i),
});

function decodeBase64(input: string): Uint8Array {
  const raw = input.startsWith("data:") ? input.split(",")[1] ?? "" : input;
  const bin = atob(raw);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => uploadSchema.parse(input))
  .handler(async ({ data }) => {
    requireDashboard();
    const photon = await import("@cf-wasm/photon");

    const bytes = decodeBase64(data.imageBase64);
    if (bytes.byteLength > 25 * 1024 * 1024) {
      return { ok: false, error: "Image too large (max 25MB)" };
    }

    const original = photon.PhotonImage.new_from_byteslice(bytes);
    const origW = original.get_width();
    const origH = original.get_height();

    const resizeToWidth = (img: any, targetW: number) => {
      if (origW <= targetW) return img;
      const ratio = targetW / origW;
      const newH = Math.round(origH * ratio);
      return photon.resize(img, targetW, newH, photon.SamplingFilter.Lanczos3);
    };

    const variants = [
      { key: "original", img: original, quality: 92 },
      { key: "4k", img: resizeToWidth(original, 2160), quality: 88 },
      { key: "hd", img: resizeToWidth(original, 1080), quality: 85 },
      { key: "thumb", img: resizeToWidth(original, 480), quality: 75 },
    ] as const;

    const slugBase = slugify(data.title) || "wallpaper";
    const id = crypto.randomUUID();
    const folder = `${id}-${slugBase}`.slice(0, 80);

    const urls: Record<string, string> = {};
    let fileSize = 0;
    for (const v of variants) {
      const out = v.img.get_bytes_jpeg(v.quality);
      const path = `${folder}/${v.key}.jpg`;
      const { error: upErr } = await supabaseAdmin.storage.from("wallpapers").upload(path, out, {
        contentType: "image/jpeg", upsert: true, cacheControl: "31536000, immutable",
      });
      if (upErr) return { ok: false, error: `Upload failed (${v.key}): ${upErr.message}` };
      const { data: pub } = supabaseAdmin.storage.from("wallpapers").getPublicUrl(path);
      urls[v.key] = pub.publicUrl;
      if (v.key === "original") fileSize = out.byteLength;
    }

    let slug = slugBase;
    const { data: existing } = await supabaseAdmin.from("images").select("id").eq("slug", slug).maybeSingle();
    if (existing) slug = `${slug}-${id.slice(0, 6)}`;

    const { data: row, error } = await supabaseAdmin.from("images").insert({
      id,
      title: data.title,
      description: data.description ?? null,
      tags: data.tags ?? [],
      category_id: data.categoryId ?? null,
      url: urls.original, url_4k: urls["4k"], url_hd: urls.hd, url_thumb: urls.thumb,
      thumbnail_url: urls.thumb,
      width: origW, height: origH,
      file_size_bytes: fileSize,
      slug, storage_path: folder,
      source: "web", published: true,
    }).select().single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, image: row };
  });

// ---------- Admin list (gated) ----------
export const listImagesAdmin = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ page: z.number().int().min(0).optional().default(0), pageSize: z.number().int().min(4).max(60).optional().default(30) }).parse(input ?? {})
  )
  .handler(async ({ data }) => {
    requireDashboard();
    const from = data.page * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count, error } = await supabaseAdmin
      .from("images").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
    if (error) return { items: [], total: 0, hasMore: false };
    return { items: rows ?? [], total: count ?? 0, hasMore: to + 1 < (count ?? 0) };
  });
