/*
  # Dashboard feature enhancements
  
  1. New Tables
    - None - using existing tables
    
  2. Changes
    - Additional RLS policies for pmc_copy_sessions table
    - Index on created_at column for better query performance
    
  3. Security
    - Enhanced RLS policies for better access control
*/

-- Add index for faster sorting by created_at
CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_created_at 
ON public.pmc_copy_sessions(created_at);

-- Make sure pmc_copy_sessions table exists with correct structure if not already created
CREATE TABLE IF NOT EXISTS public.pmc_copy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.pmc_users(id) ON DELETE CASCADE,
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  improved_copy text NOT NULL,
  alternative_copy text,
  created_at timestamptz DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.pmc_copy_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate policies with better security
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own copy sessions" ON public.pmc_copy_sessions;
  DROP POLICY IF EXISTS "Users can insert own copy sessions" ON public.pmc_copy_sessions;
  DROP POLICY IF EXISTS "Users can delete own copy sessions" ON public.pmc_copy_sessions;
  
  -- Create new policies
  CREATE POLICY "Users can read own copy sessions"
    ON public.pmc_copy_sessions FOR SELECT
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own copy sessions"
    ON public.pmc_copy_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own copy sessions"
    ON public.pmc_copy_sessions FOR DELETE
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own copy sessions"
    ON public.pmc_copy_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END
$$;