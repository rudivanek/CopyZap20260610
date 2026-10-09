/*
# Lockdown: customer list, page cache, and account billing fields

1. Customer list (pmc_customers)
- Replaces the permissive "Users can select all customers" policy with an
  owner-scoped SELECT policy. Only the owning authenticated user can read
  their own customer rows. Admins and the service role are unaffected.
- No changes to INSERT/UPDATE/DELETE policies on this table.

2. Page cache (pmc_url_analysis_cache)
- Drops the three existing browser-facing policies:
  - "Authenticated users can read URL analysis cache"
  - "Authenticated users can insert URL analysis"
  - "Authenticated users can update URL analysis access tracking"
- No replacement policies are added. The table now has no direct browser
  access; only the analyze-url edge function (using the service role,
  which bypasses RLS) reads and writes it.

3. Account record (pmc_users)
- Creates (or replaces) the SECURITY DEFINER trigger function
  protect_pmc_users_billing() that blocks a regular signed-in user from
  changing any column other than `name`. Specifically guards the billing
  and subscription fields (credits_allowed, until_date, start_date,
  credits_grace_units, credits_period_start_day), the power_user flag,
  and any other account field.
- Admins (is_app_admin()) and the service role (auth.uid() IS NULL) are
  left unchanged.
- The existing trigger protect_pmc_users_billing_trg is NOT dropped or
  recreated; it already exists and is enabled. Only the function body is
  replaced via CREATE OR REPLACE FUNCTION.

4. Security
- Tightens RLS on pmc_customers SELECT (owner-only).
- Removes direct browser access to pmc_url_analysis_cache.
- Enforces server-side protection of billing/account fields on pmc_users
  via a SECURITY DEFINER trigger function with a locked search_path.
*/

-- 1. Customer list: readable only by its owner (was: readable by everyone,
--    including visitors who are not signed in).
drop policy if exists "Users can select all customers" on public.pmc_customers;
create policy "Users can read own customers" on public.pmc_customers
  for select to authenticated
  using (user_id = (select auth.uid()));

-- 2. Page cache: no direct access from the browser. Only the analyze-url
--    edge function uses it, with the service role.
drop policy if exists "Authenticated users can read URL analysis cache" on public.pmc_url_analysis_cache;
drop policy if exists "Authenticated users can insert URL analysis" on public.pmc_url_analysis_cache;
drop policy if exists "Authenticated users can update URL analysis access tracking" on public.pmc_url_analysis_cache;

-- 3. Account record: a regular signed-in user may change only their own
--    name. Admins and the service role are unchanged.
create or replace function public.protect_pmc_users_billing()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  if auth.uid() is not null and not is_app_admin() then
    if new.credits_allowed          is distinct from old.credits_allowed
    or new.until_date               is distinct from old.until_date
    or new.start_date               is distinct from old.start_date
    or new.credits_grace_units      is distinct from old.credits_grace_units
    or new.credits_period_start_day is distinct from old.credits_period_start_day then
      raise exception 'Not allowed to modify billing or subscription fields';
    end if;
    if new.power_user is distinct from old.power_user then
      raise exception 'Not allowed to change the power-user setting';
    end if;
    if (to_jsonb(new) - 'name') is distinct from (to_jsonb(old) - 'name') then
      raise exception 'Not allowed to modify account fields other than name';
    end if;
  end if;
  return new;
end;
$fn$;
