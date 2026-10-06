/*
# Add updated Beauty Angel Studio service menu and worker assignments

1. New Tables
- worker_categories stores the categories each worker can perform.
- worker_service_assignments stores service-specific overrides for exclusions and extra services.

2. Modified Data
- Adds the complete service menu from the provided PDF without deleting existing records.

3. Security
- Enables RLS and adds separate CRUD policies for both assignment tables.
*/

CREATE TABLE IF NOT EXISTS worker_categories (
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (worker_id, category)
);

ALTER TABLE worker_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_worker_categories" ON worker_categories;
CREATE POLICY "select_worker_categories" ON worker_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_worker_categories" ON worker_categories;
CREATE POLICY "insert_worker_categories" ON worker_categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_worker_categories" ON worker_categories;
CREATE POLICY "update_worker_categories" ON worker_categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_worker_categories" ON worker_categories;
CREATE POLICY "delete_worker_categories" ON worker_categories FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS worker_service_assignments (
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (worker_id, service_id)
);

ALTER TABLE worker_service_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_worker_service_assignments" ON worker_service_assignments;
CREATE POLICY "select_worker_service_assignments" ON worker_service_assignments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_worker_service_assignments" ON worker_service_assignments;
CREATE POLICY "insert_worker_service_assignments" ON worker_service_assignments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "update_worker_service_assignments" ON worker_service_assignments;
CREATE POLICY "update_worker_service_assignments" ON worker_service_assignments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "delete_worker_service_assignments" ON worker_service_assignments;
CREATE POLICY "delete_worker_service_assignments" ON worker_service_assignments FOR DELETE TO authenticated USING (public.is_admin());

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_type_check;
ALTER TABLE services ADD CONSTRAINT services_type_check CHECK (type IN ('Manicure', 'Gel-X', 'Pedicure', 'Full Hair Services', 'Barber Services', 'Brows & Lashes', 'Makeup Services', 'Hair', 'Men''s', 'Makeup', 'Nails', 'Skincare', 'Other'));

