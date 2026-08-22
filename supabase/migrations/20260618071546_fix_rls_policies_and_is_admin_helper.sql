-- ─── Helper: is_admin() ───────────────────────────────────────────────────────
-- Checks whether the currently authenticated user's email is on the admin
-- whitelist. SECURITY DEFINER so it bypasses RLS on the whitelist table itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
$$;

-- ─── admin_whitelist ──────────────────────────────────────────────────────────
-- SELECT stays as-is (authenticated users need to read it to check their own access).
-- INSERT / DELETE: only whitelisted admins may manage the list.
DROP POLICY IF EXISTS "insert_whitelist" ON admin_whitelist;
DROP POLICY IF EXISTS "delete_whitelist" ON admin_whitelist;

CREATE POLICY "insert_whitelist" ON admin_whitelist FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "delete_whitelist" ON admin_whitelist FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── workers ─────────────────────────────────────────────────────────────────
-- Public can read. Only admins may create / modify / remove workers.
DROP POLICY IF EXISTS "insert_workers" ON workers;
DROP POLICY IF EXISTS "update_workers" ON workers;
DROP POLICY IF EXISTS "delete_workers" ON workers;

CREATE POLICY "insert_workers" ON workers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "update_workers" ON workers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "delete_workers" ON workers FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── services ─────────────────────────────────────────────────────────────────
-- Public can read. Only admins may create / modify / remove services.
DROP POLICY IF EXISTS "insert_services" ON services;
DROP POLICY IF EXISTS "update_services" ON services;
DROP POLICY IF EXISTS "delete_services" ON services;

CREATE POLICY "insert_services" ON services FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "update_services" ON services FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "delete_services" ON services FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── appointments ─────────────────────────────────────────────────────────────
-- Unauthenticated customers may INSERT (book), validated by required fields.
-- Only admins may UPDATE (change status) or DELETE (cancel / purge).
DROP POLICY IF EXISTS "insert_appointments" ON appointments;
DROP POLICY IF EXISTS "update_appointments" ON appointments;
DROP POLICY IF EXISTS "delete_appointments" ON appointments;

CREATE POLICY "insert_appointments" ON appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    customer_name IS NOT NULL AND char_length(trim(customer_name)) >= 2 AND
    phone IS NOT NULL AND char_length(trim(phone)) >= 3 AND
    date IS NOT NULL AND
    time IS NOT NULL AND
    worker_id IS NOT NULL AND
    service_id IS NOT NULL
  );

CREATE POLICY "update_appointments" ON appointments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "delete_appointments" ON appointments FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── reviews ─────────────────────────────────────────────────────────────────
-- Unauthenticated customers may INSERT (leave a review), validated by rating
-- range, non-empty name, and a valid worker reference.
-- Reviews are immutable — drop the UPDATE policy entirely.
-- Only admins may DELETE reviews.
DROP POLICY IF EXISTS "insert_reviews" ON reviews;
DROP POLICY IF EXISTS "update_reviews" ON reviews;
DROP POLICY IF EXISTS "delete_reviews" ON reviews;

CREATE POLICY "insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    customer_name IS NOT NULL AND char_length(trim(customer_name)) >= 2 AND
    rating BETWEEN 1 AND 5 AND
    worker_id IS NOT NULL
  );

-- No UPDATE policy: reviews cannot be edited after submission.

CREATE POLICY "delete_reviews" ON reviews FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── blocked_keywords (if it exists) ─────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'blocked_keywords'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "insert_keywords" ON blocked_keywords';
    EXECUTE 'DROP POLICY IF EXISTS "delete_keywords" ON blocked_keywords';

    EXECUTE '
      CREATE POLICY "insert_keywords" ON blocked_keywords FOR INSERT
        TO authenticated
        WITH CHECK (is_admin())
    ';

    EXECUTE '
      CREATE POLICY "delete_keywords" ON blocked_keywords FOR DELETE
        TO authenticated
        USING (is_admin())
    ';
  END IF;
END $$;
