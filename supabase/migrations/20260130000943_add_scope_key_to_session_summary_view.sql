/*
  # Add scope_key to pmc_session_token_summary view

  1. Purpose
    - Add scope_key column to the session summary view
    - Enable filtering sessions by scope (copy-maker vs copysnap)
    - Prevent CopySnap sessions from appearing in Copy Maker interface

  2. Changes
    - Drop and recreate pmc_session_token_summary view
    - Add s.scope_key to SELECT columns
    - No other changes to view logic

  3. Notes
    - This enables proper session filtering in the UI
    - CopySnap sessions will have scope_key like 'copysnap-{userId}'
    - Copy Maker sessions will have scope_key like 'copy-maker' or NULL (backfilled to 'copy-maker')
*/

-- Drop the existing view
DROP VIEW IF EXISTS public.pmc_session_token_summary;

-- Recreate the view with scope_key included
CREATE VIEW public.pmc_session_token_summary AS
SELECT
  s.id AS session_id,
  s.user_id,
  s.customer_id,
  s.session_name,
  s.output_type,
  s.brief_description,
  s.input_data,
  s.scope_key,
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
  s.scope_key,
  s.created_at;
