
-- Fix is_admin(): replace auth.users subquery with auth.email() so SECURITY INVOKER works.
-- auth.email() reads the JWT claim directly — no table access required.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE email = auth.email()
  );
$$;
