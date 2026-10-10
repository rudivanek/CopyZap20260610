/*
# Replace get_user_credits_balance RPC

1. New Functions
- `get_user_credits_balance(user_id_param uuid) RETURNS json`
  - SECURITY DEFINER, search_path locked to 'public'
  - Returns credits_allowed, credits_used (in current billing period),
    and credits_remaining for the given user.
  - Rejects anon role and prevents one signed-in user from reading
    another user's balance.
  - Uses the existing `get_user_credits_used_since` RPC and the same
    rolling billing period anchored to `credits_period_start_day`.
2. Security
  - REVOKE all from public, anon.
  - GRANT execute to authenticated, service_role.
*/

create or replace function public.get_user_credits_balance(user_id_param uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_allowed integer;
  v_day integer;
  v_today date := (now() at time zone 'utc')::date;
  v_period_start date;
  v_used bigint;
begin
  -- Not available without login.
  if coalesce(auth.role(), '') = 'anon' then
    raise exception 'Unauthorized';
  end if;
  -- A signed-in user may only read their own balance.
  if auth.uid() is not null and auth.uid() != user_id_param then
    raise exception 'Unauthorized: can only query own credits balance';
  end if;
  select credits_allowed, coalesce(credits_period_start_day, 1)
    into v_allowed, v_day
  from public.pmc_users
  where id = user_id_param;
  if v_allowed is null then
    return json_build_object('credits_allowed', 0, 'credits_used', 0, 'credits_remaining', 0);
  end if;
  -- Same period as the limit enforced by the server: it starts on the
  -- account's reset day in the current month, or in the previous month
  -- when that day has not come yet.
  v_period_start := make_date(extract(year from v_today)::int, extract(month from v_today)::int, v_day);
  if extract(day from v_today)::int < v_day then
    v_period_start := (v_period_start - interval '1 month')::date;
  end if;
  v_used := public.get_user_credits_used_since(user_id_param, (v_period_start::timestamp at time zone 'UTC'));
  return json_build_object(
    'credits_allowed', v_allowed,
    'credits_used', v_used,
    'credits_remaining', greatest(0, v_allowed - v_used)
  );
end;
$fn$;
revoke all on function public.get_user_credits_balance(uuid) from public, anon;
grant execute on function public.get_user_credits_balance(uuid) to authenticated, service_role;
