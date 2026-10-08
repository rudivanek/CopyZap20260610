/*
# Free trial: 1,000 credits instead of 10,000

1. Purpose
   A new account has been given 10,000 credits for 30 days. Measured on real
   runs, one credit costs a little under one US cent in model fees, so that
   trial was worth about 80 dollars per account. It becomes 1,000 credits
   (about 8 dollars, roughly 15 pages of 1,000 words), still valid for 30 days.

2. Changes
   - `public.handle_new_user()` (the trigger function that creates the
     `pmc_users` row when someone signs up): the amount it gives is 1000
     instead of 10000. Nothing else in the function is changed.
   - `public.credit_plans`, row `free_trial_30d`: `credits_monthly` and the
     note are brought in line (1,000).

3. What is NOT changed
   - Accounts that already exist keep the credits they have.
   - The 30 days, the other plans, and every policy stay as they are.

4. Idempotency
   Safe to run more than once: CREATE OR REPLACE, and an UPDATE that sets
   fixed values.
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
BEGIN
-- Get the Free Trial plan ID
SELECT id INTO v_trial_plan_id
FROM public.credit_plans
WHERE plan_key = 'free_trial_30d' AND is_active = true
LIMIT 1;

-- Calculate trial dates (start today, end in 30 days)
v_start_date := CURRENT_DATE;
v_until_date := CURRENT_DATE + INTERVAL '30 days';

-- Use the day-of-month from signup so credits renew on the same day each month
-- Capped at 28 to handle months with fewer days
v_period_start_day := LEAST(EXTRACT(DAY FROM CURRENT_DATE)::integer, 28);

-- Insert or update pmc_users with trial plan
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
1000,
v_period_start_day,
false,
0,
'credits'
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

RETURN NEW;
END;
$function$;

UPDATE public.credit_plans
SET credits_monthly = 1000,
    notes = 'Automatically assigned to all new signups. 1,000 credits valid for 30 days from signup date.',
    updated_at = now()
WHERE plan_key = 'free_trial_30d';
