-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- Allow public read access to blog images
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- Allow admin to upload blog images
CREATE POLICY "Admin can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND auth.jwt() ->> 'email' = 'michalzborowski@interia.pl');

-- Allow admin to update blog images
CREATE POLICY "Admin can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images' AND auth.jwt() ->> 'email' = 'michalzborowski@interia.pl');

-- Allow admin to delete blog images
CREATE POLICY "Admin can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND auth.jwt() ->> 'email' = 'michalzborowski@interia.pl');