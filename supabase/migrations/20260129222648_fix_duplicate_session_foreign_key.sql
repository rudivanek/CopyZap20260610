/*
  # Fix Duplicate Foreign Key Constraint

  ## Problem
  Two foreign key constraints exist between pmc_user_tokens_used.session_id
  and pmc_copy_sessions.id, causing PostgREST to fail with:
  "Could not embed because more than one relationship was found"

  ## Root Cause
  - Original FK: pmc_user_tokens_used_session_id_fkey (already existed)
  - Duplicate FK: fk_pmc_user_tokens_used_session_id (added in migration)
  
  ## Solution
  Drop the newly created FK constraint and keep the original one.
  
  ## Security
  - Referential integrity still maintained by original FK
  - No data loss
*/

-- Drop the duplicate FK constraint added in previous migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pmc_user_tokens_used_session_id'
      AND table_name = 'pmc_user_tokens_used'
  ) THEN
    ALTER TABLE pmc_user_tokens_used
      DROP CONSTRAINT fk_pmc_user_tokens_used_session_id;
    
    RAISE NOTICE '✅ Removed duplicate FK constraint';
  ELSE
    RAISE NOTICE 'Duplicate FK constraint already removed';
  END IF;
END $$;

-- Verify only one FK exists
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO fk_count
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'pmc_user_tokens_used'
    AND ccu.table_name = 'pmc_copy_sessions';

  IF fk_count = 1 THEN
    RAISE NOTICE '✅ Exactly one FK constraint exists (correct state)';
  ELSIF fk_count = 0 THEN
    RAISE WARNING '❌ No FK constraint found! Referential integrity not enforced.';
  ELSE
    RAISE WARNING '⚠️  Multiple FK constraints still exist: %', fk_count;
  END IF;
END $$;

-- Add comment to existing FK for documentation
COMMENT ON CONSTRAINT pmc_user_tokens_used_session_id_fkey ON pmc_user_tokens_used IS
  'Ensures session_id references valid pmc_copy_sessions row. Prevents orphaned session tracking.';
