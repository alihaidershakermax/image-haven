import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 50_000;
const MIN_REMAINING_MS = 8_000;

function parseTitleAndTags(caption: string | undefined | null): {
  title: string;
  description: string | null;
  tags: string[];
} {
  if (!caption) return { title: "Untitled", description: null, tags: [] };
  const tags = Array.from(caption.matchAll(/#([\p{L}0-9_]+)/gu)).map((m) => m[1].toLowerCase());
  const cleaned = caption.replace(/#[\p{L}0-9_]+/gu, "").trim();
  const [firstLine, ...rest] = cleaned.split("\n");
  return {
    title: (firstLine || "Untitled").slice(0, 200),
    description: rest.join("\n").trim() || null,
    tags: Array.from(new Set(tags)).slice(0, 10),
  };
}

async function pollOnce() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing — Lovable AI not configured");
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY missing — connect the Telegram connector");

  const { data: state, error: stateErr } = await supabaseAdmin
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();
  if (stateErr) throw new Error(`State read failed: ${stateErr.message}`);
  let currentOffset: number = state.update_offset;

  const start = Date.now();
  let processed = 0;

  while (true) {
    const remaining = MAX_RUNTIME_MS - (Date.now() - start);
    if (remaining < MIN_REMAINING_MS) break;
    const timeout = Math.min(45, Math.floor(remaining / 1000) - 5);
    if (timeout < 1) break;

    const res = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offset: currentOffset, timeout, allowed_updates: ["message"] }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`getUpdates failed [${res.status}]: ${JSON.stringify(data)}`);
    const updates: any[] = data.result ?? [];
    if (updates.length === 0) continue;

    for (const u of updates) {
      const msg = u.message;
      if (!msg?.photo?.length) continue;
      // Pick the largest photo size
      const photo = msg.photo.reduce((a: any, b: any) => (a.file_size > b.file_size ? a : b));

      // getFile to obtain file_path
      const fileRes = await fetch(`${GATEWAY_URL}/getFile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_id: photo.file_id }),
      });
      const fileData = await fileRes.json();
      if (!fileRes.ok) {
        console.error("getFile failed", fileData);
        continue;
      }
      const filePath: string = fileData.result.file_path;

      // Download the bytes
      const dlRes = await fetch(`${GATEWAY_URL}/file/${filePath}`, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
        },
      });
      if (!dlRes.ok) {
        console.error("file download failed", dlRes.status);
        continue;
      }
      const bytes = new Uint8Array(await dlRes.arrayBuffer());
      const objectPath = `telegram/${msg.message_id}-${photo.file_unique_id}.jpg`;

      // Ensure bucket exists (idempotent)
      await supabaseAdmin.storage.createBucket("gallery", { public: true }).catch(() => {});

      const { error: upErr } = await supabaseAdmin.storage
        .from("gallery")
        .upload(objectPath, bytes, { contentType: "image/jpeg", upsert: true });
      if (upErr) {
        console.error("upload failed", upErr);
        continue;
      }
      const { data: pub } = supabaseAdmin.storage.from("gallery").getPublicUrl(objectPath);

      const { title, description, tags } = parseTitleAndTags(msg.caption);

      const { error: insertErr } = await supabaseAdmin.from("images").upsert(
        {
          telegram_message_id: msg.message_id,
          title,
          description,
          tags,
          source: "telegram",
          url: pub.publicUrl,
          thumbnail_url: pub.publicUrl,
          width: photo.width,
          height: photo.height,
          taken_at: new Date(msg.date * 1000).toISOString(),
        },
        { onConflict: "telegram_message_id" },
      );
      if (insertErr) {
        console.error("insert failed", insertErr);
        continue;
      }
      processed++;
    }

    const newOffset = Math.max(...updates.map((u) => u.update_id)) + 1;
    const { error: updErr } = await supabaseAdmin
      .from("telegram_bot_state")
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (updErr) throw new Error(`State update failed: ${updErr.message}`);
    currentOffset = newOffset;
  }

  return { processed, finalOffset: currentOffset };
}

export const Route = createFileRoute("/api/public/telegram-poll")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await pollOnce();
          return Response.json({ ok: true, ...result });
        } catch (e: any) {
          console.error("telegram-poll error:", e);
          return Response.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
        }
      },
      GET: async () => Response.json({ ok: true, hint: "POST to trigger a single poll cycle." }),
    },
  },
});