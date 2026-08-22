ALTER TABLE services DROP CONSTRAINT IF EXISTS services_type_check;
ALTER TABLE services ADD CONSTRAINT services_type_check CHECK (type IN ('Hair', 'Men''s', 'Makeup', 'Nails', 'Skincare', 'Other'));

ALTER TABLE workers ADD COLUMN IF NOT EXISTS specialty text CHECK (specialty IN ('Hair', 'Men''s', 'Makeup', 'Nails', 'Other'));
