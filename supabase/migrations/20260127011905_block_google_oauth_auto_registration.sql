/*
  # Block Auto-Registration for Google OAuth Users

  1. Problem
    - Unregistered Google OAuth users can auto-create pmc_users records
    - The INSERT policy allows any authenticated user to create their own record
    - This bypasses the beta registration requirement

  2. Solution
    - DROP the INSERT policy that allows self-registration
    - Only admins and the register-beta-user edge function can create pmc_users records
    - Google OAuth users WITHOUT a pmc_users record will be denied access

  3. Security
    - Enforces registration requirement for ALL users (email AND Google OAuth)
    - Prevents unauthorized account creation
    - Maintains admin control over user provisioning
*/

-- Drop the self-registration INSERT policy
DROP POLICY IF EXISTS "Users can insert their own record" ON public.pmc_users;

-- Confirm only admins can insert (existing admin policies remain)
-- Admin INSERT is already covered by existing policies
