-- Make cv-files bucket public for easier access
UPDATE storage.buckets SET public = true WHERE id = 'cv-files';

-- Drop the complex policy that doesn't work well with signed URLs
DROP POLICY IF EXISTS "Job owners can read CV files from applicants" ON storage.objects;