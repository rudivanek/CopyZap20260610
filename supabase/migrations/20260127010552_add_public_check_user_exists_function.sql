/*
  # Add public function to check if user exists
  
  1. New Function
    - `public_check_user_exists(email text)` - Returns boolean indicating if user exists
    - Can be called by unauthenticated users (anon role)
    - Only returns true/false, does not expose any user data
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Only returns boolean, no sensitive data exposed
    - Marked as STABLE (read-only)
*/

-- Create function to check if user exists (callable by anyone)
CREATE OR REPLACE FUNCTION public_check_user_exists(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pmc_users 
    WHERE email = user_email
  );
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public_check_user_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public_check_user_exists(text) TO authenticated;
