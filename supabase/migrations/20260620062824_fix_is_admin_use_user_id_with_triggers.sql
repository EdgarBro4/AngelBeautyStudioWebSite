
-- Add user_id to admin_whitelist so is_admin() can check auth.uid() directly,
-- eliminating all JWT email claim reliability issues.

ALTER TABLE public.admin_whitelist
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill existing whitelist entries with matching auth user UUIDs.
UPDATE public.admin_whitelist w
SET user_id = u.id
FROM auth.users u
WHERE lower(u.email) = lower(w.email)
  AND w.user_id IS NULL;

-- Trigger: when a new auth user is created or their email changes,
-- auto-link them to a matching whitelist entry.
CREATE OR REPLACE FUNCTION public.link_admin_whitelist_on_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.admin_whitelist
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_admin_whitelist_on_auth_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_upsert_link_admin ON auth.users;
CREATE TRIGGER on_auth_user_upsert_link_admin
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_admin_whitelist_on_auth_user();

-- Trigger: when a new email is inserted into admin_whitelist,
-- try to immediately link a matching auth user if one already exists.
CREATE OR REPLACE FUNCTION public.link_whitelist_entry_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  SELECT id INTO NEW.user_id
  FROM auth.users
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_whitelist_entry_on_insert() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_whitelist_insert_link_user ON public.admin_whitelist;
CREATE TRIGGER on_whitelist_insert_link_user
  BEFORE INSERT ON public.admin_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.link_whitelist_entry_on_insert();

-- Rewrite is_admin() to use user_id = auth.uid() as the primary check.
-- Falls back to JWT email comparison for entries not yet linked (e.g. first login
-- before the auth trigger has fired in this same transaction, which shouldn't happen
-- but is a safe belt-and-suspenders fallback).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE user_id = auth.uid()
       OR (user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  );
$$;
