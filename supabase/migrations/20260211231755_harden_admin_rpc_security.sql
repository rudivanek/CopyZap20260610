/*
  # Harden Admin RPC Security

  1. Security Issue Fixed
    - get_all_users_credits_summary was executable by ALL authenticated users
    - This allows non-admins to see all users' credits usage (privacy breach)

  2. Changes
    - REVOKE EXECUTE from authenticated and anon roles
    - ONLY service_role (used by admin edge function) can execute
    - Edge function already has admin authentication checks

  3. Impact
    - Regular users CANNOT call this function
    - Admin edge function continues to work (uses service_role)
    - No impact on get_user_credits_balance (has auth.uid() check)
*/

-- Revoke execute from authenticated and anon (security fix)
REVOKE EXECUTE ON FUNCTION get_all_users_credits_summary() FROM authenticated;
REVOKE EXECUTE ON FUNCTION get_all_users_credits_summary() FROM anon;

-- Service role retains access (used by admin edge function)
GRANT EXECUTE ON FUNCTION get_all_users_credits_summary() TO service_role;