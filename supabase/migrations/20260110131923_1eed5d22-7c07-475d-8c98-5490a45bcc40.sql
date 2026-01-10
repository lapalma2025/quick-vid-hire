-- Add budget_max column for range budget option
ALTER TABLE public.jobs ADD COLUMN budget_max numeric NULL;

-- Add comment to clarify the column usage
COMMENT ON COLUMN public.jobs.budget_max IS 'Maximum budget when user specifies a range (from-to). If null, budget is a single value.';