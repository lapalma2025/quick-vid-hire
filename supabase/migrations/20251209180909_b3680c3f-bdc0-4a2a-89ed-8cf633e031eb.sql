-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Workers can create responses" ON public.job_responses;

-- Create a new policy that checks worker_profile_completed instead of role
CREATE POLICY "Workers can create responses" 
ON public.job_responses 
FOR INSERT 
WITH CHECK (
  worker_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.worker_profile_completed = true
  )
);