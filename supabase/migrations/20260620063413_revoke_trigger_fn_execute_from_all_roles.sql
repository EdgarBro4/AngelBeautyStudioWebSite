
-- Explicitly revoke EXECUTE from anon, authenticated, and PUBLIC on both
-- trigger helper functions. These are internal trigger functions and must
-- never be callable via the REST API.

REVOKE EXECUTE ON FUNCTION public.link_admin_whitelist_on_auth_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_whitelist_entry_on_insert() FROM anon, authenticated, PUBLIC;
