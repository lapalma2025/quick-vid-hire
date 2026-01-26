-- Add cv_url column to job_responses table for storing CV PDF links
ALTER TABLE public.job_responses ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Create storage bucket for CV files
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-files', 'cv-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cv-files bucket
-- Allow authenticated users to upload their own CV files
CREATE POLICY "Users can upload their own CV files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cv-files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own CV files
CREATE POLICY "Users can read their own CV files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cv-files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow job owners to read CV files attached to their job responses
CREATE POLICY "Job owners can read CV files from applicants"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cv-files' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.job_responses jr
    JOIN public.jobs j ON jr.job_id = j.id
    JOIN public.profiles p ON j.user_id = p.id
    WHERE jr.cv_url LIKE '%' || name || '%'
    AND p.user_id = auth.uid()
  )
);

-- Allow users to delete their own CV files
CREATE POLICY "Users can delete their own CV files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cv-files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);