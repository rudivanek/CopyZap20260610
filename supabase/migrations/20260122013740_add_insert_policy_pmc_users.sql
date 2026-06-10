/*
  # Add INSERT policy for pmc_users table

  1. Problem
    - New user signups fail because pmc_users table has no INSERT policy
    - Users cannot be created in pmc_users after auth.users signup
    - RLS blocks the insert operation with no matching policy

  2. Solution
    - Add INSERT policy allowing authenticated users to create their own record
    - Policy ensures users can only insert a record with their own user_id

  3. Security
    - WITH CHECK ensures user can only insert record matching their auth.uid()
    - Prevents users from creating records for other users
*/

-- Add INSERT policy for pmc_users
DO $$
BEGIN
  -- Check if the policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pmc_users'
    AND policyname = 'Users can insert their own record'
  ) THEN
    CREATE POLICY "Users can insert their own record"
      ON public.pmc_users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;
