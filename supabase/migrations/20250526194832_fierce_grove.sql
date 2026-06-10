/*
  # Fix token usage table permissions with correct JWT access
  
  1. Changes
    - Recreate all policies with simpler and more consistent JWT syntax
    - Ensure INSERT permission correctly checks email against JWT claim
  
  2. Security
    - Use auth.jwt() consistently across all policies for better reliability
    - Make all policies use the same syntax pattern for consistency
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can delete their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pmc_user_tokens_usage;

-- Add a comment field for the model column if it doesn't exist
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

-- Create model index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_tokens_usage_model ON public.pmc_user_tokens_usage(model);

-- Create new policies with simple, consistent JWT syntax
CREATE POLICY "Enable read access for all users" 
ON public.pmc_user_tokens_usage
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can view their own token usage" 
ON public.pmc_user_tokens_usage
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = user_email);

CREATE POLICY "Users can insert their own token usage" 
ON public.pmc_user_tokens_usage
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = user_email);

CREATE POLICY "Users can update their own token usage" 
ON public.pmc_user_tokens_usage
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') = user_email)
WITH CHECK ((auth.jwt() ->> 'email') = user_email);

CREATE POLICY "Users can delete their own token usage" 
ON public.pmc_user_tokens_usage
FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'email') = user_email);