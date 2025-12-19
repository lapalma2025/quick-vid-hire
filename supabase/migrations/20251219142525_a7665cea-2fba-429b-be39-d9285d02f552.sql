-- Drop existing policies
DROP POLICY IF EXISTS "Chat participants can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON chat_messages;

-- Create new SELECT policy that allows:
-- 1. Job owner (client) to see all messages for their jobs
-- 2. Selected worker to see messages
-- 3. Workers who applied to the job to see messages
-- 4. Message sender to see their own messages
CREATE POLICY "Chat participants can view messages" ON chat_messages
FOR SELECT USING (
  -- You are the sender
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  -- You are the job owner
  job_id IN (
    SELECT id FROM jobs 
    WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR
  -- You are the selected worker
  job_id IN (
    SELECT id FROM jobs 
    WHERE selected_worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR
  -- You have applied to this job (worker who sent a job_response)
  job_id IN (
    SELECT job_id FROM job_responses 
    WHERE worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Create new INSERT policy that allows:
-- 1. Job owner to send messages to their jobs
-- 2. Selected worker to send messages
-- 3. Workers who applied to send messages
CREATE POLICY "Participants can send messages" ON chat_messages
FOR INSERT WITH CHECK (
  -- Sender must be the current user
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND
  (
    -- You are the job owner
    job_id IN (
      SELECT id FROM jobs 
      WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR
    -- You are the selected worker
    job_id IN (
      SELECT id FROM jobs 
      WHERE selected_worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR
    -- You have applied to this job
    job_id IN (
      SELECT job_id FROM job_responses 
      WHERE worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
);