/*
  # Free Trial System – 30-Day Auto-Assignment (NO BETA)

  ## Summary
  Implements automatic "Free Trial – 30 Days" plan assignment for all new signups.
  Every new user gets 10,000 credits valid for 30 days from signup.
  NO beta concepts, NO manual steps – fully automatic.

  ## Changes

  1. **Update credit_plans Table**
     - Add duration_days column (NULL = unlimited/subscription, number = trial duration)

  2. **Seed Free Trial Plan**
     - Creates "Free Trial – 30 Days" plan with 10K credits
     - Idempotent: safe to run multiple times

  3. **Auto-Assignment Trigger**
     - Updates handle_new_user() to automatically assign trial plan
     - Sets start_date = today
     - Sets until_date = today + 30 days
     - Sets credits_allowed = 10000
     - Sets enforcement_mode = 'credits'
     - Sets credits_grace_units = 0
     - IDEMPOTENT: Won't overwrite existing paid plans

  ## Important Notes
  - NEVER overwrites existing users with paid plans or higher credits
  - Trial plan is ONLY assigned if user has no plan (credits_allowed = 0 OR NULL)
  - All new signups get trial plan automatically - NO EXCEPTIONS
  - Beta system is NOT used for trials
*/

-- ============================================================
-- STEP 1: ADD duration_days TO credit_plans
-- ============================================================

DO $$
BEGIN
  -- Add duration_days column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'credit_plans'
      AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE public.credit_plans
    ADD COLUMN duration_days integer NULL;
    
    -- Add CHECK constraint
    ALTER TABLE public.credit_plans
    ADD CONSTRAINT credit_plans_duration_days_check
    CHECK (duration_days IS NULL OR duration_days > 0);
  END IF;
END $$;

COMMENT ON COLUMN public.credit_plans.duration_days IS 'Plan duration in days (NULL = unlimited/subscription, number = fixed-term trial)';

-- ============================================================
-- STEP 2: UPDATE credits_monthly CHECK CONSTRAINT
-- ============================================================

-- Drop old constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'credit_plans'
      AND constraint_name = 'credit_plans_credits_monthly_check'
  ) THEN
    ALTER TABLE public.credit_plans DROP CONSTRAINT credit_plans_credits_monthly_check;
  END IF;
END $$;

-- Add new constraint allowing 0 or positive
ALTER TABLE public.credit_plans
ADD CONSTRAINT credit_plans_credits_monthly_check
CHECK (credits_monthly >= 0);

-- ============================================================
-- STEP 3: SEED FREE TRIAL PLAN (IDEMPOTENT)
-- ============================================================

INSERT INTO public.credit_plans (
  plan_key,
  plan_name,
  credits_monthly,
  duration_days,
  is_active,
  sort_order,
  notes
)
VALUES (
  'free_trial_30d',
  'Free Trial – 30 Days',
  10000,
  30,
  true,
  1,
  'Automatically assigned to all new signups. 10,000 credits valid for 30 days from signup date.'
)
ON CONFLICT (plan_key) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  credits_monthly = EXCLUDED.credits_monthly,
  duration_days = EXCLUDED.duration_days,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  notes = EXCLUDED.notes,
  updated_at = now();

-- ============================================================
-- STEP 4: UPDATE handle_new_user() TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_trial_plan_id uuid;
  v_start_date date;
  v_until_date date;
BEGIN
  -- Get the Free Trial plan ID
  SELECT id INTO v_trial_plan_id
  FROM public.credit_plans
  WHERE plan_key = 'free_trial_30d' AND is_active = true
  LIMIT 1;

  -- Calculate trial dates (start today, end in 30 days)
  v_start_date := CURRENT_DATE;
  v_until_date := CURRENT_DATE + INTERVAL '30 days';

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
    10000, -- Trial credits
    1, -- Period starts on day 1 of month
    false, -- No rollover for trials
    0, -- No grace units for trials
    'credits' -- Always use credits enforcement
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, pmc_users.name),
    -- CRITICAL: Only update plan if user has NO plan (credits_allowed = 0 OR NULL)
    -- This prevents overwriting paid plans or higher credits
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user IS
  'Auto-creates pmc_users record with Free Trial plan (10K credits, 30 days) for new signups. Idempotent - never overwrites existing paid plans.';

-- ============================================================
-- STEP 5: ENSURE TRIGGER EXISTS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
