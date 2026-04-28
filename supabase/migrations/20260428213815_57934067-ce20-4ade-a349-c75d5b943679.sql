-- Lock down SECURITY DEFINER helpers; called only from inside other server-side code paths
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
-- claim_first_admin must be callable by signed-in users (one-time bootstrap)
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Restrict storage listing: replace public SELECT on wallpapers with admin-only listing
-- Public can still GET object URLs because the bucket is public, but cannot enumerate
DROP POLICY IF EXISTS "Public read wallpapers" ON storage.objects;
CREATE POLICY "Admin list wallpapers" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='wallpapers' AND public.is_admin());

-- Add an explicit policy to app_roles so 'no policy' info goes away (admins can manage roles)
CREATE POLICY "Admin insert roles" ON public.app_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin delete roles" ON public.app_roles FOR DELETE TO authenticated USING (public.is_admin());