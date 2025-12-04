-- Add availability hours to profiles
ALTER TABLE public.profiles
ADD COLUMN available_from TIME DEFAULT NULL,
ADD COLUMN available_to TIME DEFAULT NULL;

-- Add group application support to jobs
ALTER TABLE public.jobs
ADD COLUMN allows_group BOOLEAN DEFAULT false,
ADD COLUMN min_workers INTEGER DEFAULT 1,
ADD COLUMN max_workers INTEGER DEFAULT 1;

-- Add group support to job_responses
ALTER TABLE public.job_responses
ADD COLUMN is_group_application BOOLEAN DEFAULT false,
ADD COLUMN group_size INTEGER DEFAULT 1,
ADD COLUMN group_members TEXT[] DEFAULT NULL;