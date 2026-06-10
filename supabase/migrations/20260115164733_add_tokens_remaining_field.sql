/*
  # Add tokens_remaining field to pmc_users

  1. Changes
    - Add `tokens_remaining` column to track remaining tokens for the user
    - This field will be updated whenever tokens are consumed or the plan is modified
    - Provides fast access check without needing to query token usage table
    
  2. Notes
    - Defaults to tokens_allowed value for existing users
    - Can be negative if user exceeds limit (for tracking purposes)
*/

-- Add tokens_remaining column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_users' AND column_name = 'tokens_remaining'
  ) THEN
    ALTER TABLE pmc_users ADD COLUMN tokens_remaining numeric DEFAULT 999999;
    
    -- Initialize tokens_remaining to match tokens_allowed for existing users
    UPDATE pmc_users SET tokens_remaining = COALESCE(tokens_allowed, 999999);
  END IF;
END $$;