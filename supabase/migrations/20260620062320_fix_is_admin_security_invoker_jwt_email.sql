
-- Switch is_admin() to SECURITY INVOKER so it no longer triggers the
-- "authenticated can execute SECURITY DEFINER function" scanner warning.
-- admin_whitelist is readable by authenticated (USING true RLS policy), so
-- no elevated privileges are needed. lower() guards against case mismatches.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;
