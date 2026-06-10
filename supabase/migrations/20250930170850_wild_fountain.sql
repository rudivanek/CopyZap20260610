/*
  # Create simplified token usage tracking table
  
  1. New Tables
     - `pmc_user_tokens_used` - Simplified token usage tracking
       - `id` (uuid, primary key): unique identifier
       - `user_id` (uuid, foreign key): references pmc_users.id
       - `operation_type` (text): type of operation (generate_copy, evaluate_inputs, etc.)
       - `model` (text): AI model used (gpt-4o, deepseek-chat, etc.)
       - `tokens_used` (integer): number of tokens consumed
       - `cost_usd` (decimal): cost in USD
       - `created_at` (timestamptz): when the usage occurred
  
  2. Security
     - No RLS policies - designed for Edge Function access with service role
     - Simple structure to avoid RLS complications from previous table
  
  3. Indexes
     - Efficient querying by user_id, model, operation_type, and date
*/

CREATE TABLE IF NOT EXISTS public.pmc_user_tokens_used (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.pmc_users(id) ON DELETE CASCADE,
  operation_type text NOT NULL,
  model text NOT NULL,
  tokens_used integer NOT NULL CHECK (tokens_used > 0),
  cost_usd decimal(12, 8) NOT NULL CHECK (cost_usd >= 0),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_user_id 
ON public.pmc_user_tokens_used(user_id);

CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_model 
ON public.pmc_user_tokens_used(model);

CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_operation_type 
ON public.pmc_user_tokens_used(operation_type);

CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_created_at 
ON public.pmc_user_tokens_used(created_at);

CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_user_date 
ON public.pmc_user_tokens_used(user_id, created_at);

-- Add comments for documentation
COMMENT ON TABLE public.pmc_user_tokens_used IS 'Simplified token usage tracking designed for Edge Function access';
COMMENT ON COLUMN public.pmc_user_tokens_used.operation_type IS 'Type of operation: generate_copy, evaluate_inputs, get_suggestions, etc.';
COMMENT ON COLUMN public.pmc_user_tokens_used.model IS 'AI model used: gpt-4o, deepseek-chat, gpt-4-turbo, etc.';
COMMENT ON COLUMN public.pmc_user_tokens_used.tokens_used IS 'Number of tokens consumed by the API call';
COMMENT ON COLUMN public.pmc_user_tokens_used.cost_usd IS 'Cost in USD for the token usage';

-- No RLS policies - this table will be accessed via Edge Functions with service role permissions
-- This avoids the RLS complexity that caused issues with the previous token usage table