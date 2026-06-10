/*
  # Update Session Token Summary View - Add Billable Units

  1. Changes
    - Drop and recreate pmc_session_token_summary view
    - Add total_billable_units column (sum of billable_units)
    - Maintain all existing columns and behavior

  2. Purpose
    - Display billable units in dashboard session grouping
    - Enable filtering and reporting on credits usage
    - Parallel metric alongside tokens and cost

  3. Non-Breaking
    - All existing columns preserved
    - View continues to work with existing queries
*/

-- Drop the existing view
DROP VIEW IF EXISTS pmc_session_token_summary;

-- Recreate with billable_units aggregation
CREATE VIEW pmc_session_token_summary
WITH (security_invoker = true)
AS
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
  COALESCE(SUM(t.tokens_used), 0) AS total_tokens,
  COALESCE(SUM(t.cost_usd), 0) AS total_cost,
  COALESCE(SUM(t.billable_units), 0) AS total_billable_units,
  ARRAY_AGG(DISTINCT t.model) FILTER (WHERE t.model IS NOT NULL) AS models_used,
  ARRAY_AGG(DISTINCT t.operation_type) FILTER (WHERE t.operation_type IS NOT NULL) AS operations_performed
FROM pmc_copy_sessions s
LEFT JOIN pmc_user_tokens_used t ON s.id = t.session_id
GROUP BY 
  s.id,
  s.user_id,
  s.customer_id,
  s.session_name,
  s.output_type,
  s.brief_description,
  s.input_data,
  s.created_at;

COMMENT ON VIEW pmc_session_token_summary IS
'Aggregated token and billable units usage per session for dashboard queries. Includes parallel metrics: tokens, USD cost, and billable units (credits).';
