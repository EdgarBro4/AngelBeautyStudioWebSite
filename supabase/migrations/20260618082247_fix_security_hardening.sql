
-- ── 1. Fix is_admin(): immutable search_path + SECURITY INVOKER ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── 2. otp_codes: add RLS policies ──
CREATE POLICY "otp_codes_deny_select" ON public.otp_codes
  FOR SELECT TO anon, authenticated USING (false);

CREATE POLICY "otp_codes_deny_insert" ON public.otp_codes
  FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "otp_codes_deny_update" ON public.otp_codes
  FOR UPDATE TO anon, authenticated USING (false);

CREATE POLICY "otp_codes_deny_delete" ON public.otp_codes
  FOR DELETE TO anon, authenticated USING (false);
