/*
  # Fix Credits Period: Rolling 30-Day Window from Signup Date

  ## Problem
  Credits were resetting on day 1 of each calendar month regardless of when the
  user signed up. A user who signed up on April 26 would get their credits reset
  on May 1 — only 5 days later — instead of May 26.

  ## Fix
  1. Update handle_new_user() trigger to set credits_period_start_day = day-of-month
     from signup date (e.g., signup April 26 → credits_period_start_day = 26).
  2. Fix existing user rudilein@gmail.com (start_date = 2026-04-26 → day = 26).
  3. Fix any other existing users whose credits_period_start_day = 1 but whose
     start_date is not the 1st of the month (misaligned users).

  ## Notes
  - credits_period_start_day still drives the rolling window logic in both the
    frontend (supabaseClient.ts) and the edge function (ai-completion).
  - The frontend/edge function logic already handles "if today >= periodStartDay
    reset this month, else last month" — this is correct for rolling monthly cycles.
  - This migration only fixes the seed value so it matches the actual signup day.
*/

-- ============================================================
-- STEP 1: Fix handle_new_user() to use signup day-of-month
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    10000,
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user IS
  'Auto-creates pmc_users record with Free Trial plan (10K credits, 30 days) for new signups. credits_period_start_day is set to the day-of-month of signup so credits renew on the same day each month. Idempotent - never overwrites existing paid plans.';

-- ============================================================
-- STEP 2: Fix rudilein@gmail.com (start_date 2026-04-26 → day 26)
-- ============================================================

UPDATE public.pmc_users
SET credits_period_start_day = LEAST(EXTRACT(DAY FROM start_date)::integer, 28)
WHERE email = 'rudilein@gmail.com'
  AND credits_period_start_day = 1
  AND start_date IS NOT NULL
  AND EXTRACT(DAY FROM start_date) != 1;

-- ============================================================
-- STEP 3: Fix any other misaligned users
-- (credits_period_start_day = 1 but start_date is not the 1st)
-- ============================================================

UPDATE public.pmc_users
SET credits_period_start_day = LEAST(EXTRACT(DAY FROM start_date)::integer, 28)
WHERE credits_period_start_day = 1
  AND start_date IS NOT NULL
  AND EXTRACT(DAY FROM start_date) != 1;
