/*
# Welcome email: sent when the address is confirmed, and only once

1. Purpose
   Until now the welcome email was requested the moment an account record was
   created, before the address was confirmed. A new user received "confirm your
   email" and "welcome" together, and an address typed by someone else received
   a welcome email. Also, the email function sent to whatever address a caller
   named.

   Now the database asks for the welcome email when an address becomes
   confirmed, and it only passes the account's id. The email function reads the
   address and the name from the database itself and sends once per account
   (see `supabase/functions/send-welcome-email`).

2. Changes
   - `public.pmc_users.welcome_email_sent_at` (timestamptz, nullable): when the
     welcome email went out. Empty means "not sent yet". The email function
     sets it, and that is what makes the email go out only once.
     Every account that exists when this migration first runs is marked as
     already sent (with its creation time), so nobody gets a late welcome.
   - `public.send_welcome_email_when_confirmed()`: trigger function on
     `auth.users`. It acts only at the moment `email_confirmed_at` goes from
     empty to set: on INSERT for sign-ups that are confirmed straight away
     (Google, accounts created by an admin), on UPDATE when a user confirms by
     email. It never blocks a sign-up or a confirmation: any error is logged
     and swallowed.
   - Trigger `on_auth_user_welcome_email` on `auth.users` (AFTER INSERT OR
     UPDATE OF email_confirmed_at). Its name sorts after `on_auth_user_created`
     on purpose, so the account record exists before it runs.
   - The old trigger `auto_send_welcome_email` on `public.pmc_users` and its
     function `public.send_welcome_email_trigger()` are removed.

3. Security
   - No policy is added or loosened.
   - The key in the function below is the project's public (anon) key, the
     same one the old function carried and every browser receives.

4. Idempotency
   Safe to run more than once: the column is added and existing accounts are
   marked only when the column does not exist yet; the function uses CREATE OR
   REPLACE; the triggers are dropped before they are created.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_users' AND column_name = 'welcome_email_sent_at'
  ) THEN
    ALTER TABLE public.pmc_users ADD COLUMN welcome_email_sent_at timestamptz;
    -- Everyone who already has an account has had their welcome.
    UPDATE public.pmc_users SET welcome_email_sent_at = COALESCE(created_at, now());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.send_welcome_email_when_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  request_id bigint;
  supabase_url text := 'https://gsismfzlmmtxmuzommya.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXNtZnpsbW10eG11em9tbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzMTI1NTIsImV4cCI6MjA0Nzg4ODU1Mn0.DWo-iT_7zcapUEfehx37p9tnsDCyX0RUD3MjvzFYLC8';
BEGIN
  -- Only at the moment an address becomes confirmed.
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Ask the email function, without waiting for it (pg_net). Only the account's
  -- id is passed: the function reads the address and the name itself.
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('user_id', NEW.id)
  ) INTO request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail a sign-up or a confirmation because of the welcome email.
  RAISE WARNING 'Welcome email could not be requested for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_welcome_email ON auth.users;
CREATE TRIGGER on_auth_user_welcome_email
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email_when_confirmed();

DROP TRIGGER IF EXISTS auto_send_welcome_email ON public.pmc_users;
DROP FUNCTION IF EXISTS public.send_welcome_email_trigger();
