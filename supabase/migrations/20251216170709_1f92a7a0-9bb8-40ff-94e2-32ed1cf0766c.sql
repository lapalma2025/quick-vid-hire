-- Create a security definer function to get the public response count (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_job_response_count(job_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM job_responses WHERE job_id = job_uuid
$$;