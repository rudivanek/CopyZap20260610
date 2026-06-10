/*
  # Create LLM Model Pricing Table

  ## Purpose
  Store internal USD costs per 1,000 tokens for each LLM model to calculate estimated costs and derive user credit usage.
  This table acts as the single source of truth for model pricing and can be updated without code redeployment.

  ## Tables Created
  - `llm_model_pricing`
    - `id` (uuid, primary key) - Unique identifier
    - `model_key` (text, unique, not null) - Model identifier (e.g., "claude-sonnet-4-5", "gpt-4o")
    - `provider` (text, not null) - Provider name (e.g., "anthropic", "openai", "google")
    - `usd_per_1k_input_tokens` (numeric, not null) - Cost per 1,000 input tokens in USD
    - `usd_per_1k_output_tokens` (numeric, not null) - Cost per 1,000 output tokens in USD
    - `usd_per_1k_reasoning_tokens` (numeric, nullable) - Cost per 1,000 reasoning tokens in USD (for models with extended thinking)
    - `is_active` (boolean, not null, default true) - Whether this pricing entry is currently active
    - `effective_from` (timestamptz, not null, default now) - When this pricing becomes effective
    - `notes` (text, nullable) - Additional notes about pricing or changes
    - `created_at` (timestamptz, not null, default now) - Record creation timestamp
    - `updated_at` (timestamptz, not null, default now) - Record last update timestamp

  ## Indexes
  - Index on `model_key` where `is_active = true` for fast active pricing lookups

  ## Security
  - RLS enabled
  - Read access for authenticated users
  - Write access will be restricted to admins (to be added later)

  ## Notes
  - No seed data included (to be added separately if needed)
  - Table can be queried at runtime and cached in API layer
  - Supports price history via `effective_from` and `is_active` fields
  - Reasoning token pricing is optional (only some models like o1 use it)
*/

-- Create the table
CREATE TABLE IF NOT EXISTS llm_model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  model_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,

  usd_per_1k_input_tokens NUMERIC(10,6) NOT NULL,
  usd_per_1k_output_tokens NUMERIC(10,6) NOT NULL,
  usd_per_1k_reasoning_tokens NUMERIC(10,6),

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for fast lookups of active pricing
CREATE INDEX IF NOT EXISTS idx_llm_model_pricing_model_key_active
ON llm_model_pricing (model_key)
WHERE is_active = true;

-- Create trigger function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at_llm_model_pricing()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_set_updated_at_llm_model_pricing ON llm_model_pricing;

CREATE TRIGGER trg_set_updated_at_llm_model_pricing
BEFORE UPDATE ON llm_model_pricing
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_llm_model_pricing();

-- Enable Row Level Security
ALTER TABLE llm_model_pricing ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read pricing data
CREATE POLICY "Allow read access to authenticated users"
ON llm_model_pricing
FOR SELECT
TO authenticated
USING (true);
