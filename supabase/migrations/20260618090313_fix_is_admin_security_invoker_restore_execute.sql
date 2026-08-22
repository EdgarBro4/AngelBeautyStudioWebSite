
-- Switch is_admin() from SECURITY DEFINER to SECURITY INVOKER.
-- Uses auth.jwt() to read the email claim from the current JWT — no access
-- to auth.users is needed, so elevated privileges are not required.
-- This eliminates the SECURITY DEFINER RPC exposure warning while keeping
-- the function callable from RLS policies on authenticated users.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- RLS policies on admin_whitelist / appointments / workers / services call
-- is_admin() — the authenticated role must be able to execute it.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- anon has no JWT email so the function always returns false for them;
-- granting execute is harmless and avoids any edge-case policy breakage.
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
