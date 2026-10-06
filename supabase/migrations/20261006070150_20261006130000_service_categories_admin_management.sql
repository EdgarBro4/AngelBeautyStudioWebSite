/*
# Create service categories for admin management

1. New Table
- `service_categories` stores the category names shown in the admin panel and service menu.
- `id` is the category identifier.
- `name` is the unique category name.
- `created_at` records when the category was created.

2. Modified Table
- `services.type` is linked to `service_categories.name` so every service belongs to a real category.
- Existing service category values are preserved and inserted into the category table before the relationship is added.

3. Security
- RLS is enabled on `service_categories`.
- Anyone can read categories for public booking and the homepage.
- Only authorized administrators can create, rename, or delete categories.

4. Data Safety
- Existing categories and services are preserved.
- No services are deleted or moved.
*/

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_service_categories" ON service_categories;
CREATE POLICY "select_service_categories" ON service_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_service_categories" ON service_categories;
CREATE POLICY "insert_service_categories" ON service_categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_service_categories" ON service_categories;
CREATE POLICY "update_service_categories" ON service_categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_service_categories" ON service_categories;
CREATE POLICY "delete_service_categories" ON service_categories FOR DELETE TO authenticated USING (public.is_admin());

INSERT INTO service_categories (name)
SELECT DISTINCT type FROM services WHERE type IS NOT NULL
ON CONFLICT (name) DO NOTHING;

INSERT INTO service_categories (name)
VALUES
  ('Manicure'),
  ('Gel-X'),
  ('Pedicure'),
  ('Full Hair Services'),
  ('Barber Services'),
  ('Brows & Lashes'),
  ('Makeup Services')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_type_check;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_type_service_categories_name_fkey;
ALTER TABLE services ADD CONSTRAINT services_type_service_categories_name_fkey FOREIGN KEY (type) REFERENCES service_categories(name) ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS services_type_idx ON services(type);