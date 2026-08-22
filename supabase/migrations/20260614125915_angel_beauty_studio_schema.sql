
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  rating numeric(3,2) DEFAULT 5.0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_workers" ON workers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_workers" ON workers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_workers" ON workers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_workers" ON workers FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Hair', 'Nails', 'Skincare', 'Other')),
  duration integer NOT NULL,
  price numeric(10,2) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_services" ON services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  service_id uuid REFERENCES services(id),
  worker_id uuid REFERENCES workers(id),
  date date NOT NULL,
  time text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_appointments" ON appointments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_appointments" ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_appointments" ON appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_appointments" ON appointments FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  customer_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_reviews" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_reviews" ON reviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_reviews" ON reviews FOR DELETE TO anon, authenticated USING (true);
