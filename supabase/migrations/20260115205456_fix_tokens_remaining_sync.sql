/*
  # Fix tokens_remaining synchronization issue

  1. Problem
    - tokens_remaining field is out of sync with actual token consumption
    - Users with negative balance can still generate content
    - Example: User has 60,000 allowed, consumed 78,257, but tokens_remaining shows 21,832 instead of -18,257

  2. Solution
    - Recalculate tokens_remaining for all users based on actual consumption from pmc_user_tokens_used
    - Create a trigger to automatically update tokens_remaining when tokens are tracked
    - Ensure tokens_remaining stays synchronized with pmc_user_tokens_used table

  3. Changes
    - Update all users' tokens_remaining to match actual consumption
    - Add trigger function to decrement tokens_remaining when tokens are added to pmc_user_tokens_used
    - Add index on pmc_user_tokens_used(user_id, tokens_used) for performance
*/

-- Step 1: Recalculate tokens_remaining for all users based on actual consumption
UPDATE pmc_users
SET tokens_remaining = COALESCE(tokens_allowed, 999999) - COALESCE(
  (SELECT SUM(tokens_used) FROM pmc_user_tokens_used WHERE user_id = pmc_users.id),
  0
);

-- Step 2: Create a function to automatically update tokens_remaining when tokens are consumed
CREATE OR REPLACE FUNCTION update_tokens_remaining()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement tokens_remaining when tokens are added to pmc_user_tokens_used
  UPDATE pmc_users
  SET tokens_remaining = tokens_remaining - NEW.tokens_used
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on pmc_user_tokens_used to keep tokens_remaining in sync
DROP TRIGGER IF EXISTS sync_tokens_remaining ON pmc_user_tokens_used;

CREATE TRIGGER sync_tokens_remaining
  AFTER INSERT ON pmc_user_tokens_used
  FOR EACH ROW
  EXECUTE FUNCTION update_tokens_remaining();

-- Step 4: Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_tokens_used_user_id 
  ON pmc_user_tokens_used(user_id);

-- Step 5: Log the fix
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM pmc_users
  WHERE tokens_remaining <= 0;
  
  RAISE NOTICE '✅ Fixed tokens_remaining synchronization for all users';
  RAISE NOTICE '⚠️  % users currently have zero or negative token balance', affected_count;
END $$;
