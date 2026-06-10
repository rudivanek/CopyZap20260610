/*
  # Fix RLS policies for token usage tracking
  
  1. Purpose
    - Update RLS policies for pmc_user_tokens_usage table
    - Ensure users can only access their own token usage data
    - Remove overly permissive policies that may affect data loading
  
  2. Changes
    - Drop existing policies that might be too permissive
    - Create proper RLS policies for SELECT, INSERT, UPDATE, and DELETE operations
    - Ensure consistent email checking across all policies
*/

-- Drop all existing policies for pmc_user_tokens_usage to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can delete their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.pmc_user_tokens_usage;

-- Create new, properly restrictive policies

-- Policy for authenticated users to read their own token usage
CREATE POLICY "Users can view their own token usage"
ON public.pmc_user_tokens_usage
FOR SELECT
TO authenticated
USING (user_email = (auth.jwt() ->> 'email'));

-- Policy for authenticated users to insert their own token usage
CREATE POLICY "Users can insert their own token usage"
ON public.pmc_user_tokens_usage
FOR INSERT
TO authenticated
WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- Policy for authenticated users to update their own token usage
CREATE POLICY "Users can update their own token usage"
ON public.pmc_user_tokens_usage
FOR UPDATE
TO authenticated
USING (user_email = (auth.jwt() ->> 'email'))
WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- Policy for authenticated users to delete their own token usage
CREATE POLICY "Users can delete their own token usage"
ON public.pmc_user_tokens_usage
FOR DELETE
TO authenticated
USING (user_email = (auth.jwt() ->> 'email'));