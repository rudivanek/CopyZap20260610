/*
  # Remove Duplicate INSERT Policy on pmc_users
  
  ## Problem
  There are two INSERT policies on pmc_users:
  1. "Users can insert their own record" (newly added)
  2. "pmc_users_insert" (from previous migration)
  
  Both do the same thing, which is redundant.
  
  ## Solution
  Keep only "pmc_users_insert" policy (from the consolidated migration)
  and remove the duplicate "Users can insert their own record" policy.
  
  ## Changes
  - DROP the duplicate policy
*/

-- Remove duplicate INSERT policy
DROP POLICY IF EXISTS "Users can insert their own record" ON public.pmc_users;
