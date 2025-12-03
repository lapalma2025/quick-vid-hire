-- Add support for foreign jobs
ALTER TABLE public.jobs 
ADD COLUMN is_foreign boolean DEFAULT false,
ADD COLUMN country text;

-- Create index for filtering
CREATE INDEX idx_jobs_is_foreign ON public.jobs(is_foreign);
CREATE INDEX idx_jobs_country ON public.jobs(country) WHERE country IS NOT NULL;