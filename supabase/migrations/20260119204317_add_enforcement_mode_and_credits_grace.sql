/*
  # Phase 4A — Add Enforcement Mode and Credits Grace Buffer

  1. Schema Changes
    - Add `enforcement_mode` column to `pmc_users`
      - TEXT NOT NULL DEFAULT 'credits'
      - Allowed values: 'credits' or 'tokens'
    - Add `credits_grace_units` column to `pmc_users`
      - INTEGER NOT NULL DEFAULT 0
      - Optional safety buffer for credits enforcement

  2. Data Migration
    - Backfill all existing users with enforcement_mode='credits'

  3. Constraints
    - Add CHECK constraint to enforce valid enforcement_mode values

  4. Purpose
    - Switch ALL users to credits-based access enforcement by default
    - Keep token system intact for audit and emergency rollback
    - Provide per-user rollback capability via enforcement_mode toggle
*/

-- Add enforcement_mode column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pmc_users'
      AND column_name = 'enforcement_mode'
  ) THEN
    ALTER TABLE public.pmc_users
    ADD COLUMN enforcement_mode TEXT NOT NULL DEFAULT 'credits';
  END IF;
END $$;

-- Add credits_grace_units column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pmc_users'
      AND column_name = 'credits_grace_units'
  ) THEN
    ALTER TABLE public.pmc_users
    ADD COLUMN credits_grace_units INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Backfill all existing users with enforcement_mode='credits'
UPDATE public.pmc_users
SET enforcement_mode = 'credits'
WHERE enforcement_mode IS NULL OR enforcement_mode = '';

-- Add CHECK constraint for enforcement_mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'pmc_users'
      AND constraint_name = 'pmc_users_enforcement_mode_check'
  ) THEN
    ALTER TABLE public.pmc_users
    ADD CONSTRAINT pmc_users_enforcement_mode_check
    CHECK (enforcement_mode IN ('credits', 'tokens'));
  END IF;
END $$;

-- Add CHECK constraint for credits_grace_units (non-negative)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'pmc_users'
      AND constraint_name = 'pmc_users_credits_grace_units_check'
  ) THEN
    ALTER TABLE public.pmc_users
    ADD CONSTRAINT pmc_users_credits_grace_units_check
    CHECK (credits_grace_units >= 0);
  END IF;
END $$;

-- Create index for enforcement_mode lookups (optional optimization)
CREATE INDEX IF NOT EXISTS idx_pmc_users_enforcement_mode
ON public.pmc_users(enforcement_mode);
