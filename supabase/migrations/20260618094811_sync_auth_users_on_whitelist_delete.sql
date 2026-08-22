
-- When an email is removed from admin_whitelist, also delete
-- the corresponding Supabase auth user so no ghost accounts remain.
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_whitelist_remove()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE email = OLD.email;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_admin_whitelist_delete ON public.admin_whitelist;

CREATE TRIGGER on_admin_whitelist_delete
  AFTER DELETE ON public.admin_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_auth_user_on_whitelist_remove();
