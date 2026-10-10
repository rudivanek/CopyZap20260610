/*
# Add get_user_credits_used_since RPC

1. New function
- public.get_user_credits_used_since(p_user_id uuid, p_since timestamptz)
  returns bigint. STABLE, SECURITY DEFINER, search_path locked to public.
  Sums billable_units from pmc_user_tokens_used for the given user since
  the given timestamp. Coalesces to 0 when there are no rows.

2. Security
- REVOKE all from public, anon, and authenticated so no browser-facing
  role can call it.
- GRANT execute only to service_role. The function is intended for
  server-side (edge function / service role) credit calculations, not
  direct client use.
*/

create or replace function public.get_user_credits_used_since(p_user_id uuid, p_since timestamptz)
returns bigint
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select coalesce(sum(billable_units), 0)::bigint
  from public.pmc_user_tokens_used
  where user_id = p_user_id and created_at >= p_since;
$fn$;

revoke all on function public.get_user_credits_used_since(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.get_user_credits_used_since(uuid, timestamptz) to service_role;
