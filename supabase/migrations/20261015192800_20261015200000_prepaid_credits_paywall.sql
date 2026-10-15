-- Prepaid credits paywall (Stripe).
-- Additive and safe to run more than once. Existing users keep enforcement_mode 'credits'
-- and are not affected; only accounts switched to 'prepaid' use credit grants.

-- 1. Allow the new mode and the tester flag ------------------------------------------
alter table public.pmc_users drop constraint if exists pmc_users_enforcement_mode_check;
alter table public.pmc_users add constraint pmc_users_enforcement_mode_check
  check (enforcement_mode = any (array['credits','tokens','prepaid']));

alter table public.pmc_users add column if not exists paywall_access boolean not null default false;

-- 2. Packs on sale (single source of truth for credits and Stripe price IDs) ----------
create table if not exists public.credit_packs (
  pack_key text primary key,
  pack_name text not null,
  credits integer not null check (credits > 0),
  usd_cents integer not null,
  mxn_cents integer not null,
  stripe_price_id_test text,
  stripe_price_id_live text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now()
);
alter table public.credit_packs enable row level security;
drop policy if exists "credit_packs readable" on public.credit_packs;
create policy "credit_packs readable" on public.credit_packs for select using (is_active);

insert into public.credit_packs (pack_key, pack_name, credits, usd_cents, mxn_cents, sort_order) values
  ('starter', 'Starter', 1000,  3900,  74900, 10),
  ('agency',  'Agency',  3000,  9900, 189900, 20),
  ('studio',  'Studio',  8000, 24900, 474900, 30)
on conflict (pack_key) do nothing;

-- 3. Credit grants: every trial, purchase, bonus or admin top-up with its own expiry -----
create table if not exists public.credit_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('trial','purchase','bonus','admin')),
  credits integer not null check (credits > 0),
  remaining integer not null check (remaining >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  pack_key text references public.credit_packs(pack_key),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_total integer,
  currency text,
  livemode boolean,
  note text
);
create index if not exists credit_grants_user_active_idx on public.credit_grants (user_id, expires_at) where remaining > 0;
alter table public.credit_grants enable row level security;
drop policy if exists "credit_grants own rows" on public.credit_grants;
create policy "credit_grants own rows" on public.credit_grants for select using (auth.uid() = user_id or public.is_app_admin());
-- No insert/update/delete policies: only server-side functions change grants.

-- 4. Stripe events already handled (webhook idempotency) ------------------------------
create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- 5. Balance of a prepaid account ---------------------------------------------------
create or replace function public.get_prepaid_balance(p_user_id uuid)
returns json
language sql stable security definer
set search_path to 'public'
as $$
  select json_build_object(
    'credits_remaining', coalesce(sum(remaining), 0),
    'credits_granted',   coalesce(sum(credits), 0),
    'next_expiry',       min(expires_at),
    'purchase_expiry',   max(expires_at) filter (where source = 'purchase')
  )
  from public.credit_grants
  where user_id = p_user_id and remaining > 0 and expires_at > now();
$$;
revoke all on function public.get_prepaid_balance(uuid) from public, anon, authenticated;
grant execute on function public.get_prepaid_balance(uuid) to service_role;

-- 6. Deduct usage from grants: trial, bonus, admin first, then purchases; soonest expiry first
create or replace function public.deduct_prepaid_credits()
returns trigger
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_left integer := coalesce(new.billable_units, 0);
  g record;
  v_take integer;
begin
  if v_left <= 0 then return new; end if;
  if not exists (select 1 from public.pmc_users where id = new.user_id and enforcement_mode = 'prepaid') then
    return new;
  end if;
  for g in
    select id, remaining from public.credit_grants
    where user_id = new.user_id and remaining > 0 and expires_at > now()
    order by case source when 'trial' then 0 when 'bonus' then 1 when 'admin' then 2 else 3 end,
             expires_at, created_at
    for update
  loop
    v_take := least(v_left, g.remaining);
    update public.credit_grants set remaining = remaining - v_take where id = g.id;
    v_left := v_left - v_take;
    exit when v_left <= 0;
  end loop;
  -- Anything still left over is absorbed: the call already ran, and the next call is refused.
  return new;
end;
$$;

drop trigger if exists trg_deduct_prepaid_credits on public.pmc_user_tokens_used;
create trigger trg_deduct_prepaid_credits
  after insert on public.pmc_user_tokens_used
  for each row execute function public.deduct_prepaid_credits();

