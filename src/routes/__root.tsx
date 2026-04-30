import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/functions/settings.functions";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Unposed — A Quiet Wallpaper Journal" },
      { name: "description", content: "An editorial collection of unposed moments and quiet wallpapers in 4K, HD and original quality. Free, curated, and beautifully organized." },
      { name: "author", content: "Unposed" },
      { property: "og:title", content: "Unposed — Editorial Wallpapers" },
      { property: "og:description", content: "A quiet, editorial collection of wallpapers in 4K and HD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#13110f" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DynamicHead />
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1 pb-24 md:pb-0">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function DynamicHead() {
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings(), staleTime: 60_000 });
  const s = data?.settings;
  useEffect(() => {
    if (typeof document === "undefined" || !s) return;
    if (s.site_name) document.title = `${s.site_name}${s.tagline ? " — " + s.tagline : ""}`;
    if (s.favicon_url) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = s.favicon_url;
    }
  }, [s]);
  return null;
}

function SiteFooter() {
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings(), staleTime: 60_000 });
  const name = data?.settings?.site_name ?? "Unposed";
  const tagline = data?.settings?.tagline ?? "a quiet wallpaper journal";
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      <p><span className="font-display">{name}</span> · {tagline} · {new Date().getFullYear()}</p>
    </footer>
  );
}
