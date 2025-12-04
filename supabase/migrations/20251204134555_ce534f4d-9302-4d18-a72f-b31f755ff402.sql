-- Extend profiles table for subscription and premium features
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_plan text CHECK (subscription_plan IN ('basic', 'pro', 'boost')),
ADD COLUMN IF NOT EXISTS subscription_period_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS remaining_listings integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_highlights integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trusted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS extended_description text;

-- Extend jobs table for premium features
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS is_highlighted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_promoted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_expires_at timestamp with time zone;

-- Create payments table for tracking all payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_id text,
  stripe_session_id text,
  type text NOT NULL CHECK (type IN ('single', 'highlight', 'promote', 'urgent', 'promote_24h', 'subscription')),
  amount numeric NOT NULL,
  currency text DEFAULT 'pln',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create job_views table for statistics
CREATE TABLE IF NOT EXISTS public.job_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on job_views
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views
CREATE POLICY "Anyone can insert job views"
ON public.job_views
FOR INSERT
WITH CHECK (true);

-- Job owners can view their job statistics
CREATE POLICY "Job owners can view job stats"
ON public.job_views
FOR SELECT
USING (job_id IN (SELECT id FROM jobs WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- Create index for faster job views queries
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON public.job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON public.job_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- Create storage bucket for logos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for logos
CREATE POLICY "Logo images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their own logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);