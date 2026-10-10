/*
# Add user_has_access RPC function

1. New Functions
- `user_has_access(p_user_id uuid) RETURNS boolean`
  - STABLE, SECURITY DEFINER, search_path locked to 'public'
  - Checks whether a user currently has access: subscription not expired,
    credits_allowed > 0, and credits used in the current billing period
    (plus grace) have not exhausted the allowance.
  - Uses the existing `get_user_credits_used_since` RPC to compute usage
    over the rolling billing period anchored to `credits_period_start_day`.
2. Security
  - REVOKE all from public, anon, authenticated.
  - GRANT execute only to service_role.
*/

create or replace function public.user_has_access(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
declare
  v_start date;
  v_until date;
  v_allowed integer;
  v_grace integer;
  v_day integer;
  v_today date := (now() at time zone 'utc')::date;
  v_period_start date;
  v_used bigint;
begin
  select start_date, until_date, coalesce(credits_allowed, 0),
         coalesce(credits_grace_units, 0), coalesce(credits_period_start_day, 1)
    into v_start, v_until, v_allowed, v_grace, v_day
  from public.pmc_users
  where id = p_user_id;

  if not found then return false; end if;
  if v_start is not null and v_today < v_start then return false; end if;
  if v_until is not null and v_today > v_until then return false; end if;
  if v_allowed = 0 then return false; end if;

  v_period_start := make_date(extract(year from v_today)::int, extract(month from v_today)::int, v_day);
  if extract(day from v_today)::int < v_day then
    v_period_start := (v_period_start - interval '1 month')::date;
  end if;

  v_used := public.get_user_credits_used_since(p_user_id, (v_period_start::timestamp at time zone 'UTC'));
  return (v_allowed - v_used + v_grace) > 0;
end;
$fn$;

revoke all on function public.user_has_access(uuid) from public, anon, authenticated;
grant execute on function public.user_has_access(uuid) to service_role;
