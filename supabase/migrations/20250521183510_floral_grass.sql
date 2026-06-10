/*
  # Add brief_description column and token tracking
  
  1. New Tables
     - None - enhancing existing tables
  
  2. Changes
     - Add brief_description column to pmc_copy_sessions
     - Create token usage tracking table
     
  3. Security
     - Add appropriate RLS policies for token usage tracking
*/

-- Add brief_description column to pmc_copy_sessions table if it doesn't exist
ALTER TABLE public.pmc_copy_sessions
ADD COLUMN IF NOT EXISTS brief_description TEXT;

-- Create the token usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pmc_user_tokens_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  token_usage INTEGER NOT NULL,
  token_cost NUMERIC(10, 6) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  control_executed TEXT NOT NULL DEFAULT ''
);

-- Add constraints to ensure data integrity
DO $$ 
BEGIN
  -- Add constraint to ensure token usage is positive
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'positive_token_usage'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_usage 
    ADD CONSTRAINT positive_token_usage CHECK (token_usage > 0);
  END IF;

  -- Add constraint to ensure token cost is non-negative
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'positive_token_cost'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_usage 
    ADD CONSTRAINT positive_token_cost CHECK (token_cost >= 0);
  END IF;

  -- Add constraint to ensure control_executed is not empty
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_control_execute'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_usage 
    ADD CONSTRAINT valid_control_execute CHECK (length(trim(both from control_executed)) > 0);
  END IF;
  
  -- Add foreign key if it doesn't exist already and user_access table exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_tokens_usage_user_email_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_access'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_usage
    ADD CONSTRAINT user_tokens_usage_user_email_fkey
    FOREIGN KEY (user_email) REFERENCES public.user_access("user");
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_tokens_usage_user_email 
ON public.pmc_user_tokens_usage(user_email);

CREATE INDEX IF NOT EXISTS idx_user_tokens_usage_date 
ON public.pmc_user_tokens_usage(usage_date);

CREATE INDEX IF NOT EXISTS idx_user_tokens_usage_control 
ON public.pmc_user_tokens_usage(control_executed);

-- Enable Row Level Security
ALTER TABLE public.pmc_user_tokens_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Policy for users to view their own token usage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own token usage'
    AND tablename = 'pmc_user_tokens_usage'
  ) THEN
    CREATE POLICY "Users can view their own token usage"
    ON public.pmc_user_tokens_usage
    FOR SELECT
    TO authenticated
    USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));
  END IF;

  -- Policy for users to insert their own token usage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own token usage'
    AND tablename = 'pmc_user_tokens_usage'
  ) THEN
    CREATE POLICY "Users can insert their own token usage"
    ON public.pmc_user_tokens_usage
    FOR INSERT
    TO authenticated
    WITH CHECK (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));
  END IF;

  -- Policy for users to update their own token usage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own token usage'
    AND tablename = 'pmc_user_tokens_usage'
  ) THEN
    CREATE POLICY "Users can update their own token usage"
    ON public.pmc_user_tokens_usage
    FOR UPDATE
    TO authenticated
    USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'))
    WITH CHECK (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));
  END IF;

  -- Policy for users to delete their own token usage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own token usage'
    AND tablename = 'pmc_user_tokens_usage'
  ) THEN
    CREATE POLICY "Users can delete their own token usage"
    ON public.pmc_user_tokens_usage
    FOR DELETE
    TO authenticated
    USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));
  END IF;

  -- Policy to enable read access for all users (public data)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users'
    AND tablename = 'pmc_user_tokens_usage'
  ) THEN
    CREATE POLICY "Enable read access for all users"
    ON public.pmc_user_tokens_usage
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;