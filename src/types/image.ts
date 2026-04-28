export interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  tags: string[];
  source: string;
  width: number | null;
  height: number | null;
  view_count: number;
  download_count: number;
  taken_at: string;
  created_at: string;
}