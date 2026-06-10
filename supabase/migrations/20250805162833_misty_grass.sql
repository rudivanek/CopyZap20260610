/*
# Fix beta registration RLS policy

1. Updates
   - Change INSERT policy role from 'public' to 'anon' to allow unauthenticated users to register for beta
   
2. Security
   - Maintains existing admin read access policy
   - Allows anonymous users to insert beta registrations
*/

-- Drop the existing INSERT policy that uses 'public' role
DROP POLICY IF EXISTS "Allow public beta registration" ON beta_register;

-- Create new INSERT policy that uses 'anon' role for unauthenticated users
CREATE POLICY "Allow anonymous beta registration"
  ON beta_register
  FOR INSERT
  TO anon
  WITH CHECK (true);