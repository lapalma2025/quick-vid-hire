-- Add applicant limit column to jobs table
ALTER TABLE public.jobs ADD COLUMN applicant_limit integer DEFAULT NULL;

-- NULL means unlimited