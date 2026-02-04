-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  author_email TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (only published posts)
CREATE POLICY "Anyone can read published blog posts"
ON public.blog_posts
FOR SELECT
USING (published = true);

-- Create policy for admin write access (based on email check via auth.jwt())
CREATE POLICY "Admin can manage all blog posts"
ON public.blog_posts
FOR ALL
USING (auth.jwt() ->> 'email' = 'michalzborowski@interia.pl')
WITH CHECK (auth.jwt() ->> 'email' = 'michalzborowski@interia.pl');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();