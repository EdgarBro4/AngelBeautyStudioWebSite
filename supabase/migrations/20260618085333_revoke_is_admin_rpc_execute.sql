
-- Revoke RPC-callable EXECUTE on is_admin() from anon and authenticated roles.
-- RLS policies invoke this function as the table owner (postgres), so they
-- do not require EXECUTE permission on the calling user — revoking here only
-- prevents direct /rest/v1/rpc/is_admin calls from those roles.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
