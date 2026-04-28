import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Frame" },
      {
        name: "description",
        content:
          "Frame is a quiet image journal. Photographs sent to a Telegram bot appear here automatically, indexed and searchable.",
      },
      { property: "og:title", content: "About — Frame" },
      {
        property: "og:description",
        content: "How Frame turns Telegram messages into a public, browsable photo journal.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 md:px-8 md:py-24">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground">Colophon</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-5xl">
        How Frame works
      </h1>

      <div className="prose prose-neutral mt-10 max-w-none space-y-6 text-base leading-relaxed text-foreground/90">
        <p>
          <span className="font-serif italic">Frame</span> is a public photo journal. Anyone with
          access to the connected Telegram bot can post a photograph; it appears here moments later,
          indexed by its caption and hashtags.
        </p>
        <p>
          The interface is deliberately quiet. A masonry grid, a single accent colour, two
          typefaces. Each photograph opens into a generous lightbox where you can read its caption
          and download the original file.
        </p>
        <h2 className="font-serif text-2xl">Submitting an image</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Send a photograph to the connected Telegram bot.</li>
          <li>The first line of the caption becomes the title.</li>
          <li>Any <code className="font-mono text-sm">#hashtags</code> become tags.</li>
          <li>The image appears in the gallery within roughly a minute.</li>
        </ol>
        <h2 className="font-serif text-2xl">Privacy</h2>
        <p>
          The gallery is public. Don't post anything you wouldn't want strangers to download.
        </p>
      </div>
    </article>
  );
}