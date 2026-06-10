/*
  # Add Foreign Key Constraint for Session ID

  ## Purpose
  Enforce referential integrity between pmc_user_tokens_used.session_id
  and pmc_copy_sessions.id to prevent orphaned session_ids going forward.

  ## Changes
  1. Add FK constraint with ON DELETE SET NULL
     - If a session is deleted, usage records keep their data but lose session link
     - Allows NULL session_id (for backward compatibility)
  
  2. Add index on session_id if not exists (for FK performance)

  ## Security
  - This migration runs AFTER cleanup migration
  - All existing orphans have been resolved
  - New inserts will be validated by database

  ## Important
  - This prevents the "No Session" / "Untracked Session" issue going forward
  - Application code already validates session_id exists before tracking
*/

-- Add index on session_id for FK performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_used_session_id_fk
  ON pmc_user_tokens_used(session_id)
  WHERE session_id IS NOT NULL;

-- Add foreign key constraint
-- This will fail if there are still orphaned session_ids (cleanup must run first)
DO $$
BEGIN
  -- Check if FK already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pmc_user_tokens_used_session_id'
      AND table_name = 'pmc_user_tokens_used'
  ) THEN
    -- Add FK constraint
    ALTER TABLE pmc_user_tokens_used
      ADD CONSTRAINT fk_pmc_user_tokens_used_session_id
      FOREIGN KEY (session_id)
      REFERENCES pmc_copy_sessions(id)
      ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Foreign key constraint added successfully';
  ELSE
    RAISE NOTICE 'FK constraint already exists, skipping';
  END IF;
END $$;

-- Verify constraint
DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pmc_user_tokens_used_session_id'
      AND table_name = 'pmc_user_tokens_used'
  ) INTO fk_exists;

  IF fk_exists THEN
    RAISE NOTICE '✅ Foreign key constraint verified: pmc_user_tokens_used.session_id -> pmc_copy_sessions.id';
  ELSE
    RAISE WARNING '❌ Foreign key constraint not found after creation!';
  END IF;
END $$;

-- Add comment
COMMENT ON CONSTRAINT fk_pmc_user_tokens_used_session_id ON pmc_user_tokens_used IS
  'Ensures session_id references valid pmc_copy_sessions row. Added in migration 20260129000002 to prevent orphaned sessions.';
