-- Fix job_responses INSERT RLS: policy was created as RESTRICTIVE-only, which blocks all inserts.
-- Recreate it as PERMISSIVE (default) for authenticated users.

DROP POLICY IF EXISTS "Workers can create responses" ON public.job_responses;

CREATE POLICY "Workers can create responses"
ON public.job_responses
FOR INSERT
TO authenticated
WITH CHECK (
  (worker_id IN (
    SELECT p.id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.worker_profile_completed = true
  ))
  AND public.check_applicant_limit(job_id)
);
