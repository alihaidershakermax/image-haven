import { useEffect } from "react";
import { Download, Eye, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { trackDownload, trackView } from "@/server/images.functions";
import type { GalleryImage } from "@/types/image";

export function Lightbox({ image, onClose }: { image: GalleryImage | null; onClose: () => void }) {
  const viewMut = useMutation({ mutationFn: (id: string) => trackView({ data: { id } }) });
  const downloadMut = useMutation({ mutationFn: (id: string) => trackDownload({ data: { id } }) });

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

  const handleDownload = async () => {
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${image.title.replace(/[^\w-]+/g, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      downloadMut.mutate(image.id);
      toast.success("Downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 rounded-full border border-border bg-background/80 p-2 text-foreground hover:bg-muted"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-1 items-center justify-center bg-muted">
          <img
            src={image.url}
            alt={image.title}
            className="max-h-[60vh] w-full object-contain md:max-h-[92vh]"
          />
        </div>

        <aside className="w-full shrink-0 border-t border-border p-6 md:w-80 md:border-l md:border-t-0">
          <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {new Date(image.taken_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <h2 className="mt-2 font-serif text-2xl leading-tight">{image.title}</h2>
          {image.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{image.description}</p>
          )}

          {image.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {image.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="my-6 h-px bg-border" />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {image.view_count + 1}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> {image.download_count}
            </span>
          </div>

          <button
            onClick={handleDownload}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Download original
          </button>
        </aside>
      </div>
    </div>
  );
}