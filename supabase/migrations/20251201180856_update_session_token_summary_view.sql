/*
  # Update Session Token Summary View to Include Input Data

  1. Purpose
    - Add input_data JSONB field to the view so we can extract projectDescription
    - This allows ManageSessions to display the actual Project Description from the form

  2. Changes
    - Drop and recreate the view with input_data field
    - Maintains all existing fields and functionality
*/

DROP VIEW IF EXISTS pmc_session_token_summary;

CREATE VIEW pmc_session_token_summary AS
SELECT 
  s.id as session_id,
  s.user_id,
  s.customer_id,
  s.session_name,
  s.output_type,
  s.brief_description,
  s.input_data,
  s.created_at,
  COUNT(t.id) as api_calls_count,
  COALESCE(SUM(t.tokens_used), 0) as total_tokens,
  COALESCE(SUM(t.cost_usd), 0) as total_cost,
  ARRAY_AGG(DISTINCT t.model) FILTER (WHERE t.model IS NOT NULL) as models_used,
  ARRAY_AGG(DISTINCT t.operation_type) FILTER (WHERE t.operation_type IS NOT NULL) as operations_performed
FROM pmc_copy_sessions s
LEFT JOIN pmc_user_tokens_used t ON s.id = t.session_id
GROUP BY s.id, s.user_id, s.customer_id, s.session_name, s.output_type, s.brief_description, s.input_data, s.created_at;

GRANT SELECT ON pmc_session_token_summary TO authenticated;

ALTER VIEW pmc_session_token_summary SET (security_invoker = true);
