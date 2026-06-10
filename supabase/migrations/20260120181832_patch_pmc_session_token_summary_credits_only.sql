/*
  # Patch pmc_session_token_summary View - Credits Only (Pre Phase 4B-2)

  1. Purpose
    - Remove all token column references from the view
    - Prepare view for Phase 4B-2 (which drops tokens_used column)
    - Ensure view is credits-only before column removal

  2. Changes
    - Remove: total_tokens field (was SUM(t.tokens_used))
    - Keep: api_calls_count, total_cost, total_billable_units, models_used, operations_performed
    - No breaking changes to other fields

  3. Safety
    - Drops and recreates the view (safe since it's just a view)
    - Safe to run multiple times (IF EXISTS guards)
    - Frontend code will be updated to stop using total_tokens
*/

-- Drop the existing view that references tokens_used
DROP VIEW IF EXISTS public.pmc_session_token_summary;

-- Recreate the view without token references (credits-only)
CREATE VIEW public.pmc_session_token_summary AS
SELECT
  s.id AS session_id,
  s.user_id,
  s.customer_id,
  s.session_name,
  s.output_type,
  s.brief_description,
  s.input_data,
  s.created_at,
  COUNT(t.id) AS api_calls_count,
  COALESCE(SUM(t.cost_usd), 0::numeric) AS total_cost,
  COALESCE(SUM(t.billable_units), 0::bigint) AS total_billable_units,
  ARRAY_AGG(DISTINCT t.model)
    FILTER (WHERE t.model IS NOT NULL) AS models_used,
  ARRAY_AGG(DISTINCT t.operation_type)
    FILTER (WHERE t.operation_type IS NOT NULL) AS operations_performed
FROM public.pmc_copy_sessions s
LEFT JOIN public.pmc_user_tokens_used t
  ON s.id = t.session_id
GROUP BY
  s.id,
  s.user_id,
  s.customer_id,
  s.session_name,
  s.output_type,
  s.brief_description,
  s.input_data,
  s.created_at;
