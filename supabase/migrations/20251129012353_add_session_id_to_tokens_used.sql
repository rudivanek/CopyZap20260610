/*
  # Add Session ID to Token Usage Table

  ## Purpose
  Links token usage records to sessions for better tracking and reporting.

  ## Changes Made
  1. Add `session_id` column to pmc_user_tokens_used table
     - References pmc_copy_sessions(id)
     - Nullable (for backward compatibility with existing records)
  
  2. Add index for efficient session-based queries
  
  3. Update view to include session information

  ## Security
  - RLS policies remain unchanged
  - Foreign key ensures data integrity
*/

-- Add session_id column to pmc_user_tokens_used
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_used' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE pmc_user_tokens_used ADD COLUMN session_id uuid REFERENCES pmc_copy_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index on session_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_session_id 
  ON pmc_user_tokens_used(session_id);

-- Add composite index for user + session queries
CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_user_session 
  ON pmc_user_tokens_used(user_id, session_id);

-- Update the session summary view to use pmc_user_tokens_used instead
DROP VIEW IF EXISTS pmc_session_token_summary;

CREATE VIEW pmc_session_token_summary AS
SELECT 
  s.id as session_id,
  s.user_id,
  s.customer_id,
  s.session_name,
  s.output_type,
  s.brief_description,
  s.created_at,
  COUNT(t.id) as api_calls_count,
  COALESCE(SUM(t.tokens_used), 0) as total_tokens,
  COALESCE(SUM(t.cost_usd), 0) as total_cost,
  ARRAY_AGG(DISTINCT t.model) FILTER (WHERE t.model IS NOT NULL) as models_used,
  ARRAY_AGG(DISTINCT t.operation_type) FILTER (WHERE t.operation_type IS NOT NULL) as operations_performed
FROM pmc_copy_sessions s
LEFT JOIN pmc_user_tokens_used t ON s.id = t.session_id
GROUP BY s.id, s.user_id, s.customer_id, s.session_name, s.output_type, s.brief_description, s.created_at;

-- Grant access to the view
GRANT SELECT ON pmc_session_token_summary TO authenticated;

-- Add RLS policy for the view
ALTER VIEW pmc_session_token_summary SET (security_invoker = true);

COMMENT ON COLUMN pmc_user_tokens_used.session_id IS 
  'Links token usage to a specific copy generation session for tracking and reporting';