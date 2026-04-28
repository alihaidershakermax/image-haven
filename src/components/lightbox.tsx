import { useEffect, useState } from "react";
import { Download, Eye, X, ChevronDown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { trackDownload, trackView } from "@/server/images.functions";
import type { GalleryImage } from "@/types/image";

type Res = "original" | "4k" | "hd" | "thumb";

export function Lightbox({ image, onClose }: { image: GalleryImage | null; onClose: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const viewMut = useMutation({ mutationFn: (id: string) => trackView({ data: { id } }) });
  const dlMut = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: Res }) =>
      trackDownload({ data: { id, resolution } }),
  });

  useEffect(() => {
    if (!image) return;
    viewMut.mutate(image.id);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  if (!image) return null;

  const resolutions: { key: Res; label: string; url: string | null; sub?: string }[] = [
    { key: "original", label: "Original", url: image.url, sub: image.width && image.height ? `${image.width}×${image.height}` : "Full quality" },
    { key: "4k", label: "4K", url: image.url_4k, sub: "2160px wide" },
    { key: "hd", label: "HD", url: image.url_hd, sub: "1080px wide" },
    { key: "thumb", label: "Small", url: image.url_thumb, sub: "480px wide" },
  ];

  const handleDownload = async (resolution: Res, url: string) => {
    setMenuOpen(false);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      const safeName = image.title.replace(/[^\w-]+/g, "_");
      a.download = `${safeName}_${resolution}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(obj);
      dlMut.mutate({ id: image.id, resolution });
      toast.success(`Downloaded · ${resolution.toUpperCase()}`);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-1 items-center justify-center bg-black">
          <img
            src={image.url_hd ?? image.url}
            alt={image.title}
            className="max-h-[55vh] w-auto max-w-full object-contain md:max-h-[95vh]"
          />
        </div>

        <aside className="w-full shrink-0 border-t border-border bg-card p-5 md:w-80 md:border-l md:border-t-0 md:p-6">
          <h2 className="font-display text-xl font-semibold leading-tight">{image.title}</h2>
          {image.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{image.description}</p>
          )}

          {image.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {image.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {image.view_count + 1}</span>
            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {image.download_count}</span>
            {image.width && image.height && <span>{image.width}×{image.height}</span>}
          </div>

          {/* Download resolution menu */}
          <div className="relative mt-5">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-hero px-4 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-4 w-4" /> Download <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
                {resolutions.map((r) =>
                  r.url ? (
                    <button
                      key={r.key}
                      onClick={() => handleDownload(r.key, r.url!)}
                      className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-muted"
                    >
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.sub}</span>
                    </button>
                  ) : null,
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
