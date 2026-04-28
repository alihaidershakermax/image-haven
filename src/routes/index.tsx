import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { listImages, listTags } from "@/server/images.functions";
import { GalleryGrid } from "@/components/gallery-grid";
import { Lightbox } from "@/components/lightbox";
import type { GalleryImage } from "@/types/image";

type SearchParams = {
  q: string;
  tag: string;
  range: "all" | "week" | "month" | "year";
};

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  tag: fallback(z.string(), "").default(""),
  range: fallback(z.enum(["all", "week", "month", "year"]), "all").default("all"),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Frame — A quiet image journal" },
      {
        name: "description",
        content:
          "Browse a curated photographic gallery, fed quietly through Telegram. Search by subject, filter by date, and download in one click.",
      },
      { property: "og:title", content: "Frame — A quiet image journal" },
      {
        property: "og:description",
        content: "A minimal, editorial gallery of photographs curated through Telegram.",
      },
    ],
  }),
  component: GalleryPage,
});

const PAGE_SIZE = 18;

function GalleryPage() {
  const { q, tag, range } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [searchInput, setSearchInput] = useState(q);
  const [open, setOpen] = useState<GalleryImage | null>(null);

  // Debounce search input -> URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== q) {
        navigate({ search: (prev: SearchParams) => ({ ...prev, q: searchInput }) });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => listTags(),
  });

  const imagesQuery = useInfiniteQuery({
    queryKey: ["images", { q, tag, range }],
    queryFn: ({ pageParam = 0 }) =>
      listImages({ data: { search: q, tag, range, page: pageParam, pageSize: PAGE_SIZE } }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasMore ? all.length : undefined),
  });

  const items = useMemo(
    () => (imagesQuery.data?.pages ?? []).flatMap((p) => p.items) as GalleryImage[],
    [imagesQuery.data],
  );
  const total = imagesQuery.data?.pages[0]?.total ?? 0;

  // Infinite scroll sentinel
  useEffect(() => {
    const el = document.getElementById("infinite-sentinel");
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && imagesQuery.hasNextPage && !imagesQuery.isFetchingNextPage) {
          imagesQuery.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [imagesQuery]);

  const setSearch = (patch: Partial<SearchParams>) =>
    navigate({ search: (prev: SearchParams) => ({ ...prev, ...patch }) as SearchParams });

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      {/* Hero */}
      <section className="border-b border-border py-12 md:py-20">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Issue · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          A quiet collection of <em className="italic text-accent">photographs</em>,
          <br className="hidden md:block" /> uploaded through Telegram.
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
          Send any image to the bot. It appears here, indexed by caption and hashtags. Click any frame to view full size or download.
        </p>
      </section>

      {/* Controls */}
      <section className="sticky top-[57px] z-20 -mx-4 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-md md:-mx-8 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title or description…"
              className="w-full rounded-full border border-border bg-card py-2 pl-10 pr-10 text-sm outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {(["all", "week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSearch({ range: r })}
                className={`rounded-full border px-3 py-1.5 uppercase tracking-wider transition-colors ${
                  range === r
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {r === "all" ? "All time" : `Past ${r}`}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        {(tagsQuery.data?.tags?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setSearch({ tag: "" })}
              className={`text-xs italic font-serif transition-colors ${
                !tag ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              all subjects
            </button>
            {tagsQuery.data?.tags.map((t) => (
              <button
                key={t}
                onClick={() => setSearch({ tag: tag === t ? "" : t })}
                className={`text-xs italic font-serif transition-colors ${
                  tag === t ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                · {t}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <p className="py-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {imagesQuery.isLoading ? "Loading…" : `${total} ${total === 1 ? "frame" : "frames"}`}
        {(q || tag || range !== "all") && " · filtered"}
      </p>

      {/* Grid */}
      {!imagesQuery.isLoading && items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-2xl italic text-muted-foreground">Nothing matches that.</p>
          <button
            onClick={() => navigate({ search: { q: "", tag: "", range: "all" } })}
            className="mt-4 text-sm underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
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