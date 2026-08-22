
-- Revoke direct RPC execution of the trigger-only function from all roles
REVOKE EXECUTE ON FUNCTION public.delete_auth_user_on_whitelist_remove() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_auth_user_on_whitelist_remove() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_auth_user_on_whitelist_remove() FROM authenticated;
