-- Grace period: bought credits that expired less than 15 days ago come back when the
-- user buys again, and move to the new expiry date together with the new pack.
-- Trial and bonus credits are never revived. A new purchase still never shortens
-- credits that are valid longer.

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

  -- Move all bought credits that are still valid, or expired less than 15 days ago, to the new date.
  update public.credit_grants set expires_at = v_expiry
  where user_id = p_user_id and source = 'purchase' and remaining > 0
    and expires_at > now() - interval '15 days' and id <> v_id;

  return true;
end;
$$;
revoke all on function public.grant_purchased_credits(uuid, text, text, text, integer, text, boolean) from public, anon, authenticated;
grant execute on function public.grant_purchased_credits(uuid, text, text, text, integer, text, boolean) to service_role;