-- 7. Add purchased credits (called only by the stripe-webhook function) -----------------
-- Returns true when credits were added, false when this checkout was already handled.
-- Every purchase moves the expiry of all purchased credits to 12 months from now.
create or replace function public.grant_purchased_credits(
  p_user_id uuid, p_pack_key text, p_session_id text, p_payment_intent_id text,
  p_amount_total integer, p_currency text, p_livemode boolean
) returns boolean
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_credits integer;
  v_expiry timestamptz := now() + interval '12 months';
  v_id uuid;
begin
  select credits into v_credits from public.credit_packs where pack_key = p_pack_key;
  if v_credits is null then raise exception 'Unknown pack %', p_pack_key; end if;

  insert into public.credit_grants (user_id, source, credits, remaining, expires_at, pack_key,
    stripe_checkout_session_id, stripe_payment_intent_id, amount_total, currency, livemode)
  values (p_user_id, 'purchase', v_credits, v_credits, v_expiry, p_pack_key,
    p_session_id, p_payment_intent_id, p_amount_total, p_currency, p_livemode)
  on conflict (stripe_checkout_session_id) do nothing
  returning id into v_id;

  if v_id is null then return false; end if;

  update public.credit_grants set expires_at = v_expiry
  where user_id = p_user_id and source = 'purchase' and remaining > 0 and expires_at > now() and id <> v_id;

  return true;
end;
$$;
revoke all on function public.grant_purchased_credits(uuid, text, text, text, integer, text, boolean) from public, anon, authenticated;
grant execute on function public.grant_purchased_credits(uuid, text, text, text, integer, text, boolean) to service_role;

-- 8. Admin: switch an account to prepaid (with an optional starting grant) -----------------------------------------------------------------------------
create or replace function public.admin_set_prepaid(p_user_id uuid, p_trial_credits integer default 250, p_paywall_access boolean default true)
returns json
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not public.is_app_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only an admin can do this';
  end if;
  update public.pmc_users set enforcement_mode = 'prepaid', paywall_access = p_paywall_access where id = p_user_id;
  if not found then raise exception 'User not found'; end if;
  if coalesce(p_trial_credits, 0) > 0 then
    insert into public.credit_grants (user_id, source, credits, remaining, expires_at, note)
    values (p_user_id, 'trial', p_trial_credits, p_trial_credits, now() + interval '30 days', 'set by admin');
  end if;
  return public.get_prepaid_balance(p_user_id);
end;
$$;
revoke all on function public.admin_set_prepaid(uuid, integer, boolean) from public, anon;
grant execute on function public.admin_set_prepaid(uuid, integer, boolean) to authenticated, service_role;

-- 9. The app's balance call: same as before for 'credits' accounts, grants for 'prepaid' --
create or replace function public.get_user_credits_balance(user_id_param uuid)
returns json
language plpgsql security definer
set search_path to 'public'
as $function$
declare
v_allowed integer;
v_day integer;
v_mode text;
v_today date := (now() at time zone 'utc')::date;
v_period_start date;
v_used bigint;
v_prepaid json;
begin
-- Not available without login.
if coalesce(auth.role(), '') = 'anon' then
raise exception 'Unauthorized';
end if;
-- A signed-in user may only read their own balance.
if auth.uid() is not null and auth.uid() != user_id_param then
raise exception 'Unauthorized: can only query own credits balance';
end if;
select credits_allowed, coalesce(credits_period_start_day, 1), enforcement_mode
into v_allowed, v_day, v_mode
from public.pmc_users
where id = user_id_param;
if v_mode = 'prepaid' then
v_prepaid := public.get_prepaid_balance(user_id_param);
return json_build_object(
'mode', 'prepaid',
'credits_allowed', (v_prepaid->>'credits_granted')::int,
'credits_used', (v_prepaid->>'credits_granted')::int - (v_prepaid->>'credits_remaining')::int,
'credits_remaining', (v_prepaid->>'credits_remaining')::int,
'next_expiry', v_prepaid->'next_expiry',
'purchase_expiry', v_prepaid->'purchase_expiry'
);
end if;
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
$function$;

-- 10. Who may see the Buy page: app setting 'paywall_public' = 'true', admins, or testers --
insert into public.app_settings (key, value, updated_at, updated_by)
values ('paywall_public', 'false', now(), 'migration')
on conflict (key) do nothing;

create or replace function public.can_use_paywall()
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select coalesce((select value = 'true' from public.app_settings where key = 'paywall_public'), false)
      or public.is_app_admin()
      or coalesce((select paywall_access from public.pmc_users where id = auth.uid()), false);
$$;
grant execute on function public.can_use_paywall() to authenticated;
