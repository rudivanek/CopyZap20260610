/*
  # Add model column to pmc_user_tokens_usage table
  
  1. Changes
     - Add `model` column to `pmc_user_tokens_usage` table to track which AI model was used (OpenAI or DeepSeek)
     - Set default value for existing records to 'gpt-4o'
     - Add index for more efficient queries
     
  2. Purpose
     - Track which model was used for each token usage record
     - Enable filtering and analysis by model type
*/

-- Add model column to pmc_user_tokens_usage table
ALTER TABLE public.pmc_user_tokens_usage
ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT 'gpt-4o';

-- Add brief_description column if it doesn't exist yet
ALTER TABLE public.pmc_user_tokens_usage
ADD COLUMN IF NOT EXISTS brief_description TEXT;

-- Create an index on the model column for faster filtering
CREATE INDEX IF NOT EXISTS idx_user_tokens_usage_model 
ON public.pmc_user_tokens_usage(model);

-- Comment on the model column
COMMENT ON COLUMN public.pmc_user_tokens_usage.model IS 'AI model used for generation (e.g., deepseek-chat, gpt-4o)';