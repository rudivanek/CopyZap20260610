/*
  # Fix Welcome Email Trigger - Use Correct pg_net Namespace

  1. Changes
    - Drop and recreate the trigger function to use `net.http_post()` instead of `extensions.http_post()`
    - The pg_net extension functions are in the `net` schema, not `extensions`
  
  2. Notes
    - This fixes the issue where welcome emails weren't being sent on user signup
    - The trigger exists but was calling the wrong function signature
*/

-- Drop existing function
DROP FUNCTION IF EXISTS send_welcome_email_trigger() CASCADE;

-- Recreate with correct namespace
CREATE OR REPLACE FUNCTION send_welcome_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  supabase_url text := 'https://gsismfzlmmtxmuzommya.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXNtZnpsbW10eG11em9tbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzMTI1NTIsImV4cCI6MjA0Nzg4ODU1Mn0.DWo-iT_7zcapUEfehx37p9tnsDCyX0RUD3MjvzFYLC8';
BEGIN
  -- Use pg_net to make async HTTP request (non-blocking)
  -- FIXED: Use net.http_post instead of extensions.http_post
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'name', COALESCE(NEW.name, split_part(NEW.email, '@', 1))
    )
  ) INTO request_id;

  -- Log the request for debugging
  RAISE LOG 'Welcome email triggered for user % with request_id %', NEW.email, request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail user creation if email fails
  RAISE WARNING 'Failed to send welcome email for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS auto_send_welcome_email ON pmc_users;

CREATE TRIGGER auto_send_welcome_email
  AFTER INSERT ON pmc_users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_trigger();
