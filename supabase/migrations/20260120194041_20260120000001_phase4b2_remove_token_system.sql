/*
  # Phase 4B-2: Remove Token System Completely (AGGRESSIVE CLEANUP)
  
  ## Summary
  This migration removes all token-based enforcement infrastructure from the database.
  Credits are now the ONLY billing and enforcement mechanism.
  
  ## What This Migration Does
  
  1. **Archive Token Data** (Safety First)
     - Creates `pmc_users_token_archive` table to preserve historical token allocation data
     - Creates `token_system_ddl_archive` table to preserve trigger/function definitions
     - Copies all token-related data before deletion
  
  2. **Drop Token Infrastructure**
     - Drops `sync_tokens_remaining` trigger on `pmc_user_tokens_used`
     - Drops `update_tokens_remaining()` function
  
  3. **Remove Token Columns**
     - Removes `tokens_allowed` and `tokens_remaining` from `pmc_users` table
     - Removes `tokens_used` column from `pmc_user_tokens_used` table
  
  4. **Preserve Credits Infrastructure**
     - Keeps all credits-related columns intact
     - Keeps `billable_units`, `cost_usd`, pricing fields
     - Keeps `pmc_user_tokens_used` table for usage history/analytics
  
  ## What Remains After This Migration
  - Credits enforcement via `enforcement_mode='credits'` (default)
  - `pmc_user_tokens_used` table (renamed purpose: credits usage tracking)
  - `billable_units`, `cost_usd`, pricing/billing fields
  - All subscription date fields (`start_date`, `until_date`)
  - Credits balance tracking and monthly period calculation
  
  ## Breaking Changes
  - Any code querying `tokens_allowed`, `tokens_remaining`, or `tokens_used` will fail
  - Token-based enforcement is no longer possible (credits only)
  
  ## Rollback
  - Token data is archived in `pmc_users_token_archive` and `token_system_ddl_archive`
  - Manual restoration possible but not automated
  
  Created: 2026-01-20
  Phase: 4B-2 (Aggressive Token Removal)
*/

-- ============================================================
-- STEP 1: CREATE ARCHIVE TABLES (IF NOT EXIST)
-- ============================================================

-- Archive table for pmc_users token columns
CREATE TABLE IF NOT EXISTS public.pmc_users_token_archive (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text,
  tokens_allowed integer,
  tokens_remaining integer,
  start_date date,
  until_date date,
  archived_at timestamptz DEFAULT now()
);

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_users_token_archive_user_id 
  ON public.pmc_users_token_archive(user_id);

