-- Add completed_jobs_count to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_jobs_count integer NOT NULL DEFAULT 0;

-- Add confirmation fields to job_responses for tracking job completion by both parties
ALTER TABLE public.job_responses ADD COLUMN IF NOT EXISTS client_confirmed_done boolean DEFAULT false;
ALTER TABLE public.job_responses ADD COLUMN IF NOT EXISTS worker_confirmed_done boolean DEFAULT false;
ALTER TABLE public.job_responses ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Create function to update worker's completed jobs count
CREATE OR REPLACE FUNCTION public.update_worker_completed_jobs_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when both parties confirm the job is done
  IF NEW.client_confirmed_done = true AND NEW.worker_confirmed_done = true AND OLD.completed_at IS NULL THEN
    -- Set completed_at timestamp
    NEW.completed_at = now();
    
    -- Increment the worker's completed jobs count
    UPDATE public.profiles
    SET completed_jobs_count = completed_jobs_count + 1
    WHERE id = NEW.worker_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating completed jobs count
DROP TRIGGER IF EXISTS update_completed_jobs_count_trigger ON public.job_responses;
CREATE TRIGGER update_completed_jobs_count_trigger
BEFORE UPDATE ON public.job_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_worker_completed_jobs_count();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_responses_completed ON public.job_responses(worker_id, completed_at) WHERE completed_at IS NOT NULL;