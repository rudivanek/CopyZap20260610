/*
  # Update RLS policies for pmc_user_tokens_usage table
  
  1. Changes
     - Fix the INSERT policy to properly use the JWT email claim
     - Ensure the policy uses the correct syntax for extracting email from JWT claims
     - Make all policies consistent in how they access the user's email
*/

-- First, drop the existing INSERT policy that might be causing the issue
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.pmc_user_tokens_usage;

-- Create a new INSERT policy with the correct JWT claim extraction
CREATE POLICY "Users can insert their own token usage" 
ON public.pmc_user_tokens_usage
FOR INSERT 
TO authenticated
WITH CHECK (
  user_email = (current_setting('request.jwt.claims', true)::json->>'email')
);

-- Update the other policies to ensure consistency
DROP POLICY IF EXISTS "Users can update their own token usage" ON public.pmc_user_tokens_usage;
CREATE POLICY "Users can update their own token usage" 
ON public.pmc_user_tokens_usage
FOR UPDATE 
TO authenticated
USING (
  user_email = (current_setting('request.jwt.claims', true)::json->>'email')
)
WITH CHECK (
  user_email = (current_setting('request.jwt.claims', true)::json->>'email')
);

DROP POLICY IF EXISTS "Users can delete their own token usage" ON public.pmc_user_tokens_usage;
CREATE POLICY "Users can delete their own token usage" 
ON public.pmc_user_tokens_usage
FOR DELETE 
TO authenticated
USING (
  user_email = (current_setting('request.jwt.claims', true)::json->>'email')
);

DROP POLICY IF EXISTS "Users can view their own token usage" ON public.pmc_user_tokens_usage;
CREATE POLICY "Users can view their own token usage" 
ON public.pmc_user_tokens_usage
FOR SELECT 
TO authenticated
USING (
  user_email = (current_setting('request.jwt.claims', true)::json->>'email')
);