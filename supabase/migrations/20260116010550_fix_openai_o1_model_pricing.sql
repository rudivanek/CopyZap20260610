/*
  # Fix OpenAI o1 Model Pricing

  ## Changes
  1. Correct o1-mini pricing to OpenAI Standard tier rates
     - Input: $1.10 per 1M tokens ($0.0011 per 1K)
     - Output: $4.40 per 1M tokens ($0.0044 per 1K)
  
  2. Remove reasoning token pricing for o1 family models
     - OpenAI bills reasoning tokens as output tokens
     - No separate reasoning rate should be stored
  
  ## Models Updated
  - o1-mini: Corrected pricing + removed reasoning column
  - o1: Removed reasoning column (pricing already correct)
  
  ## Notes
  - OpenAI's o1 models include reasoning in output token pricing
  - This migration ensures accurate cost calculations
*/

-- Fix o1-mini pricing (OpenAI Standard: $1.10 / 1M input, $4.40 / 1M output)
UPDATE llm_model_pricing
SET
  usd_per_1k_input_tokens = 0.0011,
  usd_per_1k_output_tokens = 0.0044,
  usd_per_1k_reasoning_tokens = NULL,
  notes = 'o1-mini - Smaller reasoning model | Standard pricing: reasoning billed as output tokens'
WHERE model_key = 'o1-mini';

-- Remove reasoning token pricing for o1 (reasoning billed as output tokens)
UPDATE llm_model_pricing
SET
  usd_per_1k_reasoning_tokens = NULL,
  notes = 'o1 - Advanced reasoning model with extended thinking | Reasoning billed as output tokens'
WHERE model_key = 'o1';
