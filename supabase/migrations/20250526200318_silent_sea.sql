/*
  # Fix RLS policies for token usage tracking
  
  1. Purpose
    - Update RLS policies to fix issues with token usage tracking
    - Ensure correct JWT email extraction in RLS policies
    - Clean up any old policies to prevent conflicts
  
  2. Changes
    - Drop all existing policies related to token usage tracking
    - Create new policies with consistent syntax for email extraction
    - Ensure all required columns exist with proper constraints
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can delete their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pmc_user_tokens_usage;

-- Make sure all required columns exist
DO $$ 
BEGIN
  -- Add brief_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_user_tokens_usage' AND column_name = 'brief_description'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_usage ADD COLUMN brief_description TEXT;
    COMMENT ON COLUMN public.pmc_user_tokens_usage.brief_description IS 'A brief description of what the tokens were used for';
  END IF;
  
  -- Add model column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_user_tokens_usage' AND column_name = 'model'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_usage ADD COLUMN model TEXT NOT NULL DEFAULT 'gpt-4o';
    COMMENT ON COLUMN public.pmc_user_tokens_usage.model IS 'AI model used for generation (e.g., deepseek-chat, gpt-4o)';
  END IF;
END $$;

-- Create index for model if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_tokens_usage_model ON public.pmc_user_tokens_usage(model);

-- Create new policies with simplest possible JWT syntax
CREATE POLICY "Enable read access for all users" 
ON public.pmc_user_tokens_usage
FOR SELECT
TO public
USING (true);

-- Note: The key fix here is using auth.jwt() ->> 'email' instead of other approaches
CREATE POLICY "Users can view their own token usage" 
ON public.pmc_user_tokens_usage
FOR SELECT
TO authenticated
USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own token usage" 
ON public.pmc_user_tokens_usage
FOR INSERT
TO authenticated
WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own token usage" 
ON public.pmc_user_tokens_usage
FOR UPDATE
TO authenticated
USING (user_email = auth.jwt() ->> 'email')
WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own token usage" 
ON public.pmc_user_tokens_usage
FOR DELETE
TO authenticated
USING (user_email = auth.jwt() ->> 'email');