
-- Drop both broad SELECT policies — public-bucket objects are served via CDN
-- and don't require RLS SELECT grants. Removing these prevents clients from
-- listing all files in the bucket via the Storage API.
DROP POLICY IF EXISTS "public_read_workerspics" ON storage.objects;
DROP POLICY IF EXISTS "storage_public_read"     ON storage.objects;

-- Remove duplicate INSERT/DELETE policies left from earlier migrations.
-- Keep the *_workerspics variants as the canonical ones.
DROP POLICY IF EXISTS "storage_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;
