-- Create a security definer function to check if job has reached applicant limit
CREATE OR REPLACE FUNCTION public.check_applicant_limit(job_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN (SELECT applicant_limit FROM jobs WHERE id = job_uuid) IS NULL THEN true
      ELSE (SELECT COUNT(*) FROM job_responses WHERE job_id = job_uuid) < (SELECT applicant_limit FROM jobs WHERE id = job_uuid)
    END
$$;

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Workers can create responses" ON public.job_responses;

-- Create new INSERT policy with applicant limit check
CREATE POLICY "Workers can create responses" 
ON public.job_responses 
AS RESTRICTIVE
FOR INSERT 
WITH CHECK (
  worker_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.worker_profile_completed = true
  )
  AND public.check_applicant_limit(job_id)
);