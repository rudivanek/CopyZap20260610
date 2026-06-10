/*
  # Add scope_key to pmc_copy_sessions table

  1. Changes
    - Add `scope_key` column to `pmc_copy_sessions` table (text, nullable, default 'copy-maker')
    - Backfill existing sessions with 'copy-maker' scope
    - Create index on scope_key for efficient filtering

  2. Notes
    - Existing sessions default to 'copy-maker' scope
    - CopySnap will use 'copy-snap' scope
    - This enables proper session filtering and routing
*/

-- Add scope_key column with default value
ALTER TABLE pmc_copy_sessions 
ADD COLUMN IF NOT EXISTS scope_key text DEFAULT 'copy-maker';

-- Backfill existing sessions to have 'copy-maker' scope
UPDATE pmc_copy_sessions 
SET scope_key = 'copy-maker' 
WHERE scope_key IS NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_scope_key 
ON pmc_copy_sessions(scope_key);

-- Create composite index for user_id + scope_key queries
CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_user_scope 
ON pmc_copy_sessions(user_id, scope_key);