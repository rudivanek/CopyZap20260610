/*
  # Fix Automatic Welcome Email Trigger with pg_net
  
  1. Changes
    - Enable pg_net extension for HTTP calls
    - Update trigger function to use pg_net properly
    - Use Supabase vault for storing credentials (or hardcode for now)
    
  2. Security
    - Non-blocking execution via pg_net background worker
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop old function and trigger
DROP TRIGGER IF EXISTS auto_send_welcome_email ON public.pmc_users;
DROP FUNCTION IF EXISTS send_welcome_email_trigger();

-- Create improved function to send welcome email via edge function
CREATE OR REPLACE FUNCTION send_welcome_email_trigger()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  request_id bigint;
  supabase_url text := 'https://gsismfzlmmtxmuzommya.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXNtZnpsbW10eG11em9tbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzMTI1NTIsImV4cCI6MjA0Nzg4ODU1Mn0.DWo-iT_7zcapUEfehx37p9tnsDCyX0RUD3MjvzFYLC8';
BEGIN
  -- Use pg_net to make async HTTP request (non-blocking)
  SELECT extensions.http_post(
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

-- Create trigger on pmc_users table
CREATE TRIGGER auto_send_welcome_email
  AFTER INSERT ON public.pmc_users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_trigger();

COMMENT ON FUNCTION send_welcome_email_trigger IS 'Automatically sends welcome email when new user is created';
