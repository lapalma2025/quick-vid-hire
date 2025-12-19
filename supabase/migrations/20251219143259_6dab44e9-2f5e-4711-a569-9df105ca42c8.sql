-- Allow participants to update read status on chat_messages (and protect other columns)

-- Trigger function to prevent editing message content (only read can change)
CREATE OR REPLACE FUNCTION public.enforce_chat_messages_read_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.job_id IS DISTINCT FROM OLD.job_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.image_url IS DISTINCT FROM OLD.image_url
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only read status can be updated';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_messages_read_only ON public.chat_messages;
CREATE TRIGGER trg_chat_messages_read_only
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_chat_messages_read_only();

-- RLS policy for UPDATE (marking read/unread)
DROP POLICY IF EXISTS "Participants can update read status" ON public.chat_messages;
CREATE POLICY "Participants can update read status"
ON public.chat_messages
FOR UPDATE
USING (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR job_id IN (
    SELECT id FROM jobs
    WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR job_id IN (
    SELECT id FROM jobs
    WHERE selected_worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR job_id IN (
    SELECT job_id FROM job_responses
    WHERE worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR job_id IN (
    SELECT id FROM jobs
    WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR job_id IN (
    SELECT id FROM jobs
    WHERE selected_worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR job_id IN (
    SELECT job_id FROM job_responses
    WHERE worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);