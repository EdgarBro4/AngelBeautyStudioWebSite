
-- Add phone number to workers
ALTER TABLE workers ADD COLUMN IF NOT EXISTS phone text;

-- Studio-wide settings (single row, id always = 1)
CREATE TABLE IF NOT EXISTS studio_settings (
  id integer PRIMARY KEY DEFAULT 1,
  admin_phone text,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE studio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_studio_settings" ON studio_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_studio_settings" ON studio_settings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_studio_settings" ON studio_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed the single row so upsert always works
INSERT INTO studio_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
