import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram } from "lucide-react";
import { getAbout } from "@/functions/settings.functions";

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
  const photo = a?.photo_url;
  const handle = a?.instagram_handle ?? "@5.sag_";
  const url = a?.instagram_url ?? "https://www.instagram.com/5.sag_";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20 animate-fade-in">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {/* Profile block — photo + handle prominent at top */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-accent/30 to-transparent blur-2xl" />
              {photo ? (
                <img
                  src={photo}
                  alt={handle}
                  className="h-40 w-40 rounded-full border-4 border-background object-cover shadow-glow md:h-52 md:w-52"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-background bg-muted text-4xl font-display text-muted-foreground shadow-glow md:h-52 md:w-52">
                  {handle.replace("@", "").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="mt-6 font-display text-4xl leading-[0.95] md:text-6xl">{a?.heading ?? "About"}</h1>

            <a
              href={url} target="_blank" rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm transition-all hover:scale-[1.03] hover:bg-muted hover:shadow-soft"
            >
              <Instagram className="h-4 w-4" />
              <span className="font-medium">{handle}</span>
            </a>
          </div>

          {/* Body text */}
          {a?.body && (
            <div className="mx-auto mt-12 max-w-2xl whitespace-pre-wrap text-center font-display text-lg leading-relaxed text-muted-foreground md:text-xl">
              {a.body}
            </div>
          )}
        </>
      )}
    </div>
  );
}
