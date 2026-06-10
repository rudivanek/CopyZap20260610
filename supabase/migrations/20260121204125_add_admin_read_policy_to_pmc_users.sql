/*
  # Add admin read policy to pmc_users table

  1. Changes
    - Add SELECT policy allowing admins to read all user records
    - This enables the Dashboard Credits Usage tab to display credits_allowed for filtered users

  2. Security
    - Uses existing public.is_admin() function
    - Only allows admins to read all users
    - Non-admin users still restricted to reading own data
*/

-- Add admin policy to allow reading all user records
CREATE POLICY "Admins can read all user data"
  ON pmc_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
