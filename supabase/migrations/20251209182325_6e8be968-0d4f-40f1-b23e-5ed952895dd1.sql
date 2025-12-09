-- Add end_time column to jobs table for job end date
ALTER TABLE public.jobs
ADD COLUMN end_time timestamp with time zone DEFAULT NULL;