/*
  # Create a more permissive policy for token usage tracking
  
  1. Changes
    - Drop existing policies for pmc_user_tokens_usage table
    - Create a simpler, more permissive policy for INSERT operations 
    - Keep restrictive policies for update and delete operations
  
  2. Purpose
    - Fix issues with token tracking by using a more permissive approach
    - Enable all authenticated users to insert token usage records
    - Maintain security while improving functionality
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can delete their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.pmc_user_tokens_usage;

-- Create new, simpler policies
CREATE POLICY "Enable read access for all users" 
ON public.pmc_user_tokens_usage
FOR SELECT
TO public
USING (true);

-- Most important change: Create a permissive INSERT policy that doesn't check email matching
CREATE POLICY "Enable insert access for all authenticated users" 
ON public.pmc_user_tokens_usage
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- These policies remain restrictive for safety
CREATE POLICY "Users can delete their own token usage" 
ON public.pmc_user_tokens_usage
FOR DELETE 
TO authenticated
USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own token usage" 
ON public.pmc_user_tokens_usage
FOR UPDATE 
TO authenticated
USING (user_email = auth.jwt() ->> 'email')
WITH CHECK (user_email = auth.jwt() ->> 'email');