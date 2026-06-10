/*
  # Add copy_source column and make brief_description required
  
  1. Changes
     - Add `copy_source` column to `pmc_user_tokens_usage` table
     - Make `brief_description` column required (NOT NULL)
     - Update existing rows to set non-null values for brief_description
     - Add constraint to ensure brief_description is not empty
     
  2. Purpose
     - Track the source of token usage (e.g., "Copy Generator")
     - Ensure all token usage records have a meaningful description
     - Improve reporting and analytics capabilities
*/

-- First make sure the brief_description column exists
ALTER TABLE public.pmc_user_tokens_usage
ADD COLUMN IF NOT EXISTS brief_description TEXT;

-- Update any NULL brief_description values to prevent constraint violation
UPDATE public.pmc_user_tokens_usage
SET brief_description = CASE
    WHEN control_executed LIKE '%create%' THEN 'Create copy'
    WHEN control_executed LIKE '%improve%' THEN 'Improve copy'
    WHEN control_executed LIKE '%evaluate%' THEN 'Evaluate content'
    WHEN control_executed LIKE '%suggestion%' THEN 'Get suggestions'
    ELSE 'Token usage'
  END
WHERE brief_description IS NULL OR brief_description = '';

-- Add copy_source column with default value
ALTER TABLE public.pmc_user_tokens_usage
ADD COLUMN IF NOT EXISTS copy_source TEXT NOT NULL DEFAULT 'Copy Generator';

-- Make brief_description NOT NULL
ALTER TABLE public.pmc_user_tokens_usage
ALTER COLUMN brief_description SET NOT NULL;

-- Add constraint to ensure brief_description is not empty
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brief_description_not_empty'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_usage
    ADD CONSTRAINT brief_description_not_empty CHECK (length(trim(both from brief_description)) > 0);
  END IF;
END $$;

-- Add comment to explain the columns
COMMENT ON COLUMN public.pmc_user_tokens_usage.brief_description IS 'Brief description of what the tokens were used for';
COMMENT ON COLUMN public.pmc_user_tokens_usage.copy_source IS 'Source of the token usage (e.g., Copy Generator)';