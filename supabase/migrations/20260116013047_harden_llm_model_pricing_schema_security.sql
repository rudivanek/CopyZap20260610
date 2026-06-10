/*
  # Harden LLM Model Pricing Schema and Security

  ## Schema Enforcement
  1. Ensure pricing_tier column exists, is NOT NULL, defaults to 'standard'
  2. Enforce UNIQUE(model_key, pricing_tier) constraint
  3. Create optimized index for active pricing lookups
  4. Ensure updated_at trigger is active

  ## Security (RLS)
  - SELECT: All authenticated users can read pricing
  - INSERT/UPDATE/DELETE: Only rfv@datago.net can modify pricing
  
  ## Seed Data
  - Idempotent upsert of 12 models with standard tier pricing
  - Anthropic: 6 models (Claude 4.5 & 3.5 families)
  - OpenAI: 4 models (GPT-4o, o1 families)
  - Google: 2 models (Gemini 1.5)

  ## Notes
  - This migration is fully idempotent and safe to run multiple times
  - Does not modify any other tables
  - Preserves existing data and IDs
*/

-- 1) Ensure pricing_tier column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='llm_model_pricing' AND column_name='pricing_tier'
  ) THEN
    ALTER TABLE llm_model_pricing ADD COLUMN pricing_tier TEXT NOT NULL DEFAULT 'standard';
  END IF;
END $$;

-- Ensure NOT NULL + default (in case column exists but differs)
ALTER TABLE llm_model_pricing
  ALTER COLUMN pricing_tier SET DEFAULT 'standard';
ALTER TABLE llm_model_pricing
  ALTER COLUMN pricing_tier SET NOT NULL;

-- 2) Ensure unique constraint on (model_key, pricing_tier)
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

-- 3) Create index for active pricing lookups
CREATE INDEX IF NOT EXISTS idx_llm_model_pricing_active
ON llm_model_pricing (model_key, pricing_tier)
WHERE is_active = true;

-- 4) Ensure updated_at trigger exists and is current
CREATE OR REPLACE FUNCTION set_updated_at_llm_model_pricing()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_llm_model_pricing ON llm_model_pricing;

CREATE TRIGGER trg_set_updated_at_llm_model_pricing
BEFORE UPDATE ON llm_model_pricing
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_llm_model_pricing();

-- 5) Enforce RLS policies
ALTER TABLE llm_model_pricing ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
DROP POLICY IF EXISTS "llm_model_pricing_read_authenticated" ON llm_model_pricing;
CREATE POLICY "llm_model_pricing_read_authenticated"
ON llm_model_pricing
FOR SELECT
TO authenticated
USING (true);

-- Write access only for rfv@datago.net (covers INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "llm_model_pricing_write_admin_email" ON llm_model_pricing;
CREATE POLICY "llm_model_pricing_write_admin_email"
ON llm_model_pricing
FOR ALL
TO authenticated
USING ((auth.jwt()->>'email') = 'rfv@datago.net')
WITH CHECK ((auth.jwt()->>'email') = 'rfv@datago.net');

-- 6) Seed standard tier pricing (idempotent upsert)
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
-- OpenAI o1 family (reasoning tokens billed as output)
('o1', 'openai', 'standard', 0.015000, 0.060000, NULL, true, now(), 'Seeded standard pricing; reasoning billed as output'),
('o1-mini', 'openai', 'standard', 0.001100, 0.004400, NULL, true, now(), 'Seeded standard pricing; reasoning billed as output'),
-- Google Gemini 1.5 family
('gemini-1.5-pro', 'google', 'standard', 0.001250, 0.005000, NULL, true, now(), 'Seeded standard pricing'),
('gemini-1.5-flash', 'google', 'standard', 0.000075, 0.000300, NULL, true, now(), 'Seeded standard pricing')
ON CONFLICT (model_key, pricing_tier) DO UPDATE SET
  provider = EXCLUDED.provider,
  usd_per_1k_input_tokens = EXCLUDED.usd_per_1k_input_tokens,
  usd_per_1k_output_tokens = EXCLUDED.usd_per_1k_output_tokens,
  usd_per_1k_reasoning_tokens = NULL,
  is_active = EXCLUDED.is_active,
  effective_from = EXCLUDED.effective_from,
  notes = EXCLUDED.notes;