INSERT INTO services (name, type, duration, price, description)
SELECT seed.name, seed.type, seed.duration, seed.price, seed.description
FROM (VALUES
  ('Regular Manicure', 'Manicure', 30, 40, 'A clean and relaxing manicure with detailed cuticle care, nail shaping, gentle buffing, and a relaxing hand massage. No polish included.'),
  ('Regular Manicure with Gel Removal', 'Manicure', 30, 45, 'Nail cleaning and shaping with gel removal.'),
  ('Regular Manicure with Nail Polish', 'Manicure', 40, 50, 'Nail cleaning, shaping, and regular nail polish.'),
  ('Russian Gel Manicure', 'Manicure', 60, 60, 'Gel manicure for short nails.'),
  ('Gel Manicure', 'Manicure', 90, 70, 'Gel manicure for medium-length nails.'),
  ('Gel Manicure with Extra Strength', 'Manicure', 90, 80, 'Gel manicure with additional strength for long nails.'),
  ('French Design', 'Manicure', 30, 15, 'French tips added to your manicure.'),
  ('Nail Design', 'Manicure', 60, 10, 'Price depends on the design.'),
  ('Nail Repair', 'Manicure', 30, 10, 'Repair for a broken or damaged nail.'),
  ('Gel-X Extensions', 'Gel-X', 90, 80, 'Full-cover gel extensions with gel polish.'),
  ('Russian Gel Pedicure', 'Pedicure', 60, 70, 'Russian pedicure with gel polish.'),
  ('Regular Pedicure', 'Pedicure', 40, 50, 'Pedicure without nail polish.'),
  ('Regular Pedicure with Nail Polish', 'Pedicure', 60, 60, 'Regular pedicure with regular nail polish.'),
  ('Very Short Haircut + Blow Dry', 'Full Hair Services', 40, 40, 'Haircut with shampoo and blow-dry.'),
  ('Medium Haircut + Blow Dry', 'Full Hair Services', 45, 50, 'Haircut with shampoo and blow-dry.'),
  ('Long Haircut + Blow Dry', 'Full Hair Services', 60, 60, 'Haircut with shampoo and blow-dry. Appointment time may vary depending on hair length, thickness, and desired style.'),
  ('Bang Trim', 'Full Hair Services', 20, 20, 'Bang trim and shaping.'),
  ('Very Short Blow Dry', 'Full Hair Services', 30, 40, 'Shampoo and professional blow-dry.'),
  ('Medium Blow Dry', 'Full Hair Services', 45, 50, 'Shampoo and professional blow-dry.'),
  ('Long Blow Dry', 'Full Hair Services', 60, 60, 'Shampoo and professional blow-dry. Time may vary depending on hair length, thickness, and desired style.'),
  ('Curls or Waves', 'Full Hair Services', 60, 70, 'Professional styling with curls or waves.'),
  ('Updo or Special Occasion Style', 'Full Hair Services', 90, 80, 'Elegant styling for weddings, parties, and special occasions. Price and timing may vary depending on the complexity of the style.'),
  ('Root Touch-Up', 'Full Hair Services', 90, 70, 'Color application to cover gray or refresh regrowth.'),
  ('All-Over Color', 'Full Hair Services', 120, 90, 'Single-process color from roots to ends.'),
  ('Partial Highlights', 'Full Hair Services', 150, 180, 'Highlights applied to selected sections of the hair.'),
  ('Full Highlights', 'Full Hair Services', 240, 300, 'Highlights throughout the hair for a brighter, dimensional look.'),
  ('Balayage', 'Full Hair Services', 240, 350, 'Hand-painted highlights for a soft, natural-looking blend.'),
  ('Color Correction', 'Full Hair Services', 60, 0, 'Consultation required. Corrective color service for unwanted tones, uneven color, or previous color treatments. Pricing varies.'),
  ('Deep Conditioning Treatment', 'Full Hair Services', 45, 35, 'Intensive moisture treatment for dry or damaged hair.'),
  ('Keratin or Smoothing Treatment', 'Full Hair Services', 240, 300, 'Smoothing treatment to reduce frizz and improve manageability. Consultation required.'),
  ('Scalp Treatment', 'Full Hair Services', 45, 40, 'Cleansing and nourishing treatment for a refreshed, healthy scalp.'),
  ('Bridal Trial', 'Full Hair Services', 120, 200, 'Trial appointment to create and finalize your wedding hairstyle.'),
  ('Bridal Hairstyling', 'Full Hair Services', 90, 150, 'Professional wedding-day hairstyling. Final pricing depends on the style and hair length.'),
  ('Bridal Party Hairstyling', 'Full Hair Services', 60, 100, 'Hairstyling for bridesmaids and wedding guests. Pricing and timing may vary by style. Price is per person.'),
  ('Regular Haircut', 'Barber Services', 45, 40, 'Includes hair wash, haircut, styling, and finishing.'),
  ('Kids Haircut', 'Barber Services', 45, 40, 'Includes hair wash, haircut, and styling.'),
  ('Fade', 'Barber Services', 60, 50, 'Includes hair wash, fade haircut, styling, and finishing.'),
  ('Beard Trim', 'Barber Services', 30, 20, 'Includes beard shaping, trimming, and finishing.'),
  ('Line Up / Edge Up', 'Barber Services', 20, 20, 'Includes clean-up and sharp detailing around the hairline and beard.'),
  ('Haircut + Blow Dry', 'Barber Services', 60, 50, 'Includes hair wash, haircut, blow-dry, and styling.'),
  ('Ear & Nose Waxing', 'Barber Services', 30, 20, 'Includes ear and nose waxing.'),
  ('Haircut + Beard + Ear & Nose Waxing', 'Barber Services', 60, 60, 'Includes hair wash, haircut, beard trim, ear and nose waxing, and styling.'),
  ('Brow Waxing', 'Brows & Lashes', 20, 30, 'Professional brow shaping using gentle waxing techniques.'),
  ('Brow Tweezing', 'Brows & Lashes', 30, 30, 'Detailed brow shaping using tweezing for precise results.'),
  ('Brow Threading', 'Brows & Lashes', 20, 30, 'Precise brow shaping using traditional threading techniques.'),
  ('Full Face Waxing', 'Brows & Lashes', 30, 50, 'Professional full-face waxing.'),
  ('Upper Lip Threading', 'Brows & Lashes', 15, 10, 'Precise upper-lip threading.'),
  ('Brow Tint', 'Brows & Lashes', 30, 30, 'Semi-permanent tint to enhance the color and definition of your brows.'),
  ('Brow Lamination', 'Brows & Lashes', 60, 100, 'Treatment that smooths and lifts the brow hairs for a fuller, more defined appearance.'),
  ('Brow Lamination with Tint', 'Brows & Lashes', 75, 120, 'Brow lamination combined with tinting for enhanced shape, color, and definition.'),
  ('Lash Lamination', 'Brows & Lashes', 70, 100, 'Lash lifting and setting treatment for a polished, defined look.'),
  ('Lash Lamination with Tint', 'Brows & Lashes', 120, 120, 'Lash lamination combined with tinting for enhanced definition.'),
  ('Natural Makeup', 'Makeup Services', 60, 100, 'Soft, polished makeup for an effortlessly elegant look.'),
  ('Full Glam Makeup', 'Makeup Services', 90, 120, 'Complete makeup application with enhanced eyes, complexion, and contouring.'),
  ('Special Occasion Makeup', 'Makeup Services', 90, 125, 'Long-lasting makeup for parties, celebrations, photoshoots, and special events.'),
  ('Bridal Makeup Trial', 'Makeup Services', 90, 125, 'Trial appointment to create and finalize your wedding makeup look.'),
  ('Bridal Makeup', 'Makeup Services', 90, 175, 'Professional wedding-day makeup application. Final pricing may vary depending on the desired look and additional services.'),
  ('Bridal Party Makeup', 'Makeup Services', 75, 125, 'Makeup application for bridesmaids and wedding guests. Pricing and timing may vary by look. Price is per person.')
) AS seed(name, type, duration, price, description)
WHERE NOT EXISTS (SELECT 1 FROM services existing WHERE existing.name = seed.name AND existing.type = seed.type);