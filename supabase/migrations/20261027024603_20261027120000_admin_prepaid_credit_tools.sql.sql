/*
# Admin prepaid credit management tools

1. Overview
This migration adds admin-only SQL functions for managing prepaid credit
grants, and tightens the existing `get_prepaid_balance` RPC so only the
owner, an admin, or the service role can read a user's balance.

2. New / changed functions
- `get_prepaid_balance(p_user_id uuid)` — rewritten as plpgsql, SECURITY
  DEFINER. Returns the live prepaid balance json (credits_remaining,
  credits_granted, next_expiry, purchase_expiry) ONLY when the caller is
  the service role, an app admin (`is_app_admin()`), or the user
  themselves (`auth.uid() = p_user_id`). Otherwise raises 'Unauthorized'.
- `admin_add_credits(p_user_id, p_pack_key, p_credits, p_expires_at, p_note)`
  — SECURITY DEFINER, admin-only. Either uses a credit pack (reads
  `credit_packs.credits` and `validity_months`, computes expiry with
  `make_interval(months => v_months)`) or accepts a custom credits +
  expiry. Always inserts with `source = 'bonus'` (never 'purchase').
  Returns the user's updated prepaid balance json.
- `admin_list_grants(p_user_id uuid)` — SECURITY DEFINER, admin-only.
  Returns all credit grants for one user, newest first.
- `admin_prepaid_balances()` — SECURITY DEFINER, admin-only. Returns one
  row per user that currently has live grants (remaining > 0 and not
  expired): user_id, credits_remaining, credits_granted, next_expiry.
- `admin_zero_grant(p_grant_id uuid, p_note text)` — SECURITY DEFINER,
  admin-only. Sets `remaining = 0` on a grant and appends a "Zeroed by
  admin" note. Never deletes rows.

3. Security
- All four admin_* functions are gated by `is_app_admin()` first, then
  raise 'Only an admin can do this' otherwise.
- All column references inside RETURNS TABLE bodies are aliased (`g.`)
  to avoid ambiguous-column collisions with output column names.
- `get_prepaid_balance` REVOKE FROM public/anon/authenticated; EXECUTE
  granted to service_role only. Authenticated callers still reach it
  through the existing SECURITY DEFINER wrappers
  (`get_user_credits_balance`, `user_has_access`, `report_branding_active`,
  `admin_add_credits`, `admin_set_prepaid`) which call it internally
  after their own auth checks, or pass auth.uid() = p_user_id.
- The four admin_* functions: REVOKE FROM public/anon; GRANT EXECUTE TO
  authenticated + service_role (the app's admin client uses the
  authenticated role with a valid JWT).

4. No data changes
- No rows inserted, updated, or deleted.
- No existing user is moved to enforcement_mode = 'prepaid'.
- No RLS policies changed.
- `credit_grants` and `credit_packs` tables already exist.
*/

-- 0. Tighten get_prepaid_balance: owner / admin / service_role only. -----------------
create or replace function public.get_prepaid_balance(p_user_id uuid)
returns json
language plpgsql stable security definer
set search_path to 'public'
as $$
begin
  if coalesce(auth.role(), '') = 'service_role'
     or public.is_app_admin()
     or (auth.uid() is not null and auth.uid() = p_user_id) then
    return (
      select json_build_object(
        'credits_remaining', coalesce(sum(g.remaining), 0),
        'credits_granted',   coalesce(sum(g.credits), 0),
        'next_expiry',       min(g.expires_at),
        'purchase_expiry',   max(g.expires_at) filter (where g.source = 'purchase')
      )
      from public.credit_grants g
      where g.user_id = p_user_id and g.remaining > 0 and g.expires_at > now()
    );
  end if;
  raise exception 'Unauthorized';
end;
$$;
revoke all on function public.get_prepaid_balance(uuid) from public, anon, authenticated;
grant execute on function public.get_prepaid_balance(uuid) to service_role;

-- 1. admin_add_credits ---------------------------------------------------------------
create or replace function public.admin_add_credits(
  p_user_id uuid,
  p_pack_key text,
  p_credits integer,
  p_expires_at timestamptz,
  p_note text
) returns json
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_credits integer;
  v_months integer;
  v_expiry timestamptz;
  v_pack text;
  v_note text;
begin
  if not public.is_app_admin() then
    raise exception 'Only an admin can do this';
  end if;

  if p_pack_key is not null and p_pack_key <> '' then
    select c.credits, c.validity_months into v_credits, v_months
    from public.credit_packs c
    where c.pack_key = p_pack_key and c.is_active;
    if v_credits is null then
      raise exception 'Unknown or inactive pack %', p_pack_key;
    end if;
    v_expiry := now() + make_interval(months => v_months);
    v_pack := p_pack_key;
  else
    v_credits := p_credits;
    v_expiry := p_expires_at;
    if v_credits is null or v_credits <= 0 then
      raise exception 'credits must be a positive number';
    end if;
    if v_expiry is null or v_expiry <= now() then
      raise exception 'expires_at must be a future date';
    end if;
  end if;

  v_note := concat('Added by admin', case when p_note is not null and p_note <> '' then ': ' || p_note else '' end);

  insert into public.credit_grants
    (user_id, source, credits, remaining, expires_at, pack_key, note)
  values
    (p_user_id, 'bonus', v_credits, v_credits, v_expiry, v_pack, v_note);

  return public.get_prepaid_balance(p_user_id);
end;
$$;
revoke all on function public.admin_add_credits(uuid, text, integer, timestamptz, text) from public, anon;
grant execute on function public.admin_add_credits(uuid, text, integer, timestamptz, text) to authenticated, service_role;

-- 2. admin_list_grants ---------------------------------------------------------------
create or replace function public.admin_list_grants(p_user_id uuid)
returns table (
  id uuid, source text, credits integer, remaining integer,
  expires_at timestamptz, created_at timestamptz, pack_key text, note text
)
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Only an admin can do this';
  end if;
  return query
    select g.id, g.source, g.credits, g.remaining, g.expires_at, g.created_at, g.pack_key, g.note
    from public.credit_grants g
    where g.user_id = p_user_id
    order by g.created_at desc;
end;
$$;
revoke all on function public.admin_list_grants(uuid) from public, anon;
grant execute on function public.admin_list_grants(uuid) to authenticated, service_role;

-- 3. admin_prepaid_balances ----------------------------------------------------------
create or replace function public.admin_prepaid_balances()
returns table (
  user_id uuid, credits_remaining bigint, credits_granted bigint, next_expiry timestamptz
)
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not public.is_app_admin() then
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

-- 4. admin_zero_grant ----------------------------------------------------------------
create or replace function public.admin_zero_grant(p_grant_id uuid, p_note text)
returns json
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_old_note text;
  v_new_note text;
begin
  if not public.is_app_admin() then
    raise exception 'Only an admin can do this';
  end if;

  select g.note into v_old_note from public.credit_grants g where g.id = p_grant_id;
  if not found then
    raise exception 'Grant not found';
  end if;

  v_new_note := concat(
    coalesce(v_old_note, ''),
    case when v_old_note is not null and v_old_note <> '' then ' | ' else '' end,
    'Zeroed by admin',
    case when p_note is not null and p_note <> '' then ': ' || p_note else '' end
  );

  update public.credit_grants
  set remaining = 0, note = v_new_note
  where id = p_grant_id;

  return json_build_object('ok', true, 'grant_id', p_grant_id);
end;
$$;
revoke all on function public.admin_zero_grant(uuid, text) from public, anon;
grant execute on function public.admin_zero_grant(uuid, text) to authenticated, service_role;
