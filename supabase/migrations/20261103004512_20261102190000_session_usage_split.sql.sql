create or replace function public.get_my_session_usage(p_session_ids uuid[])
returns table(session_id uuid, brief_credits integer, run_credits integer, brief_usd numeric, run_usd numeric)
language sql
stable
set search_path to 'public'
as $$
with mine as (
  select u.session_id, u.billable_units, u.cost_usd, u.created_at, u.operation_type
  from public.pmc_user_tokens_used u
  where u.session_id = any (p_session_ids)
    and u.user_id = auth.uid()
),
cut as (
  select m.session_id, max(m.created_at) as brief_end
  from mine m
  where left(m.operation_type, 6) = 'brief_'
  group by m.session_id
)
select m.session_id,
  coalesce(sum(m.billable_units) filter (where c.brief_end is not null and m.created_at <= c.brief_end), 0)::integer,
  coalesce(sum(m.billable_units) filter (where c.brief_end is null or m.created_at > c.brief_end), 0)::integer,
  case when public.is_app_admin() then coalesce(sum(m.cost_usd) filter (where c.brief_end is not null and m.created_at <= c.brief_end), 0) end,
  case when public.is_app_admin() then coalesce(sum(m.cost_usd) filter (where c.brief_end is null or m.created_at > c.brief_end), 0) end
from mine m
left join cut c on c.session_id = m.session_id
group by m.session_id;
$$;

grant execute on function public.get_my_session_usage(uuid[]) to authenticated;
