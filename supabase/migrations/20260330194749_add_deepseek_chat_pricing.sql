/*
  # Add DeepSeek Chat Model Pricing

  1. Model Addition
    - Add pricing for deepseek-chat model
    - Input: $0.14 per 1M tokens ($0.00014 per 1K)
    - Output: $0.28 per 1M tokens ($0.00028 per 1K)
    - Standard tier

  2. Purpose
    - Fixes "No pricing found for deepseek-chat" console warnings
    - Enables proper cost tracking for DeepSeek API usage
*/

-- Add deepseek-chat pricing only if it doesn't exist
INSERT INTO llm_model_pricing (
  model_key,
  provider,
  pricing_tier,
  usd_per_1k_input_tokens,
  usd_per_1k_output_tokens,
  usd_per_1k_reasoning_tokens,
  is_active,
  effective_from,
  notes
)
SELECT
  'deepseek-chat',
  'deepseek',
  'standard',
  0.00014, -- $0.14 per 1M input tokens
  0.00028, -- $0.28 per 1M output tokens
  NULL,    -- No separate reasoning pricing
  true,
  '2026-03-30'::timestamptz,
  'Standard DeepSeek Chat API pricing as of March 2026'
WHERE NOT EXISTS (
  SELECT 1 FROM llm_model_pricing
  WHERE model_key = 'deepseek-chat'
  AND pricing_tier = 'standard'
);
