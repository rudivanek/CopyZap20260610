/*
# Trial credits only after email confirmation + block throwaway email domains

## 1. Trial credits only after email is confirmed

Today `public.handle_new_user()` (trigger `on_auth_user_created`, AFTER INSERT ON
auth.users) creates the `pmc_users` row AND inserts the 250-credit trial into
`public.credit_grants` at signup, before the email is confirmed. This change
moves the trial grant out of `handle_new_user()` and into a new
AFTER INSERT OR UPDATE OF email_confirmed_at trigger, so the trial appears only
when the user confirms their email (or immediately for already-confirmed Google
signups).

### Changes
1.1 `public.handle_new_user()` — the block starting with the comment
    `-- The trial grant: only for accounts on prepaid credits, and only once.`
    and ending with its `END IF;` is removed. The `pmc_users` insert/upsert,
    `v_trial` for `credits_allowed`, and `enforcement_mode = 'prepaid'` are
    unchanged. Signup still creates the `pmc_users` row, but no `credit_grants`
    row is inserted at signup.
1.2 New function `public.grant_trial_when_confirmed()` — SECURITY DEFINER,
    search_path 'public', RETURNS trigger:
    - Early return when `NEW.email_confirmed_at IS NULL`.
    - Early return on UPDATE when `OLD.email_confirmed_at IS NOT NULL`
      (already confirmed before this update — no second trial).
    - Reads the trial amount from `app_settings` (`trial_credits`, default 250).
    - When `pmc_users.enforcement_mode = 'prepaid'`, amount > 0, and no
      `credit_grants` row with `source = 'trial'` exists for `NEW.id`, inserts
      `(user_id, source, credits, remaining, expires_at, note)` =
      `(NEW.id, 'trial', amount, amount, now() + interval '30 days',
      'trial on email confirmation')`.
    - Body wrapped in `EXCEPTION WHEN OTHERS THEN RAISE WARNING ...; RETURN NEW;`
      so a confirmation or signup never fails because of this.
1.3 New trigger `on_auth_user_trial_on_confirm` AFTER INSERT OR UPDATE OF
    email_confirmed_at ON auth.users FOR EACH ROW. The name sorts after
    `on_auth_user_created` so the `pmc_users` row already exists when it runs.
1.4 Unique partial index `credit_grants_one_trial_per_user` on
    `public.credit_grants (user_id) WHERE source = 'trial'` — safety net against
    double trials. No user has more than one trial today, so it applies cleanly.

### Expected result
- Email + password signup: account created with 0 credits; 250 trial credits
  appear the moment the email is confirmed.
- Google signup: Google accounts arrive already confirmed, so the trial is
  granted immediately on signup.
- Confirming twice, or logging in again, never adds a second trial.
- Existing users and their credits are unchanged.

## 2. Block throwaway email addresses at signup

2.1 New table `public.blocked_email_domains (domain text PRIMARY KEY,
    added_at timestamptz NOT NULL DEFAULT now())`. RLS enabled, no policies
    (not readable or writable by app users). SELECT granted to
    supabase_auth_admin. Left empty — the domain list (~9,900 domains) is
    loaded separately after this migration.
2.2 New auth-hook function `public.hook_before_user_created(event jsonb)
    RETURNS jsonb`, LANGUAGE plpgsql, STABLE:
    - Reads `email := lower(event->'user'->>'email')`, `dom := split_part(email, '@', 2)`.
    - Empty domain → return `'{}'::jsonb` (allow).
    - Blocked when a row exists where `domain = dom` OR `dom LIKE '%.' || domain`
      (catches subdomains like `abc.mailinator.com`).
    - Blocked → returns
      `{"error":{"http_code":400,"message":"Please use your regular email address. Temporary email addresses can't be used for CopyZap."}}`.
    - Not blocked → returns `'{}'::jsonb`.
    Permissions: GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
    GRANT EXECUTE ON FUNCTION ... TO supabase_auth_admin;
    REVOKE EXECUTE ON FUNCTION ... FROM authenticated, anon, public.
    The hook is NOT enabled in code — it is switched on in the Supabase
    dashboard separately.

### Expected result
- Signup with `test@mailinator.com` (once the list is loaded) fails with the
  message under the Email field, and no account is created.
- Signup with a normal address (gmail.com, outlook.com, a company domain)
  works exactly as before.

## Security changes
- RLS enabled on `public.blocked_email_domains`; no policies (deny-by-default).
- `supabase_auth_admin` granted SELECT on the table and EXECUTE on the hook
  function; authenticated/anon/public revoked from the function.
- `grant_trial_when_confirmed()` is SECURITY DEFINER, search_path 'public'.

## What is NOT changed
- Credit amounts, trial length, pack prices, Stripe, `deduct_prepaid_credits`,
  and `send_welcome_email_when_confirmed` are untouched.
- No app text about the trial is added.
- The auth hook is not enabled in code; the user enables it in the dashboard.
*/

