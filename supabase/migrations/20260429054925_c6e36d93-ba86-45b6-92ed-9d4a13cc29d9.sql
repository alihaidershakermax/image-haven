
CREATE TABLE IF NOT EXISTS public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'Unposed',
  tagline text NOT NULL DEFAULT 'A quiet wallpaper journal',
  favicon_url text,
  logo_url text,
  privacy_policy text NOT NULL DEFAULT '',
  telegram_bot_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin insert site_settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.about_content (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  heading text NOT NULL DEFAULT 'About',
  body text NOT NULL DEFAULT 'A quiet collection of unposed moments, curated for your screen.',
  instagram_url text NOT NULL DEFAULT 'https://www.instagram.com/5.sag_',
  instagram_handle text NOT NULL DEFAULT '@5.sag_',
  photo_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.about_content (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read about_content" ON public.about_content FOR SELECT USING (true);
CREATE POLICY "Admin update about_content" ON public.about_content FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin insert about_content" ON public.about_content FOR INSERT TO authenticated WITH CHECK (public.is_admin());
