import { useState } from "react";
import type { GalleryImage } from "@/types/image";

export function GalleryGrid({
  items,
  onOpen,
}: {
  items: GalleryImage[];
  onOpen: (img: GalleryImage) => void;
}) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-4">
      {items.map((img, i) => (
        <GalleryCard key={img.id} image={img} onOpen={onOpen} priority={i < 4} />
      ))}
    </div>
  );
}

function GalleryCard({
  image,
  onOpen,
  priority,
}: {
  image: GalleryImage;
  onOpen: (img: GalleryImage) => void;
  priority: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const ratio = image.width && image.height ? image.height / image.width : 0.66;

  return (
    <button
      onClick={() => onOpen(image)}
      className="group block w-full break-inside-avoid overflow-hidden rounded-lg bg-muted text-left shadow-sm transition-all duration-300 hover:shadow-xl"
    >
      <div className="relative overflow-hidden" style={{ paddingBottom: `${ratio * 100}%` }}>
        <img
          src={image.thumbnail_url ?? image.url}
          alt={image.title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
            loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"
          }`}
        />
      </div>
      <div className="px-3 pb-3 pt-2">
        <p className="font-serif text-sm leading-tight text-card-foreground">{image.title}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {new Date(image.taken_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </button>
  );
}