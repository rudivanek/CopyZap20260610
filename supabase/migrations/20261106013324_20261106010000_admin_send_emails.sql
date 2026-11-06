/*
# Admin emails to users

1. Purpose
   Admins can write a plain-text email (subject, body) to one, several or all
   users from Dashboard > Send emails. A user who asks to stop receiving these
   emails is switched off in Manage Users and no longer appears as a recipient.

2. Changes
   - `public.pmc_users.emails_enabled` (boolean, not null, default true).
     Every existing and new account starts with emails on.
     The existing BEFORE UPDATE guard `protect_pmc_users_billing()` already
     refuses any change by a regular user to fields other than `name`, so a
     user cannot switch this back on after an admin switched it off. The guard
     is not changed.
   - `public.admin_set_emails_enabled(uuid, boolean)`: lets an admin switch the
     flag for any user. SECURITY DEFINER; refuses anyone not in `app_admins`
     (via `public.is_app_admin()`). Same pattern as `admin_set_power_user`.
   - `public.admin_email_sends`: one row per send (who sent it, subject, body,
     recipients, how many went out, failures). Written only by the
     `admin-send-emails` server function (service role). Admins may read it.

3. Security
   - No policy on `pmc_users` is added or loosened.
   - `admin_email_sends` has RLS on; the only policy is SELECT for admins.
     No insert/update/delete policy: browsers cannot write to it.
   - Execute on the new function is granted to `authenticated` only; the
     function itself checks for an admin.

4. Idempotency
   Safe to run more than once.
*/

ALTER TABLE public.pmc_users
  ADD COLUMN IF NOT EXISTS emails_enabled boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.admin_set_emails_enabled(p_user_id uuid, p_enabled boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_app_admin() then
    raise exception 'Only an admin can change the email setting';
  end if;

  update public.pmc_users set emails_enabled = p_enabled where id = p_user_id;
  if not found then
    raise exception 'User not found';
  end if;

  return p_enabled;
end;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_emails_enabled(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_emails_enabled(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_emails_enabled(uuid, boolean) TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_by text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  failures jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.admin_email_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_email_sends_select_admin ON public.admin_email_sends;
CREATE POLICY admin_email_sends_select_admin
  ON public.admin_email_sends
  FOR SELECT
  TO authenticated
  USING (public.is_app_admin());

REVOKE ALL ON public.admin_email_sends FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.admin_email_sends FROM authenticated;
GRANT SELECT ON public.admin_email_sends TO authenticated;