-- Each credit pack has its own validity: Starter 3, Agency 6, Studio 9 months.
-- A new purchase never shortens credits already bought: all active bought credits
-- move to the later of their current expiry and the new pack's expiry.

alter table public.credit_packs add column if not exists validity_months integer not null default 12;
alter table public.credit_packs drop constraint if exists credit_packs_validity_months_check;
alter table public.credit_packs add constraint credit_packs_validity_months_check check (validity_months between 1 and 36);

update public.credit_packs set validity_months = 3 where pack_key = 'starter';
update public.credit_packs set validity_months = 6 where pack_key = 'agency';
update public.credit_packs set validity_months = 9 where pack_key = 'studio';

create or replace function public.grant_purchased_credits(
  p_user_id uuid, p_pack_key text, p_session_id text, p_payment_intent_id text,
  p_amount_total integer, p_currency text, p_livemode boolean
) returns boolean
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_credits integer;
  v_months integer;
  v_expiry timestamptz;
  v_id uuid;
begin
  select credits, validity_months into v_credits, v_months from public.credit_packs where pack_key = p_pack_key;
  if v_credits is null then raise exception 'Unknown pack %', p_pack_key; end if;
  v_expiry := now() + make_interval(months => v_months);

  -- Keep the later date if this user already holds bought credits that run longer.
  select greatest(v_expiry, coalesce(max(expires_at), v_expiry)) into v_expiry
  from public.credit_grants
  where user_id = p_user_id and source = 'purchase' and remaining > 0 and expires_at > now();

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