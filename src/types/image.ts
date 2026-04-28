export interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  url_4k: string | null;
  url_hd: string | null;
  url_thumb: string | null;
  tags: string[];
  source: string;
  width: number | null;
  height: number | null;
  view_count: number;
  download_count: number;
  taken_at: string;
  created_at: string;
  category_id?: string | null;
  slug?: string | null;
  file_size_bytes?: number | null;
  published?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}