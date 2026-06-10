/*
  # Phase 3: DB-Driven Cost Calculation - Token Breakdown & Pricing Integration

  ## Overview
  This migration enables accurate cost calculation using the llm_model_pricing table as the
  source of truth. It adds token breakdown columns and pricing metadata to enable precise
  cost tracking without changing token enforcement logic.

  ## Changes

  1. **New Columns in pmc_user_tokens_used**
     - `input_tokens_used` - Number of input/prompt tokens consumed
     - `output_tokens_used` - Number of output/completion tokens consumed
     - `reasoning_tokens_used` - Number of reasoning tokens (for models like o1)
     - `cost_source` - How cost was calculated ('db_pricing', 'legacy', 'fixed', 'db_pricing_avg')
     - `pricing_row_id` - Reference to llm_model_pricing row used for calculation

  2. **Indexes**
     - Performance index on (model, pricing_tier, created_at DESC)
     - Foreign key index on pricing_row_id

  3. **Helper Function**
     - get_active_model_pricing() - Lookup pricing from llm_model_pricing table

  ## Important Notes
  - Older rows will have NULL values for token breakdown (no backfill)
  - tokens_used remains unchanged and is still used for enforcement
  - Token enforcement is NOT affected by these changes
  - Credits/billable_units remain display-only (no blocking)
*/

-- =====================================================
-- STEP 1: Add Token Breakdown Columns
-- =====================================================

DO $$
BEGIN
  -- Add input_tokens_used if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used'
    AND column_name = 'input_tokens_used'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_used
    ADD COLUMN input_tokens_used INTEGER NULL;
  END IF;

  -- Add output_tokens_used if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used'
    AND column_name = 'output_tokens_used'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_used
    ADD COLUMN output_tokens_used INTEGER NULL;
  END IF;

  -- Add reasoning_tokens_used if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used'
    AND column_name = 'reasoning_tokens_used'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_used
    ADD COLUMN reasoning_tokens_used INTEGER NULL;
  END IF;

  -- Add cost_source if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used'
    AND column_name = 'cost_source'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_used
    ADD COLUMN cost_source TEXT NOT NULL DEFAULT 'legacy';
  END IF;

  -- Add pricing_row_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used'
    AND column_name = 'pricing_row_id'
  ) THEN
    ALTER TABLE public.pmc_user_tokens_used
    ADD COLUMN pricing_row_id UUID NULL REFERENCES public.llm_model_pricing(id);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.pmc_user_tokens_used.input_tokens_used IS
  'Number of input/prompt tokens used (NULL for older records or when breakdown unavailable)';

COMMENT ON COLUMN public.pmc_user_tokens_used.output_tokens_used IS
  'Number of output/completion tokens used (NULL for older records or when breakdown unavailable)';

COMMENT ON COLUMN public.pmc_user_tokens_used.reasoning_tokens_used IS
  'Number of reasoning tokens used (for models like o1, NULL if not applicable)';

COMMENT ON COLUMN public.pmc_user_tokens_used.cost_source IS
  'Source of cost calculation: db_pricing (from llm_model_pricing), db_pricing_avg (averaged when no breakdown), legacy (hardcoded), fixed (fixed-cost operations)';

COMMENT ON COLUMN public.pmc_user_tokens_used.pricing_row_id IS
  'Foreign key to llm_model_pricing row used for cost calculation (NULL for fixed/legacy)';

-- =====================================================
-- STEP 2: Add Performance Indexes
-- =====================================================

-- Index for pricing lookups by model and tier
CREATE INDEX IF NOT EXISTS idx_tokens_used_model_tier_created
  ON public.pmc_user_tokens_used(model, pricing_tier, created_at DESC);

-- Index for pricing row references
CREATE INDEX IF NOT EXISTS idx_tokens_used_pricing_row
  ON public.pmc_user_tokens_used(pricing_row_id)
  WHERE pricing_row_id IS NOT NULL;

-- Index for cost source analysis
CREATE INDEX IF NOT EXISTS idx_tokens_used_cost_source
  ON public.pmc_user_tokens_used(cost_source, created_at DESC);

-- =====================================================
-- STEP 3: Create Pricing Lookup Helper Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_active_model_pricing(
  p_model_key TEXT,
  p_pricing_tier TEXT DEFAULT 'standard'
)
RETURNS TABLE (
  id UUID,
  model_key TEXT,
  model_display_name TEXT,
  provider TEXT,
  pricing_tier TEXT,
  input_usd_per_1k NUMERIC,
  output_usd_per_1k NUMERIC,
  reasoning_usd_per_1k NUMERIC,
  is_active BOOLEAN,
  effective_from TIMESTAMPTZ,
  notes TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  /*
    Lookup active pricing for a given model and tier.

    Returns the most recent active pricing row for the specified model_key and tier.
    Used by cost calculation to get accurate pricing from llm_model_pricing table.

    Returns NULL (empty result set) if no matching pricing found.
    This is safe - callers should fall back to legacy pricing.
  */

  RETURN QUERY
  SELECT
    lmp.id,
    lmp.model_key,
    lmp.model_display_name,
    lmp.provider,
    lmp.pricing_tier,
    lmp.input_usd_per_1k,
    lmp.output_usd_per_1k,
    lmp.reasoning_usd_per_1k,
    lmp.is_active,
    lmp.effective_from,
    lmp.notes
  FROM public.llm_model_pricing lmp
  WHERE
    lmp.model_key = p_model_key
    AND lmp.pricing_tier = p_pricing_tier
    AND lmp.is_active = true
    AND lmp.effective_from <= NOW()
  ORDER BY lmp.effective_from DESC
  LIMIT 1;
END;
$$;

-- Grant execute to authenticated users (called from edge functions)
GRANT EXECUTE ON FUNCTION public.get_active_model_pricing(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_model_pricing(TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.get_active_model_pricing IS
  'Lookup active pricing for a model and tier from llm_model_pricing table. Returns NULL if not found (safe fallback to legacy pricing).';

-- =====================================================
-- STEP 4: Update RLS Policies (if needed)
-- =====================================================

-- Ensure authenticated users can read llm_model_pricing (for frontend lookups)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'llm_model_pricing'
    AND policyname = 'Authenticated users can read pricing'
  ) THEN
    CREATE POLICY "Authenticated users can read pricing"
      ON public.llm_model_pricing
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;