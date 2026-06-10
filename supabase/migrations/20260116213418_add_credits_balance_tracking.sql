/*
  # Add Credits Balance Tracking (Phase 2A - Display Only)

  ## Summary
  Adds monthly subscription-style credits balance to pmc_users for UI display.
  This does NOT change token enforcement - tokens remain the only access gate.

  ## Changes
  1. New Columns in pmc_users
    - `credits_allowed` (integer, default 0) - Monthly credits allowance per user
    - `credits_period_start_day` (integer, default 1) - Day of month when credits reset (1-28)
    - `credits_rollover_enabled` (boolean, default false) - Future use; stored but not enforced
    - `credits_note` (text, nullable) - Optional admin notes about user's credits plan

  2. Seed Data
    - Set credits_allowed = 20000 for rfv@datago.net (admin test user)

  3. Security
    - RLS: Users can read their own credits fields (existing policies apply)
    - No new triggers or enforcement logic in Phase 2A

  ## Notes
  - credits_used_in_period is computed dynamically via SUM(billable_units)
  - credits_remaining is computed dynamically (not stored)
  - Period calculation uses credits_period_start_day to determine current billing cycle
  - This phase adds the infrastructure; enforcement comes in Phase 3
*/

-- Add credits plan columns to pmc_users (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_users'
    AND column_name = 'credits_allowed'
  ) THEN
    ALTER TABLE public.pmc_users
    ADD COLUMN credits_allowed INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_users'
    AND column_name = 'credits_period_start_day'
  ) THEN
    ALTER TABLE public.pmc_users
    ADD COLUMN credits_period_start_day INTEGER NOT NULL DEFAULT 1
    CHECK (credits_period_start_day >= 1 AND credits_period_start_day <= 28);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_users'
    AND column_name = 'credits_rollover_enabled'
  ) THEN
    ALTER TABLE public.pmc_users
    ADD COLUMN credits_rollover_enabled BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_users'
    AND column_name = 'credits_note'
  ) THEN
    ALTER TABLE public.pmc_users
    ADD COLUMN credits_note TEXT NULL;
  END IF;
END $$;

-- Seed test data: set credits_allowed for rfv@datago.net
UPDATE public.pmc_users
SET credits_allowed = 20000,
    credits_note = 'Phase 2A test account - 20K monthly credits'
WHERE email = 'rfv@datago.net';

-- Verify RLS allows users to read their own credits fields
-- Existing RLS policies on pmc_users should already cover these new columns
-- No additional RLS policies needed