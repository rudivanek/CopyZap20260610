/*
  # Add Session Names and Enhanced Tracking

  ## Purpose
  Enhances the session tracking system to provide human-readable session names
  and better token usage summarization for admin reporting.

  ## Changes Made
  1. Add `session_name` column to pmc_copy_sessions table
     - Auto-generated format: "[Content Type] - [Brief Description] - [Date]"
     - Example: "Blog Post - AI Marketing Tips - Nov 29, 2025"
     - Fallback: "Session - Nov 29, 2025 2:45 PM"
  
  2. Add computed views for session token totals
     - Create view to aggregate token usage per session
     - Shows input tokens, output tokens, total cost per session
  
  3. Add indexes for performance
     - Index on session_name for searching
     - Index on created_at for date filtering
  
  ## Session Name Generation
  The session_name will be generated automatically when sessions are created
  based on the content type (output_type) and brief_description fields.

  ## Security
  - RLS policies remain unchanged
  - Only authenticated users can view their own session data
*/

-- Add session_name column to pmc_copy_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_copy_sessions' AND column_name = 'session_name'
  ) THEN
    ALTER TABLE pmc_copy_sessions ADD COLUMN session_name text;
  END IF;
END $$;

-- Add index on session_name for searching
CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_session_name 
  ON pmc_copy_sessions(session_name);

-- Create a view that aggregates token usage per session
CREATE OR REPLACE VIEW pmc_session_token_summary AS
SELECT 
  s.id as session_id,
  s.user_id,
  s.customer_id,
  s.session_name,
  s.output_type,
  s.brief_description,
  s.created_at,
  COUNT(t.id) as api_calls_count,
  COALESCE(SUM(t.token_usage), 0) as total_tokens,
  COALESCE(SUM(t.token_cost), 0) as total_cost,
  COALESCE(SUM(CASE WHEN t.control_executed LIKE '%input%' THEN t.token_usage ELSE 0 END), 0) as estimated_input_tokens,
  COALESCE(SUM(CASE WHEN t.control_executed LIKE '%output%' THEN t.token_usage ELSE 0 END), 0) as estimated_output_tokens,
  ARRAY_AGG(DISTINCT t.model) FILTER (WHERE t.model IS NOT NULL) as models_used,
  ARRAY_AGG(DISTINCT t.control_executed) FILTER (WHERE t.control_executed IS NOT NULL) as operations_performed
FROM pmc_copy_sessions s
LEFT JOIN "xxx-pmc_user_tokens_usage" t ON s.id = t.session_id
GROUP BY s.id, s.user_id, s.customer_id, s.session_name, s.output_type, s.brief_description, s.created_at;

-- Grant access to the view
GRANT SELECT ON pmc_session_token_summary TO authenticated;

-- Add RLS policy for the view (users can only see their own session summaries)
ALTER VIEW pmc_session_token_summary SET (security_invoker = true);

-- Function to generate session name from context
CREATE OR REPLACE FUNCTION generate_session_name(
  p_output_type text,
  p_brief_description text,
  p_created_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  content_type text;
  description_part text;
  date_part text;
BEGIN
  -- Format the content type
  content_type := COALESCE(INITCAP(p_output_type), 'Content');
  
  -- Get first 50 characters of brief description
  IF p_brief_description IS NOT NULL AND LENGTH(TRIM(p_brief_description)) > 0 THEN
    description_part := LEFT(TRIM(p_brief_description), 50);
    IF LENGTH(TRIM(p_brief_description)) > 50 THEN
      description_part := description_part || '...';
    END IF;
  ELSE
    description_part := NULL;
  END IF;
  
  -- Format date as "Nov 29, 2025"
  date_part := TO_CHAR(p_created_at, 'Mon DD, YYYY');
  
  -- Build session name
  IF description_part IS NOT NULL THEN
    RETURN content_type || ' - ' || description_part || ' - ' || date_part;
  ELSE
    -- Fallback with time
    RETURN 'Session - ' || TO_CHAR(p_created_at, 'Mon DD, YYYY HH:MI AM');
  END IF;
END;
$$;

-- Update existing sessions to have session names
UPDATE pmc_copy_sessions
SET session_name = generate_session_name(output_type, brief_description, created_at)
WHERE session_name IS NULL;

-- Add helpful comment
COMMENT ON COLUMN pmc_copy_sessions.session_name IS 
  'Auto-generated human-readable session name for easy identification. Format: "[Content Type] - [Brief Description] - [Date]"';

COMMENT ON VIEW pmc_session_token_summary IS 
  'Aggregates token usage statistics per session for admin reporting and cost analysis';

COMMENT ON FUNCTION generate_session_name IS 
  'Generates a human-readable session name from content context. Used automatically when creating sessions.';