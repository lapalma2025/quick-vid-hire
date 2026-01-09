-- Add parent_id and description columns to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS description text;

-- Create index for faster hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);