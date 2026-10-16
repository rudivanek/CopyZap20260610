-- Page fetch and brand-voice functions check access with user_has_access().
-- Prepaid accounts must be checked against their prepaid balance, not the monthly plan dates.
CREATE OR REPLACE FUNCTION public.user_has_access(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
v_mode text;
v_start date;
v_until date;
v_allowed integer;
v_grace integer;
v_day integer;
v_today date := (now() at time zone 'utc')::date;
v_period_start date;
v_used bigint;
v_prepaid json;
begin
select enforcement_mode, start_date, until_date, coalesce(credits_allowed, 0),
coalesce(credits_grace_units, 0), coalesce(credits_period_start_day, 1)
into v_mode, v_start, v_until, v_allowed, v_grace, v_day
from public.pmc_users
where id = p_user_id;

if not found then return false; end if;

-- PREPAID accounts: only the prepaid balance counts (no dates, no monthly plan).
if v_mode = 'prepaid' then
v_prepaid := public.get_prepaid_balance(p_user_id);
return coalesce((v_prepaid->>'credits_remaining')::numeric, 0) > 0;
end if;

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
$function$;
