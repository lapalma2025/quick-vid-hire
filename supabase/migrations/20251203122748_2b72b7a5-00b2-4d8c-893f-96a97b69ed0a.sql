-- Add 'closed' status to job_status enum
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'closed';