-- ---------------------------------------------------------------------------
-- 1. Trial credits only after email confirmation
-- ---------------------------------------------------------------------------

-- 1.1 Rewrite handle_new_user() without the trial-grant block.
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

  RETURN NEW;
END;
$function$;

-- 1.2 New function that grants the trial once the email is confirmed.
CREATE OR REPLACE FUNCTION public.grant_trial_when_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_amount integer;
  v_mode text;
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_amount := COALESCE(
      (SELECT NULLIF(value, '')::integer FROM public.app_settings WHERE key = 'trial_credits'),
      250
    );

    SELECT enforcement_mode INTO v_mode
    FROM public.pmc_users
    WHERE id = NEW.id;

    IF v_mode = 'prepaid'
       AND v_amount > 0
       AND NOT EXISTS (
         SELECT 1 FROM public.credit_grants WHERE user_id = NEW.id AND source = 'trial'
       )
    THEN
      INSERT INTO public.credit_grants (user_id, source, credits, remaining, expires_at, note)
      VALUES (NEW.id, 'trial', v_amount, v_amount, now() + interval '30 days', 'trial on email confirmation');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'grant_trial_when_confirmed failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- 1.3 Trigger named to sort after on_auth_user_created so pmc_users exists.
DROP TRIGGER IF EXISTS on_auth_user_trial_on_confirm ON auth.users;
CREATE TRIGGER on_auth_user_trial_on_confirm
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_trial_when_confirmed();

-- 1.4 Safety net: at most one trial grant per user.
CREATE UNIQUE INDEX IF NOT EXISTS credit_grants_one_trial_per_user
  ON public.credit_grants (user_id)
  WHERE source = 'trial';

-- ---------------------------------------------------------------------------
-- 2. Block throwaway email addresses at signup
-- ---------------------------------------------------------------------------

-- 2.1 The blocked-domain table. Left empty; loaded separately.
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
  domain text PRIMARY KEY,
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;
-- No policies: not readable or writable by app users.

GRANT SELECT ON public.blocked_email_domains TO supabase_auth_admin;

-- 2.2 Auth hook function (STABLE) that rejects signups with throwaway domains.
CREATE OR REPLACE FUNCTION public.hook_before_user_created(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_email text;
  v_dom text;
  v_blocked boolean;
BEGIN
  v_email := lower(event->'user'->>'email');
  v_dom := split_part(v_email, '@', 2);

  IF v_dom = '' THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_email_domains
    WHERE domain = v_dom
       OR v_dom LIKE '%.' || domain
  ) INTO v_blocked;

  IF v_blocked THEN
    RETURN jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code', 400,
        'message', 'Please use your regular email address. Temporary email addresses can''t be used for CopyZap.'
      )
    );
  END IF;

  RETURN '{}'::jsonb;
END;
$function$;

-- Permissions required for Supabase Auth hooks.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) FROM authenticated, anon, public;
