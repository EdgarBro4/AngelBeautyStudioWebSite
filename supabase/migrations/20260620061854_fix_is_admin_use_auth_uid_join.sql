
-- Fix is_admin() to use auth.uid() -> auth.users -> admin_whitelist join
-- instead of relying on auth.jwt() email claim which is unreliable in some flows.
-- SECURITY DEFINER is required to read auth.users; the empty search_path prevents
-- search_path hijacking. EXECUTE is revoked from anon; authenticated keeps it for RLS policies.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_whitelist w
    JOIN auth.users u ON lower(u.email) = lower(w.email)
    WHERE u.id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