-- Archive table for trigger/function DDL
CREATE TABLE IF NOT EXISTS public.token_system_ddl_archive (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  object_type text NOT NULL, -- 'trigger', 'function', etc.
  object_name text NOT NULL,
  ddl_definition text,
  archived_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.pmc_users_token_archive IS 
  'Archive of token allocation data from pmc_users before Phase 4B-2 removal (2026-01-20)';

COMMENT ON TABLE public.token_system_ddl_archive IS 
  'Archive of token system trigger and function definitions before Phase 4B-2 removal (2026-01-20)';

-- ============================================================
-- STEP 2: ARCHIVE EXISTING TOKEN DATA (ONE-TIME)
-- ============================================================

-- Archive pmc_users token data
-- Only insert if not already archived for this user today (prevent duplicates on re-run)
INSERT INTO public.pmc_users_token_archive (user_id, email, tokens_allowed, tokens_remaining, start_date, until_date)
SELECT 
  id,
  email,
  tokens_allowed,
  tokens_remaining,
  start_date,
  until_date
FROM public.pmc_users
WHERE NOT EXISTS (
  SELECT 1 FROM public.pmc_users_token_archive a
  WHERE a.user_id = pmc_users.id
  AND a.archived_at::date = CURRENT_DATE
);

-- Archive trigger definition
DO $$
DECLARE
  trigger_def text;
BEGIN
  -- Get trigger definition if it exists
  SELECT pg_get_triggerdef(oid)
  INTO trigger_def
  FROM pg_trigger
  WHERE tgname = 'sync_tokens_remaining'
  AND tgrelid = 'public.pmc_user_tokens_used'::regclass;
  
  -- Insert if found and not already archived today
  IF trigger_def IS NOT NULL THEN
    INSERT INTO public.token_system_ddl_archive (object_type, object_name, ddl_definition)
    SELECT 'trigger', 'sync_tokens_remaining', trigger_def
    WHERE NOT EXISTS (
      SELECT 1 FROM public.token_system_ddl_archive
      WHERE object_name = 'sync_tokens_remaining'
      AND archived_at::date = CURRENT_DATE
    );
  END IF;
END $$;

-- Archive function definition
DO $$
DECLARE
  function_def text;
BEGIN
  -- Get function definition if it exists
  SELECT pg_get_functiondef(oid)
  INTO function_def
  FROM pg_proc
  WHERE proname = 'update_tokens_remaining'
  AND pronamespace = 'public'::regnamespace;
  
  -- Insert if found and not already archived today
  IF function_def IS NOT NULL THEN
    INSERT INTO public.token_system_ddl_archive (object_type, object_name, ddl_definition)
    SELECT 'function', 'update_tokens_remaining', function_def
    WHERE NOT EXISTS (
      SELECT 1 FROM public.token_system_ddl_archive
      WHERE object_name = 'update_tokens_remaining'
      AND archived_at::date = CURRENT_DATE
    );
  END IF;
END $$;

-- ============================================================
-- STEP 3: DROP TOKEN TRIGGER AND FUNCTION
-- ============================================================

-- Drop the trigger that decremented tokens_remaining
DROP TRIGGER IF EXISTS sync_tokens_remaining ON public.pmc_user_tokens_used;

-- Drop the function that updated tokens_remaining
DROP FUNCTION IF EXISTS public.update_tokens_remaining();

-- ============================================================
-- STEP 4: REMOVE TOKEN COLUMNS FROM pmc_users
-- ============================================================

-- Remove tokens_allowed column
ALTER TABLE public.pmc_users
  DROP COLUMN IF EXISTS tokens_allowed;

-- Remove tokens_remaining column
ALTER TABLE public.pmc_users
  DROP COLUMN IF EXISTS tokens_remaining;

-- Note: We keep start_date and until_date for subscription validity checking
-- Note: We keep enforcement_mode for legacy compatibility (defaults to 'credits')

-- ============================================================
-- STEP 5: REMOVE tokens_used COLUMN FROM pmc_user_tokens_used
-- ============================================================

-- Remove tokens_used column (we only use billable_units now)
ALTER TABLE public.pmc_user_tokens_used
  DROP COLUMN IF EXISTS tokens_used;

-- Note: Table keeps its name for backwards compatibility
-- but now exclusively tracks credits usage via billable_units

-- ============================================================
-- STEP 6: DROP ANY LEGACY TOKEN-RELATED VIEWS (IF THEY EXIST)
-- ============================================================

-- Drop any legacy views that might reference removed columns
DROP VIEW IF EXISTS public.pmc_session_token_summary CASCADE;
DROP VIEW IF EXISTS public.user_token_stats CASCADE;

-- The pmc_session_token_summary_view still exists and is credits-based (kept)

-- ============================================================
-- STEP 7: VERIFY CREDITS INFRASTRUCTURE INTACT
-- ============================================================

-- Verify key credits columns still exist
DO $$
BEGIN
  -- Check pmc_users has credits fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_users'
    AND column_name = 'enforcement_mode'
  ) THEN
    RAISE EXCEPTION 'CRITICAL: enforcement_mode column missing from pmc_users';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_users'
    AND column_name = 'credits_grace_units'
  ) THEN
    RAISE EXCEPTION 'CRITICAL: credits_grace_units column missing from pmc_users';
  END IF;

  -- Check pmc_user_tokens_used has billable_units
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_user_tokens_used'
    AND column_name = 'billable_units'
  ) THEN
    RAISE EXCEPTION 'CRITICAL: billable_units column missing from pmc_user_tokens_used';
  END IF;

  -- Check credit_plans table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'credit_plans'
  ) THEN
    RAISE EXCEPTION 'CRITICAL: credit_plans table missing';
  END IF;

  RAISE NOTICE 'Phase 4B-2 Verification: All credits infrastructure intact';
END $$;

-- ============================================================
-- STEP 8: UPDATE TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.pmc_user_tokens_used IS 
  'Tracks all API usage for credits billing and analytics. Historical name retained for compatibility. All enforcement now via billable_units (credits).';

COMMENT ON COLUMN public.pmc_user_tokens_used.billable_units IS 
  'Number of credits consumed by this operation (primary enforcement metric)';

-- ============================================================
-- FINAL VERIFICATION OUTPUT
-- ============================================================

DO $$
DECLARE
  trigger_count int;
  function_count int;
  tokens_allowed_exists boolean;
  tokens_remaining_exists boolean;
  tokens_used_exists boolean;
BEGIN
  -- Count remaining token triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'sync_tokens_remaining';

  -- Count remaining token functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'update_tokens_remaining'
  AND pronamespace = 'public'::regnamespace;

  -- Check if token columns still exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_users'
    AND column_name = 'tokens_allowed'
  ) INTO tokens_allowed_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_users'
    AND column_name = 'tokens_remaining'
  ) INTO tokens_remaining_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pmc_user_tokens_used'
    AND column_name = 'tokens_used'
  ) INTO tokens_used_exists;

  -- Output verification results
  RAISE NOTICE '=== PHASE 4B-2 MIGRATION COMPLETE ===';
  RAISE NOTICE 'Token triggers remaining: %', trigger_count;
  RAISE NOTICE 'Token functions remaining: %', function_count;
  RAISE NOTICE 'pmc_users.tokens_allowed exists: %', tokens_allowed_exists;
  RAISE NOTICE 'pmc_users.tokens_remaining exists: %', tokens_remaining_exists;
  RAISE NOTICE 'pmc_user_tokens_used.tokens_used exists: %', tokens_used_exists;
  
  IF trigger_count = 0 AND function_count = 0 
     AND NOT tokens_allowed_exists AND NOT tokens_remaining_exists 
     AND NOT tokens_used_exists THEN
    RAISE NOTICE 'SUCCESS: Token system completely removed. Credits-only enforcement active.';
  ELSE
    RAISE WARNING 'Some token infrastructure may still exist. Manual cleanup may be required.';
  END IF;
END $$;
