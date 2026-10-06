/*
# Backfill worker categories from legacy specialties

1. Data Update
- Creates new category assignments for existing workers based on their legacy specialty values.
- Hair maps to Full Hair Services.
- Men's maps to Barber Services.
- Makeup maps to Makeup Services.
- Nails maps to Manicure, Gel-X, and Pedicure.

2. Safety
- Adds only missing category rows.
- Does not delete or modify workers, specialties, services, or appointments.
*/

INSERT INTO worker_categories (worker_id, category)
SELECT w.id, mapping.category
FROM workers w
CROSS JOIN LATERAL (
  VALUES
    ('Full Hair Services', 'Hair'),
    ('Barber Services', 'Men''s'),
    ('Makeup Services', 'Makeup'),
    ('Manicure', 'Nails'),
    ('Gel-X', 'Nails'),
    ('Pedicure', 'Nails')
) AS mapping(category, legacy_specialty)
WHERE w.specialty = mapping.legacy_specialty
ON CONFLICT (worker_id, category) DO NOTHING;