
-- WorkersPics was a private bucket; getPublicUrl() returns 403 for private buckets.
-- Worker photos are intentionally public-facing, so mark the bucket public.
UPDATE storage.buckets SET public = true WHERE id = 'WorkersPics';
