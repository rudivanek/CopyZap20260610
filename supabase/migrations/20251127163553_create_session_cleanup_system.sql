/*
  # Auto-Cleanup System for Copy Sessions

  ## Purpose
  Implements automatic cleanup for old copy sessions to prevent database bloat.
  Copy sessions are meant to be temporary "working drafts" while saved outputs
  are permanent "bookmarks".

  ## Changes Made
  1. Enable pg_cron extension for scheduled tasks
  2. Create function to delete sessions older than 30 days
  3. Create function to limit each user to their 50 most recent sessions
  4. Schedule daily cleanup job at 2 AM UTC
  5. Add helpful indexes for cleanup performance

  ## Retention Policy
  - Sessions older than 30 days: Automatically deleted
  - Sessions per user limit: Keep only most recent 50
  - Saved outputs: Never auto-deleted (user controls)

  ## Security
  - Functions run with security definer privileges
  - Only affects sessions, never touches saved_outputs
*/

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_created_at 
  ON pmc_copy_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_user_created 
  ON pmc_copy_sessions(user_id, created_at DESC);

-- Function to delete sessions older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_copy_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions older than 30 days
  DELETE FROM pmc_copy_sessions
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup action
  RAISE NOTICE 'Cleaned up % old copy sessions', deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Function to limit each user to their 50 most recent sessions
CREATE OR REPLACE FUNCTION cleanup_excess_user_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  batch_deleted INTEGER;
  user_record RECORD;
BEGIN
  -- For each user, keep only their 50 most recent sessions
  FOR user_record IN 
    SELECT user_id, COUNT(*) as session_count
    FROM pmc_copy_sessions
    GROUP BY user_id
    HAVING COUNT(*) > 50
  LOOP
    -- Delete sessions beyond the 50 most recent
    DELETE FROM pmc_copy_sessions
    WHERE id IN (
      SELECT id
      FROM pmc_copy_sessions
      WHERE user_id = user_record.user_id
      ORDER BY created_at DESC
      OFFSET 50
    );
    
    GET DIAGNOSTICS batch_deleted = ROW_COUNT;
    deleted_count := deleted_count + batch_deleted;
  END LOOP;
  
  -- Log the cleanup action
  RAISE NOTICE 'Cleaned up % excess user sessions', deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Combined cleanup function that runs both cleanups
CREATE OR REPLACE FUNCTION cleanup_copy_sessions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_sessions_deleted INTEGER;
  excess_sessions_deleted INTEGER;
BEGIN
  -- Run both cleanup operations
  old_sessions_deleted := cleanup_old_copy_sessions();
  excess_sessions_deleted := cleanup_excess_user_sessions();
  
  -- Return summary as JSON
  RETURN json_build_object(
    'old_sessions_deleted', old_sessions_deleted,
    'excess_sessions_deleted', excess_sessions_deleted,
    'total_deleted', old_sessions_deleted + excess_sessions_deleted,
    'cleanup_time', NOW()
  );
END;
$$;

-- Schedule daily cleanup at 2 AM UTC
-- Note: pg_cron uses UTC timezone
SELECT cron.schedule(
  'cleanup-copy-sessions-daily',
  '0 2 * * *',
  $$SELECT cleanup_copy_sessions();$$
);

-- Grant execute permissions to authenticated users (for manual cleanup if needed)
GRANT EXECUTE ON FUNCTION cleanup_old_copy_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_excess_user_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_copy_sessions() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION cleanup_copy_sessions() IS 
  'Runs daily at 2 AM UTC to clean up old copy sessions. Deletes sessions older than 30 days and limits each user to 50 most recent sessions.';
