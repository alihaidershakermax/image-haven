import { useState } from "react";
import { Eye, Download } from "lucide-react";
import type { GalleryImage } from "@/types/image";

export function GalleryGrid({
  items,
  onOpen,
}: {
  items: GalleryImage[];
  onOpen: (img: GalleryImage) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((img, i) => (
        <WallpaperCard key={img.id} image={img} onOpen={onOpen} priority={i < 6} />
      ))}
    </div>
  );
}

function WallpaperCard({
  image,
  onOpen,
  priority,
}: {
  image: GalleryImage;
  onOpen: (img: GalleryImage) => void;
  priority: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      onClick={() => onOpen(image)}
      className="group relative block w-full overflow-hidden rounded-2xl bg-muted text-left shadow-soft transition-all duration-300 hover:shadow-glow active:scale-[0.98]"
      style={{ aspectRatio: "9 / 16" }}
    >
      <img
        src={image.url_thumb ?? image.thumbnail_url ?? image.url}
        alt={image.title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="line-clamp-1 text-sm font-medium">{image.title}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-white/80">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{image.view_count}</span>
          <span className="flex items-center gap-1"><Download className="h-3 w-3" />{image.download_count}</span>
        </div>
      </div>
    </button>
  );
}
