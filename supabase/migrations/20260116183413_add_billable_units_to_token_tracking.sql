/*
  # Add Billable Units (Credits) Parallel Tracking System - Phase 1

  1. Changes
    - Add `billable_units` column to `pmc_user_tokens_used` (parallel metric to tokens)
    - Add `billing_rule_name` column to track which rule was used
    - Add `pricing_tier` column to track pricing tier (standard by default)
    - Create index for dashboard queries
    - Backfill existing rows with calculated billable units using llm_billing_rules

  2. Purpose
    - Enable parallel "Credits" accounting alongside existing token system
    - Prepare for future enforcement switch (Phase 2+)
    - Display billable units in dashboard without changing current enforcement

  3. Non-Breaking
    - Does NOT change existing token tracking or enforcement
    - tokens_remaining trigger continues to work unchanged
    - checkUserAccess() continues to enforce only tokens_remaining
    - All existing functionality preserved
*/

-- ============================================
-- STEP 1: Add new columns to pmc_user_tokens_used
-- ============================================

DO $$
BEGIN
  -- Add billable_units column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used'
    AND column_name = 'billable_units'
  ) THEN
    ALTER TABLE pmc_user_tokens_used
    ADD COLUMN billable_units INTEGER NOT NULL DEFAULT 0;

    RAISE NOTICE 'Added billable_units column to pmc_user_tokens_used';
  END IF;

  -- Add billing_rule_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used'
    AND column_name = 'billing_rule_name'
  ) THEN
    ALTER TABLE pmc_user_tokens_used
    ADD COLUMN billing_rule_name TEXT NULL;

    RAISE NOTICE 'Added billing_rule_name column to pmc_user_tokens_used';
  END IF;

  -- Add pricing_tier column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used'
    AND column_name = 'pricing_tier'
  ) THEN
    ALTER TABLE pmc_user_tokens_used
    ADD COLUMN pricing_tier TEXT NULL;

    RAISE NOTICE 'Added pricing_tier column to pmc_user_tokens_used';
  END IF;
END $$;

-- ============================================
-- STEP 2: Create index for dashboard queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_created_at_billable
ON pmc_user_tokens_used (user_id, created_at DESC, billable_units);

COMMENT ON INDEX idx_pmc_user_tokens_used_created_at_billable IS
'Optimizes dashboard queries for billable units aggregation by user and date range';

-- ============================================
-- STEP 3: Backfill existing rows
-- ============================================

-- Update existing rows that don't have billable_units calculated yet
-- Uses the active billing rule from llm_billing_rules table
DO $$
DECLARE
  v_rule_name TEXT;
  v_cost_multiplier NUMERIC(10,4);
  v_usd_per_unit NUMERIC(10,6);
  v_min_units_per_call INTEGER;
  v_rounding_mode TEXT;
  v_rows_updated INTEGER;
BEGIN
  -- Fetch the active billing rule (default rule or most recent active)
  SELECT
    rule_name,
    cost_multiplier,
    usd_per_unit,
    min_units_per_call,
    rounding_mode
  INTO
    v_rule_name,
    v_cost_multiplier,
    v_usd_per_unit,
    v_min_units_per_call,
    v_rounding_mode
  FROM llm_billing_rules
  WHERE is_active = true
  ORDER BY
    CASE WHEN rule_name = 'default' THEN 0 ELSE 1 END,
    effective_from DESC
  LIMIT 1;

  -- If no active rule found, use hardcoded defaults
  IF v_rule_name IS NULL THEN
    v_rule_name := 'default_fallback';
    v_cost_multiplier := 1.30;
    v_usd_per_unit := 0.010000;
    v_min_units_per_call := 1;
    v_rounding_mode := 'ceil';

    RAISE NOTICE 'No active billing rule found, using fallback defaults';
  ELSE
    RAISE NOTICE 'Using billing rule: % (multiplier: %, usd_per_unit: %)',
      v_rule_name, v_cost_multiplier, v_usd_per_unit;
  END IF;

  -- Backfill existing rows where billable_units = 0
  -- Formula: billable_units = GREATEST(min_units_per_call, CEIL((cost_usd * cost_multiplier) / usd_per_unit))
  UPDATE pmc_user_tokens_used
  SET
    billable_units = CASE
      WHEN cost_usd IS NULL OR cost_usd = 0 THEN 0
      ELSE GREATEST(
        v_min_units_per_call,
        CEIL((cost_usd * v_cost_multiplier) / v_usd_per_unit)::INTEGER
      )
    END,
    billing_rule_name = v_rule_name,
    pricing_tier = 'standard'
  WHERE billable_units = 0;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  RAISE NOTICE 'Backfilled % existing rows with billable_units', v_rows_updated;
END $$;

-- ============================================
-- STEP 4: Add comments for documentation
-- ============================================

COMMENT ON COLUMN pmc_user_tokens_used.billable_units IS
'Billable units (credits) computed from cost_usd using billing rules. Parallel metric to tokens_used. Used for future enforcement.';

COMMENT ON COLUMN pmc_user_tokens_used.billing_rule_name IS
'Name of the billing rule used to calculate billable_units (e.g., "default"). References llm_billing_rules.rule_name.';

COMMENT ON COLUMN pmc_user_tokens_used.pricing_tier IS
'Pricing tier applied for this usage (e.g., "standard", "premium"). Currently defaults to "standard" in Phase 1.';
