/*
  # Add brief description to pmc_user_tokens_usage table
  
  1. Changes
    - Add `brief_description` column to the `pmc_user_tokens_usage` table
    - This allows tracking what the tokens were used for in more detail
    - Adds documentation comment to explain the purpose of the field
*/

-- Add brief_description column to pmc_user_tokens_usage table
ALTER TABLE public.pmc_user_tokens_usage
ADD COLUMN IF NOT EXISTS brief_description TEXT;

-- Create a comment explaining the column
COMMENT ON COLUMN public.pmc_user_tokens_usage.brief_description IS 'A brief description of what the tokens were used for';