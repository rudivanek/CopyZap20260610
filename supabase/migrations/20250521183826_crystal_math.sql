/*
  # Add brief_description to pmc_user_tokens_usage table

  1. Changes
    - Add `brief_description` column to `pmc_user_tokens_usage` table
    - This allows storing a short description of what the tokens were used for
*/

-- Add brief_description column to pmc_user_tokens_usage table
ALTER TABLE public.pmc_user_tokens_usage
ADD COLUMN IF NOT EXISTS brief_description TEXT;

-- Create a comment explaining the column
COMMENT ON COLUMN public.pmc_user_tokens_usage.brief_description IS 'A brief description of what the tokens were used for';