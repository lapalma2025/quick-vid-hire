-- Add location precision fields for workers
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS street TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.district IS 'District/neighborhood for Wrocław workers';
COMMENT ON COLUMN public.profiles.street IS 'Street name (without house number) for precise location';
COMMENT ON COLUMN public.profiles.location_lat IS 'Latitude - only set if street was geocoded';
COMMENT ON COLUMN public.profiles.location_lng IS 'Longitude - only set if street was geocoded';