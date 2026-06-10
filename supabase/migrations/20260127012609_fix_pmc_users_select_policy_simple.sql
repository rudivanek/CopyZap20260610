/*
  # Fix pmc_users SELECT Policy for OAuth Users

  1. Problem
    - Google OAuth users can't log in (even registered ones)
    - The SELECT query in ensureUserExists() is failing
    - Likely due to RLS policy subquery causing issues

  2. Solution
    - Recreate the SELECT policy with simpler syntax
    - Use auth.uid() directly instead of (select auth.uid())
    - This avoids potential subquery execution issues

  3. Security
    - Users can only read their own pmc_users record
    - Maintains security while fixing OAuth login
*/

-- Drop and recreate the SELECT policy with simpler syntax
DROP POLICY IF EXISTS "Users can read own data" ON public.pmc_users;
DROP POLICY IF EXISTS "Users can read their own record" ON public.pmc_users;

-- Create SELECT policy with direct auth.uid() call (no subquery)
CREATE POLICY "Users can read own data"
  ON public.pmc_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
