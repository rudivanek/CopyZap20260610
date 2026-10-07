/*
# Power user flag

1. Purpose
   CopyZap has two interfaces on one engine: Quick (simple, for customers) and
   Complete (Copy Maker, Dashboard and the rest). This flag decides which one a
   user sees. `power_user = true`: everything, as before. `power_user = false`:
   Quick only; the app sends such a user to /quick from every Complete page.
   Admins always see everything, whatever the flag says.

2. Changes
   - `public.pmc_users.power_user` (boolean, not null, default false).
     New accounts start as Quick-only.
   - Every account that exists when this migration first runs is set to true,
     so nothing changes for the people who already use the app.
   - `public.protect_pmc_users_billing()` (the BEFORE UPDATE guard on
     `pmc_users`) also protects `power_user`: a regular user can update their
     own row, and without this they could switch the flag on for themselves.
     Admins and the service role may change it, as with the billing fields.
     The rest of the function is unchanged.
   - `public.admin_set_power_user(uuid, boolean)`: lets an admin set the flag
     for any user. Needed because the update policy on `pmc_users` only lets a
     user update their own row. SECURITY DEFINER; refuses anyone who is not in
     `app_admins` (via the existing `public.is_app_admin()`).

3. Security
   - No policy is added or loosened.
   - Execute on the new function is granted to `authenticated` only; the
     function itself checks for an admin.

4. Idempotency
   Safe to run more than once: the column is added and existing accounts are
   set to true only when the column does not exist yet; both functions use
   CREATE OR REPLACE.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_users' AND column_name = 'power_user'
  ) THEN
    ALTER TABLE public.pmc_users ADD COLUMN power_user boolean NOT NULL DEFAULT false;
    -- Everyone who already has an account keeps the full interface.
    UPDATE public.pmc_users SET power_user = true;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.protect_pmc_users_billing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Service role (auth.uid() null) and admins may change billing fields and the
  -- power-user flag; regular users may not.
  if auth.uid() is not null and not is_app_admin() then
    if new.credits_allowed       is distinct from old.credits_allowed
    or new.until_date            is distinct from old.until_date
    or new.start_date            is distinct from old.start_date
    or new.credits_grace_units   is distinct from old.credits_grace_units
    or new.credits_period_start_day is distinct from old.credits_period_start_day then
      raise exception 'Not allowed to modify billing or subscription fields';
    end if;
    if new.power_user is distinct from old.power_user then
      raise exception 'Not allowed to change the power-user setting';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_power_user(p_user_id uuid, p_power_user boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_app_admin() then
    raise exception 'Only an admin can change the power-user setting';
  end if;

  update public.pmc_users set power_user = p_power_user where id = p_user_id;
  if not found then
    raise exception 'User not found';
  end if;

  return p_power_user;
end;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_power_user(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_power_user(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_power_user(uuid, boolean) TO authenticated;
