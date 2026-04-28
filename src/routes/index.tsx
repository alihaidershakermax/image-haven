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
      { title: "Unposed — A Quiet Wallpaper Journal" },
      { name: "description", content: "An editorial collection of wallpapers in 4K and HD. Free, curated, and quietly beautiful." },
      { property: "og:title", content: "Unposed — Editorial Wallpapers" },
      { property: "og:description", content: "A quiet, editorial collection of wallpapers." },
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
        const updater = (prev: z.infer<typeof searchSchema>) => ({ ...prev, q: searchInput });
        navigate({ search: updater });
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
    const updater = (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch });
    navigate({ search: updater });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      {/* Editorial masthead */}
      <section className="border-b border-border px-2 py-12 md:py-20">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Issue · {new Date().getFullYear()}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <h1 className="mt-6 font-display text-5xl leading-[0.95] md:text-7xl">
          Unposed.
        </h1>
        <p className="mt-4 max-w-xl font-display text-lg italic text-muted-foreground md:text-xl">
          A quiet journal of wallpapers — unposed, unhurried, gently rendered for your screen.
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {statsQuery.data?.images ?? 0} entries · 4K · HD · Original
        </p>
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
