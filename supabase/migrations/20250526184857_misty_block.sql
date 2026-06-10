/*
  # Fix RLS Policy for Token Usage Table
  
  1. Changes
    - Drop existing RLS policies for pmc_user_tokens_usage table
    - Create new policies with correct syntax for JWT claims access
    - Ensure consistent RLS policy application across operations
  
  2. Security
    - Properly secure token usage data by user email
    - Maintain public read access for usage statistics
*/

-- Drop existing policies to ensure clean setup
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can delete their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pmc_user_tokens_usage;

-- Create consistent RLS policies using the current_setting approach which is more reliable
CREATE POLICY "Users can insert their own token usage" 
ON public.pmc_user_tokens_usage
FOR INSERT
TO authenticated
WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update their own token usage" 
ON public.pmc_user_tokens_usage
FOR UPDATE
TO authenticated
USING (user_email = current_setting('request.jwt.claims', true)::json->>'email')
WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can delete their own token usage" 
ON public.pmc_user_tokens_usage
FOR DELETE
TO authenticated
USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can view their own token usage" 
ON public.pmc_user_tokens_usage
FOR SELECT
TO authenticated
USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Keep the existing policy for public read access if needed
CREATE POLICY "Enable read access for all users" 
ON public.pmc_user_tokens_usage
FOR SELECT
TO public
USING (true);