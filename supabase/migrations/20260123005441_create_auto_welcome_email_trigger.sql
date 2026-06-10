/*
  # Automatic Welcome Email Trigger
  
  Creates a database trigger that automatically sends welcome emails when new users are created.
  
  1. Changes
    - Create trigger function to invoke send-welcome-email edge function
    - Attach trigger to pmc_users table on INSERT
    
  2. Security
    - Uses pg_net extension for HTTP calls
    - Non-blocking execution via background worker
*/

-- Create function to send welcome email via edge function
CREATE OR REPLACE FUNCTION send_welcome_email_trigger()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  supabase_url text := current_setting('app.settings.supabase_url', true);
  anon_key text := current_setting('app.settings.anon_key', true);
BEGIN
  -- Use pg_net to make async HTTP request (non-blocking)
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'name', COALESCE(NEW.name, split_part(NEW.email, '@', 1))
    )
  );
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS auto_send_welcome_email ON public.pmc_users;

-- Create trigger on pmc_users table
CREATE TRIGGER auto_send_welcome_email
  AFTER INSERT ON public.pmc_users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_trigger();
