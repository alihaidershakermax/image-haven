// On Vercel we disable the Cloudflare plugin and tell TanStack Start to use
// the Vercel preset so SSR + server functions deploy as Vercel Functions.
// On Lovable / local dev we keep the default (Cloudflare Workers).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  cloudflare: isVercel ? false : undefined,
  tanstackStart: isVercel ? { target: "vercel" } : undefined,
});
