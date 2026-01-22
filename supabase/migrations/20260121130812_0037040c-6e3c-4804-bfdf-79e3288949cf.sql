-- Add column to track if start date is "to be determined"
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS start_date_tbd boolean DEFAULT false;