/*
  # Add Pricing Tier Support to LLM Model Pricing

  ## Changes
  1. Add pricing_tier column (default 'standard')
  2. Update unique constraint to include pricing_tier
  3. Update index to include pricing_tier
  4. Update existing rows to have pricing_tier = 'standard'
  5. Seed all model pricing with standard tier

  ## Constraints
  - UNIQUE(model_key, pricing_tier) - Allows multiple pricing tiers per model
  
  ## Notes
  - This migration is idempotent
  - Existing data is preserved and updated
  - RLS policies remain unchanged
*/

-- Add pricing_tier column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'llm_model_pricing' AND column_name = 'pricing_tier'
  ) THEN
    ALTER TABLE llm_model_pricing
    ADD COLUMN pricing_tier TEXT NOT NULL DEFAULT 'standard';
  END IF;
END $$;

-- Drop old unique constraint if exists (without pricing_tier)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'llm_model_pricing_model_key_key'
  ) THEN
    ALTER TABLE llm_model_pricing DROP CONSTRAINT llm_model_pricing_model_key_key;
  END IF;
END $$;

-- Add new unique constraint with pricing_tier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_llm_model_pricing_model_tier'
  ) THEN
    ALTER TABLE llm_model_pricing
    ADD CONSTRAINT uq_llm_model_pricing_model_tier UNIQUE (model_key, pricing_tier);
  END IF;
END $$;

-- Drop old index if exists
DROP INDEX IF EXISTS idx_llm_model_pricing_active;

-- Create new index with pricing_tier
CREATE INDEX IF NOT EXISTS idx_llm_model_pricing_active
ON llm_model_pricing (model_key, pricing_tier)
WHERE is_active = true;

-- Seed standard tier pricing (idempotent upserts)
INSERT INTO llm_model_pricing
(model_key, provider, pricing_tier, usd_per_1k_input_tokens, usd_per_1k_output_tokens, usd_per_1k_reasoning_tokens, is_active, effective_from, notes)
VALUES
-- Anthropic Claude 4.5 family
('claude-sonnet-4-5', 'anthropic', 'standard', 0.003000, 0.015000, NULL, true, now(), 'Seeded standard pricing'),
('claude-opus-4-5', 'anthropic', 'standard', 0.005000, 0.025000, NULL, true, now(), 'Seeded standard pricing'),
('claude-haiku-4-5', 'anthropic', 'standard', 0.001000, 0.005000, NULL, true, now(), 'Seeded standard pricing'),
-- Anthropic Claude 3.5 family
('claude-sonnet-3-5', 'anthropic', 'standard', 0.003000, 0.015000, NULL, true, now(), 'Seeded standard pricing'),
('claude-opus-3-5', 'anthropic', 'standard', 0.015000, 0.075000, NULL, true, now(), 'Seeded standard pricing'),
('claude-haiku-3-5', 'anthropic', 'standard', 0.000800, 0.001000, NULL, true, now(), 'Seeded standard pricing'),
-- OpenAI GPT-4o family
('gpt-4o', 'openai', 'standard', 0.002500, 0.010000, NULL, true, now(), 'Seeded standard pricing'),
('gpt-4o-mini', 'openai', 'standard', 0.000150, 0.000600, NULL, true, now(), 'Seeded standard pricing'),
-- OpenAI o1 family (reasoning billed as output tokens)
('o1', 'openai', 'standard', 0.015000, 0.060000, NULL, true, now(), 'Seeded standard pricing; reasoning billed as output'),
('o1-mini', 'openai', 'standard', 0.001100, 0.004400, NULL, true, now(), 'Seeded standard pricing; reasoning billed as output'),
-- Google Gemini 1.5 family
('gemini-1.5-pro', 'google', 'standard', 0.001250, 0.005000, NULL, true, now(), 'Seeded standard pricing'),
('gemini-1.5-flash', 'google', 'standard', 0.000075, 0.000300, NULL, true, now(), 'Seeded standard pricing')
ON CONFLICT (model_key, pricing_tier) DO UPDATE SET
  provider = EXCLUDED.provider,
  usd_per_1k_input_tokens = EXCLUDED.usd_per_1k_input_tokens,
  usd_per_1k_output_tokens = EXCLUDED.usd_per_1k_output_tokens,
  usd_per_1k_reasoning_tokens = EXCLUDED.usd_per_1k_reasoning_tokens,
  is_active = EXCLUDED.is_active,
  effective_from = EXCLUDED.effective_from,
  notes = EXCLUDED.notes;
