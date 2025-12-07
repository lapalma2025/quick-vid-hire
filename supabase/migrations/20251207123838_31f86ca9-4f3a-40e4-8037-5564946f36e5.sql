-- Add worker onboarding and visibility fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS worker_profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS worker_visibility_paid boolean DEFAULT false;