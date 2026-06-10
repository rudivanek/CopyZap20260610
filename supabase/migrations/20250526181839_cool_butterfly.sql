/*
  # Fix RLS policy for token usage tracking
  
  1. Changes
     - Drop the existing INSERT policy for pmc_user_tokens_usage
     - Create a new INSERT policy with the correct JWT access syntax
     
  2. Purpose
     - Fix 403 error when trying to insert token usage data
     - Ensure consistent JWT claim access syntax across policies
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.pmc_user_tokens_usage;

-- Create new INSERT policy with correct JWT access syntax
CREATE POLICY "Users can insert their own token usage"
ON public.pmc_user_tokens_usage
FOR INSERT 
TO authenticated
WITH CHECK (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));