-- Create storage bucket for worker gallery
INSERT INTO storage.buckets (id, name, public)
VALUES ('worker-gallery', 'worker-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for worker gallery
CREATE POLICY "Worker gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'worker-gallery');

CREATE POLICY "Users can upload their own gallery images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'worker-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own gallery images"
ON storage.objects FOR DELETE
USING (bucket_id = 'worker-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track worker gallery images
CREATE TABLE IF NOT EXISTS public.worker_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.worker_gallery ENABLE ROW LEVEL SECURITY;

-- Gallery is viewable by everyone
CREATE POLICY "Worker gallery is viewable by everyone"
ON public.worker_gallery FOR SELECT
USING (true);

-- Workers can manage their own gallery
CREATE POLICY "Workers can insert their own gallery images"
ON public.worker_gallery FOR INSERT
WITH CHECK (worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Workers can delete their own gallery images"
ON public.worker_gallery FOR DELETE
USING (worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));