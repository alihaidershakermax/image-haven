import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram } from "lucide-react";
import { getAbout } from "@/server/settings.functions";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Unposed" },
      { name: "description", content: "About the Unposed wallpaper journal." },
      { property: "og:title", content: "About — Unposed" },
      { property: "og:description", content: "About the Unposed wallpaper journal." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data, isLoading } = useQuery({ queryKey: ["about"], queryFn: () => getAbout() });
  const a = data?.about;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24 animate-fade-in">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {a?.photo_url && (
            <img src={a.photo_url} alt="" className="mb-10 aspect-[4/3] w-full rounded-lg object-cover shadow-soft" />
          )}
          <h1 className="font-display text-5xl leading-[0.95] md:text-7xl">{a?.heading ?? "About"}</h1>
          <div className="mt-8 whitespace-pre-wrap font-display text-lg leading-relaxed text-muted-foreground md:text-xl">
            {a?.body}
          </div>
          <a
            href={a?.instagram_url ?? "https://www.instagram.com/5.sag_"}
            target="_blank" rel="noreferrer"
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm transition-all hover:scale-[1.02] hover:bg-muted"
          >
            <Instagram className="h-4 w-4" />
            <span>{a?.instagram_handle ?? "@5.sag_"}</span>
          </a>
        </>
      )}
    </div>
  );
}
