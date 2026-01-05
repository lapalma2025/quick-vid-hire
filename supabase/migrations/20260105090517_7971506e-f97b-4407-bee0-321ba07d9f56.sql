-- Add district column for jobs (especially for Wrocław)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS district TEXT;

-- Add lat/lng columns for job location on map
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Add index for faster location queries
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs (location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_miasto ON public.jobs (miasto);
CREATE INDEX IF NOT EXISTS idx_jobs_district ON public.jobs (district) WHERE district IS NOT NULL;