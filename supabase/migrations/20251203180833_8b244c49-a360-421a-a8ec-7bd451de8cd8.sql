-- Drop the existing update policy
DROP POLICY IF EXISTS "Workers can update own responses" ON public.job_responses;

-- Create new policy that allows both workers to update own responses AND job owners to update response status
CREATE POLICY "Responses can be updated by worker or job owner"
ON public.job_responses
FOR UPDATE
USING (
  (worker_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
  OR 
  (job_id IN (SELECT jobs.id FROM jobs WHERE jobs.user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())))
);