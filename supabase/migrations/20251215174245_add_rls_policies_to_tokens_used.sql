/*
  # Add RLS Policies to pmc_user_tokens_used

  1. Problem
    - RLS is enabled on pmc_user_tokens_used
    - NO policies exist, so users cannot read their own token data
    - Edge functions can write (service role bypasses RLS)
    - Dashboard queries fail silently for regular users

  2. Solution
    - Add SELECT policy for users to view their own token records
    - Add SELECT policy for admins to view all token records
    - Keep INSERT restricted to service role (Edge Functions only)

  3. Security
    - Users can only SELECT their own records (user_id match)
    - Admins can SELECT all records
    - No UPDATE or DELETE policies (immutable records)
    - INSERT remains Edge Function only (no policy = service role only)
*/

-- Allow users to view their own token usage
CREATE POLICY "Users can view own token usage"
  ON pmc_user_tokens_used
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM pmc_users WHERE id = auth.uid()
    )
  );

-- Allow admins to view all token usage
CREATE POLICY "Admins can view all token usage"
  ON pmc_user_tokens_used
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pmc_users
      WHERE id = auth.uid()
      AND email IN (
        'info@sharpen.studio',
        'thijs@readspeaker.com',
        'thijs.vanopstal@gmail.com'
      )
    )
  );