/*
  # Seed LLM Model Pricing Data and Add Admin-Only Write Policies

  ## Changes
  1. Insert current pricing data for popular LLM models
  2. Add RLS policies to restrict write access to admin user (rfv@datago.net)

  ## Pricing Data
  All costs are per 1,000 tokens in USD
  - Anthropic models (Claude 3.5, Claude 4.5)
  - OpenAI models (GPT-4o, o1)
  - Google models (Gemini 1.5)

  ## Security
  - Only rfv@datago.net can INSERT, UPDATE, or DELETE pricing records
  - All authenticated users can read (already configured)
*/

-- Insert Anthropic models
INSERT INTO llm_model_pricing (model_key, provider, usd_per_1k_input_tokens, usd_per_1k_output_tokens, usd_per_1k_reasoning_tokens, notes)
VALUES
  ('claude-sonnet-4-5', 'anthropic', 0.003000, 0.015000, NULL, 'Claude Sonnet 4.5 - Latest flagship model'),
  ('claude-sonnet-3-5', 'anthropic', 0.003000, 0.015000, NULL, 'Claude Sonnet 3.5 - Previous generation'),
  ('claude-opus-3-5', 'anthropic', 0.015000, 0.075000, NULL, 'Claude Opus 3.5 - Most capable model'),
  ('claude-haiku-3-5', 'anthropic', 0.001000, 0.005000, NULL, 'Claude Haiku 3.5 - Fast and efficient')
ON CONFLICT (model_key) DO NOTHING;

-- Insert OpenAI models
INSERT INTO llm_model_pricing (model_key, provider, usd_per_1k_input_tokens, usd_per_1k_output_tokens, usd_per_1k_reasoning_tokens, notes)
VALUES
  ('gpt-4o', 'openai', 0.002500, 0.010000, NULL, 'GPT-4o - Multimodal flagship'),
  ('gpt-4o-mini', 'openai', 0.000150, 0.000600, NULL, 'GPT-4o Mini - Small and efficient'),
  ('o1', 'openai', 0.015000, 0.060000, 0.060000, 'o1 - Advanced reasoning model with extended thinking'),
  ('o1-mini', 'openai', 0.003000, 0.012000, 0.012000, 'o1-mini - Smaller reasoning model')
ON CONFLICT (model_key) DO NOTHING;

-- Insert Google models
INSERT INTO llm_model_pricing (model_key, provider, usd_per_1k_input_tokens, usd_per_1k_output_tokens, usd_per_1k_reasoning_tokens, notes)
VALUES
  ('gemini-1.5-pro', 'google', 0.001250, 0.005000, NULL, 'Gemini 1.5 Pro - Long context model'),
  ('gemini-1.5-flash', 'google', 0.000075, 0.000300, NULL, 'Gemini 1.5 Flash - Fast and affordable')
ON CONFLICT (model_key) DO NOTHING;

-- Add RLS policies for admin-only write access
-- Only rfv@datago.net can insert new pricing records
CREATE POLICY "Only admin can insert pricing"
ON llm_model_pricing
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'rfv@datago.net'
);

-- Only rfv@datago.net can update pricing records
CREATE POLICY "Only admin can update pricing"
ON llm_model_pricing
FOR UPDATE
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'rfv@datago.net'
)
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'rfv@datago.net'
);

-- Only rfv@datago.net can delete pricing records
CREATE POLICY "Only admin can delete pricing"
ON llm_model_pricing
FOR DELETE
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'rfv@datago.net'
);
