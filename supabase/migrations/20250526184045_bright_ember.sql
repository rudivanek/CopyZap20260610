/*
  # Fix RLS policies for pmc_user_tokens_usage table

  1. Changes
     - Fix the RLS policy for inserting token usage data
     - Ensure the policy uses the correct JWT claim extraction method
     - Standardize the policies for consistency

  2. Security
     - Update policies to use the standardized `auth.jwt() ->> 'email'` for checking user email
     - Ensure users can only insert, update, and delete their own token usage data
     - Maintain read access for all users (as per existing policy)
*/

-- Drop existing INSERT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own token usage" ON pmc_user_tokens_usage;

-- Create a consistent INSERT policy that properly extracts email from JWT claims
CREATE POLICY "Users can insert their own token usage" 
ON pmc_user_tokens_usage
FOR INSERT
TO authenticated
WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Standardize other policies for consistency
DROP POLICY IF EXISTS "Users can update their own token usage" ON pmc_user_tokens_usage;
CREATE POLICY "Users can update their own token usage" 
ON pmc_user_tokens_usage
FOR UPDATE
TO authenticated
USING (user_email = auth.jwt() ->> 'email')
WITH CHECK (user_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Users can delete their own token usage" ON pmc_user_tokens_usage;
CREATE POLICY "Users can delete their own token usage" 
ON pmc_user_tokens_usage
FOR DELETE
TO authenticated
USING (user_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Users can view their own token usage" ON pmc_user_tokens_usage;
CREATE POLICY "Users can view their own token usage" 
ON pmc_user_tokens_usage
FOR SELECT
TO authenticated
USING (user_email = auth.jwt() ->> 'email');

-- Keep the existing policy for public read access if needed
DROP POLICY IF EXISTS "Enable read access for all users" ON pmc_user_tokens_usage;
CREATE POLICY "Enable read access for all users" 
ON pmc_user_tokens_usage
FOR SELECT
TO public
USING (true);