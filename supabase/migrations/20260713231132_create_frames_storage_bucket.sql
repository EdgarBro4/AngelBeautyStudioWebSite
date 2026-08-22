/*
# Create public frames storage bucket

Creates a public Supabase Storage bucket called "frames" to host the scroll
video frame images (frame_0001.png through frame_0240.png).

1. New storage bucket: `frames`
   - Public read access (no auth required to view images)
   - Allows image file uploads by authenticated users (admin only in practice)

2. Security
   - Public SELECT so the anon-key frontend can fetch frame URLs
   - No INSERT/UPDATE/DELETE exposed to anon users
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'frames',
  'frames',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "frames_public_select" ON storage.objects;
CREATE POLICY "frames_public_select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'frames');
