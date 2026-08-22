
-- Restore SECURITY DEFINER (required for self-referential RLS on admin_whitelist
-- and to read auth.users). Fix the mutable search_path security warning by
-- setting an explicit empty search_path and using fully-qualified names.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
$$;
