import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { listImages, listCategories, getOverallStats } from "@/server/images.functions";
import { GalleryGrid } from "@/components/gallery-grid";
import { Lightbox } from "@/components/lightbox";
import type { GalleryImage } from "@/types/image";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["newest", "popular", "downloads"]), "newest").default("newest"),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "WallVault — Beautiful 4K Wallpapers for Your Phone" },
      { name: "description", content: "Browse and download stunning 4K and HD phone wallpapers. Free, fast, and beautifully curated." },
      { property: "og:title", content: "WallVault — 4K Phone Wallpapers" },
      { property: "og:description", content: "Free curated phone wallpapers in multiple resolutions." },
    ],
  }),
  component: GalleryPage,
});

const PAGE_SIZE = 18;

function GalleryPage() {
  const { q, cat, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [searchInput, setSearchInput] = useState(q);
  const [open, setOpen] = useState<GalleryImage | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== q) {
        navigate({ search: (prev) => ({ ...prev, q: searchInput }) });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => { setSearchInput(q); }, [q]);

  const catsQuery = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const statsQuery = useQuery({ queryKey: ["stats"], queryFn: () => getOverallStats() });

  const imagesQuery = useInfiniteQuery({
    queryKey: ["images", { q, cat, sort }],
    queryFn: ({ pageParam = 0 }) =>
      listImages({ data: { search: q, categorySlug: cat, sort, page: pageParam, pageSize: PAGE_SIZE } }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasMore ? all.length : undefined),
  });

  const items = useMemo(
    () => (imagesQuery.data?.pages ?? []).flatMap((p) => p.items) as GalleryImage[],
    [imagesQuery.data],
  );
  const total = imagesQuery.data?.pages[0]?.total ?? 0;

  useEffect(() => {
    const el = document.getElementById("infinite-sentinel");
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && imagesQuery.hasNextPage && !imagesQuery.isFetchingNextPage) {
          imagesQuery.fetchNextPage();
        }
      },
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [imagesQuery]);

  const setSearch = (patch: Partial<{ q: string; cat: string; sort: "newest" | "popular" | "downloads" }>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero px-6 py-10 my-4 text-white shadow-glow md:px-12 md:py-16">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3 w-3" /> {statsQuery.data?.images ?? 0} wallpapers
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
            Stunning wallpapers,<br />
            <span className="opacity-80">crafted for your screen.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/85 md:text-base">
            Free 4K & HD downloads. Curated daily.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* Search */}
      <section className="sticky top-[57px] z-20 -mx-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search wallpapers…"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-11 pr-10 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          <Chip active={!cat} onClick={() => setSearch({ cat: "" })}>All</Chip>
          {catsQuery.data?.categories.map((c) => (
            <Chip key={c.id} active={cat === c.slug} onClick={() => setSearch({ cat: c.slug })}>{c.name}</Chip>
          ))}
        </div>

        {/* Sort */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          {(["newest", "popular", "downloads"] as const).map((s) => (
            <button key={s} onClick={() => setSearch({ sort: s })}
              className={`rounded-full px-3 py-1 capitalize transition-colors ${
                sort === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >{s}</button>
          ))}
        </div>
      </section>

      <p className="py-4 text-xs uppercase tracking-wider text-muted-foreground">
        {imagesQuery.isLoading ? "Loading…" : `${total} wallpaper${total === 1 ? "" : "s"}`}
      </p>

      {!imagesQuery.isLoading && items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-xl text-muted-foreground">No wallpapers yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Sign in and upload your first one from the dashboard.</p>
        </div>
      ) : (
        <GalleryGrid items={items} onOpen={setOpen} />
      )}

      <div id="infinite-sentinel" className="h-20" />
      {imagesQuery.isFetchingNextPage && (
        <p className="pb-8 text-center text-xs text-muted-foreground">Loading more…</p>
      )}

      <Lightbox image={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
        active ? "border-accent bg-accent text-accent-foreground shadow-glow" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >{children}</button>
  );
}
