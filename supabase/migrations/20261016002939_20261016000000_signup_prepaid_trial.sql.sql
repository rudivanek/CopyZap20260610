/*
# Launch: new sign-ups start on prepaid credits with a trial grant (size set in app_settings)

1. Purpose
   With the paywall live, a new account no longer gets a monthly allowance.
   It starts in enforcement_mode 'prepaid' with one trial grant valid for
   30 days, and buys credit packs after that. The trial size is the setting
   app_settings.trial_credits (1000 at launch, to match the homepage; to be
   lowered to 250 when the new homepage with pricing goes live). It can be
   changed with a plain UPDATE, no code change.

2. Changes
   - `public.handle_new_user()`: the new row gets enforcement_mode 'prepaid'
     and credits_allowed = the trial size (the welcome email and the admin
     sign-up notice show this number), and one 'trial' grant of that size for
     30 days is added, once per account.
   - `public.app_settings`: new key `trial_credits` = '1000'.
   - `public.credit_plans`, row `free_trial_30d`: note brought in line.

3. What is NOT changed
   - Existing accounts: the ON CONFLICT branch is unchanged, so an existing
     row keeps its mode and credits.

4. Idempotency
   CREATE OR REPLACE, and an UPDATE with fixed values. The trial grant is only
   added when the account has no trial grant yet.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
v_trial_plan_id uuid;
v_start_date date;
v_until_date date;
v_period_start_day integer;
v_mode text;
v_trial integer;
BEGIN
v_trial := COALESCE((SELECT NULLIF(value, '')::integer FROM public.app_settings WHERE key = 'trial_credits'), 250);

SELECT id INTO v_trial_plan_id
FROM public.credit_plans
WHERE plan_key = 'free_trial_30d' AND is_active = true
LIMIT 1;

v_start_date := CURRENT_DATE;
v_until_date := CURRENT_DATE + INTERVAL '30 days';
v_period_start_day := LEAST(EXTRACT(DAY FROM CURRENT_DATE)::integer, 28);

INSERT INTO public.pmc_users (
id,
email,
name,
credit_plan_id,
credit_plan_applied_at,
start_date,
until_date,
credits_allowed,
credits_period_start_day,
credits_rollover_enabled,
credits_grace_units,
enforcement_mode
)
VALUES (
NEW.id,
NEW.email,
COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
v_trial_plan_id,
now(),
v_start_date,
v_until_date,
v_trial,
v_period_start_day,
false,
0,
'prepaid'
)
ON CONFLICT (id) DO UPDATE SET
email = EXCLUDED.email,
name = COALESCE(EXCLUDED.name, pmc_users.name),
credit_plan_id = CASE
WHEN pmc_users.credits_allowed = 0 OR pmc_users.credits_allowed IS NULL
THEN EXCLUDED.credit_plan_id
ELSE pmc_users.credit_plan_id
END,
credit_plan_applied_at = CASE
WHEN pmc_users.credits_allowed = 0 OR pmc_users.credits_allowed IS NULL
THEN EXCLUDED.credit_plan_applied_at
ELSE pmc_users.credit_plan_applied_at
END,
start_date = CASE
WHEN pmc_users.credits_allowed = 0 OR pmc_users.credits_allowed IS NULL
THEN EXCLUDED.start_date
ELSE pmc_users.start_date
END,
until_date = CASE
WHEN pmc_users.credits_allowed = 0 OR pmc_users.credits_allowed IS NULL
THEN EXCLUDED.until_date
ELSE pmc_users.until_date
END,
credits_allowed = CASE
WHEN pmc_users.credits_allowed = 0 OR pmc_users.credits_allowed IS NULL
THEN EXCLUDED.credits_allowed
ELSE pmc_users.credits_allowed
END,
enforcement_mode = CASE
WHEN pmc_users.credits_allowed = 0 OR pmc_users.credits_allowed IS NULL
THEN EXCLUDED.enforcement_mode
ELSE pmc_users.enforcement_mode
END;

-- The trial grant: only for accounts on prepaid credits, and only once.
SELECT enforcement_mode INTO v_mode FROM public.pmc_users WHERE id = NEW.id;
IF v_mode = 'prepaid' AND v_trial > 0 AND NOT EXISTS (
  SELECT 1 FROM public.credit_grants WHERE user_id = NEW.id AND source = 'trial'
) THEN
  INSERT INTO public.credit_grants (user_id, source, credits, remaining, expires_at, note)
  VALUES (NEW.id, 'trial', v_trial, v_trial, now() + interval '30 days', 'sign-up trial');
END IF;

RETURN NEW;
END;
$function$;

INSERT INTO public.app_settings (key, value, updated_at, updated_by)
VALUES ('trial_credits', '1000', now(), 'migration')
ON CONFLICT (key) DO NOTHING;

UPDATE public.credit_plans
SET notes = 'Automatically assigned to all new signups. Prepaid trial credits (app_settings.trial_credits) valid for 30 days from signup date.',
    updated_at = now()
WHERE plan_key = 'free_trial_30d';