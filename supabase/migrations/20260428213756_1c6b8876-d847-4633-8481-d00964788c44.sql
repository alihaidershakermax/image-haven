-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.app_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin'::public.app_role) $$;

-- Allow admin claim to be bootstrapped only when no admin exists yet (one-time setup)
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE has_any boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT EXISTS(SELECT 1 FROM public.app_roles WHERE role='admin') INTO has_any;
  IF has_any THEN RETURN false; END IF;
  INSERT INTO public.app_roles(user_id, role) VALUES (auth.uid(), 'admin')
    ON CONFLICT DO NOTHING;
  RETURN true;
END $$;

CREATE POLICY "Admins read roles" ON public.app_roles FOR SELECT TO authenticated USING (public.is_admin());

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_admin());

-- Extend images
ALTER TABLE public.images
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS url_4k text,
  ADD COLUMN IF NOT EXISTS url_hd text,
  ADD COLUMN IF NOT EXISTS url_thumb text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS storage_path text;

CREATE UNIQUE INDEX IF NOT EXISTS images_slug_unique ON public.images(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS images_category_idx ON public.images(category_id);
CREATE INDEX IF NOT EXISTS images_published_taken_idx ON public.images(published, taken_at DESC);

-- Replace existing public read with published-only public read
DROP POLICY IF EXISTS "Public can view images" ON public.images;
CREATE POLICY "Public read published images" ON public.images FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY "Admin insert images" ON public.images FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin update images" ON public.images FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin delete images" ON public.images FOR DELETE TO authenticated USING (public.is_admin());

-- Download logs
CREATE TABLE public.download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  resolution text NOT NULL CHECK (resolution IN ('original','4k','hd','thumb')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX download_logs_image_idx ON public.download_logs(image_id);
CREATE POLICY "Public can log downloads" ON public.download_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read logs" ON public.download_logs FOR SELECT TO authenticated USING (public.is_admin());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallpapers','wallpapers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read wallpapers" ON storage.objects FOR SELECT USING (bucket_id = 'wallpapers');
CREATE POLICY "Admin upload wallpapers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='wallpapers' AND public.is_admin());
CREATE POLICY "Admin update wallpapers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='wallpapers' AND public.is_admin());
CREATE POLICY "Admin delete wallpapers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='wallpapers' AND public.is_admin());

-- Seed categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Abstract','abstract',1),
  ('Nature','nature',2),
  ('Minimal','minimal',3),
  ('Dark','dark',4),
  ('Cities','cities',5),
  ('Space','space',6)
ON CONFLICT (slug) DO NOTHING;