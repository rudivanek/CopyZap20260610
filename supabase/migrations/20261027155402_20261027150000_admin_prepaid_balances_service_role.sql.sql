-- Allow service_role to call admin_prepaid_balances
-- The admin-get-users edge function calls admin_prepaid_balances() with the
-- service-role client, which has no JWT so is_app_admin() returns false and
-- the function raises. Allow the call when the caller is the service role as
-- well as an app admin.

create or replace function public.admin_prepaid_balances()
returns table (
  user_id uuid, credits_remaining bigint, credits_granted bigint, next_expiry timestamptz
)
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not (public.is_app_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Only an admin can do this';
  end if;
  return query
    select g.user_id,
           coalesce(sum(g.remaining), 0)::bigint as credits_remaining,
           coalesce(sum(g.credits), 0)::bigint as credits_granted,
           min(g.expires_at) as next_expiry
    from public.credit_grants g
    where g.remaining > 0 and g.expires_at > now()
    group by g.user_id;
end;
$$;
revoke all on function public.admin_prepaid_balances() from public, anon;
grant execute on function public.admin_prepaid_balances() to authenticated, service_role;
