
-- Tighten studio_settings RLS: only admins can INSERT or UPDATE
DROP POLICY IF EXISTS "insert_studio_settings" ON public.studio_settings;
DROP POLICY IF EXISTS "update_studio_settings" ON public.studio_settings;

CREATE POLICY "insert_studio_settings" ON public.studio_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "update_studio_settings" ON public.studio_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
