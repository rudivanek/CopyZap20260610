/*
  # Restore pmc_users INSERT Policy
  
  ## Problem
  The INSERT policy for pmc_users was dropped in migration 20260127011905, 
  which prevents authenticated users from creating their own records.
  This causes session creation to fail because pmc_copy_sessions has a 
  foreign key constraint to pmc_users.
  
  ## Solution
  Restore the INSERT policy that allows authenticated users to create
  their own record in pmc_users. This is safe because:
  - Users can only insert records with their own auth.uid()
  - The record is tied to their authenticated session
  - This is required for the application to function properly
  
  ## Changes
  1. Add back "Users can insert their own record" policy
  
  ## Security
  - Policy uses WITH CHECK (id = (select auth.uid()))
  - Users can only create records for themselves
  - No privilege escalation possible
*/

-- Restore INSERT policy for authenticated users
CREATE POLICY "Users can insert their own record"
  ON public.pmc_users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));
