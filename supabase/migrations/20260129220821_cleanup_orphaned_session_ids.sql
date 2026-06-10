/*
  # Cleanup Orphaned Session IDs in Token Usage

  ## Problem
  Some pmc_user_tokens_used records have session_id values that don't exist
  in pmc_copy_sessions, causing "No Session" to appear in Dashboard.

  ## Solution
  Create pmc_copy_sessions rows for all orphaned session_ids by:
  1. Finding all distinct session_ids in usage table that don't exist in sessions table
  2. Creating a sessions row for each orphan with inferred metadata
  3. Setting session_name to "Recovered Session : <date>"

  ## Security
  - Admin-only migration
  - Does not modify existing session records
  - Only creates new records for orphans

  ## Important
  - This migration must run BEFORE adding FK constraints
  - One-time cleanup for historical data
*/

-- Step 1: Create sessions for orphaned session_ids
DO $$
DECLARE
  orphan_record RECORD;
  session_created INTEGER := 0;
BEGIN
  -- Find all distinct orphaned session_ids
  FOR orphan_record IN
    SELECT DISTINCT
      u.session_id,
      u.user_id,
      MIN(u.created_at) as first_usage_at,
      MAX(u.operation_type) as operation_type
    FROM pmc_user_tokens_used u
    WHERE u.session_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM pmc_copy_sessions s
        WHERE s.id = u.session_id
      )
    GROUP BY u.session_id, u.user_id
  LOOP
    -- Create a recovered session for this orphan
    INSERT INTO pmc_copy_sessions (
      id,
      user_id,
      session_name,
      output_type,
      brief_description,
      created_at
    ) VALUES (
      orphan_record.session_id,
      orphan_record.user_id,
      'Recovered Session : ' || TO_CHAR(orphan_record.first_usage_at, 'Mon DD, YYYY HH:MI AM'),
      orphan_record.operation_type,
      'Automatically recovered session from historical usage data',
      orphan_record.first_usage_at
    )
    ON CONFLICT (id) DO NOTHING;

    session_created := session_created + 1;
  END LOOP;

  RAISE NOTICE 'Created % recovered sessions for orphaned session_ids', session_created;
END $$;

-- Step 2: Verify cleanup
DO $$
DECLARE
  remaining_orphans INTEGER;
BEGIN
  SELECT COUNT(DISTINCT session_id)
  INTO remaining_orphans
  FROM pmc_user_tokens_used u
  WHERE u.session_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pmc_copy_sessions s
      WHERE s.id = u.session_id
    );

  IF remaining_orphans > 0 THEN
    RAISE WARNING 'Still have % orphaned session_ids after cleanup!', remaining_orphans;
  ELSE
    RAISE NOTICE '✅ All orphaned session_ids have been resolved';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE pmc_copy_sessions IS
  'Copy generation sessions. All rows with "Recovered Session" prefix were auto-created during cleanup migration 20260129000001.';
