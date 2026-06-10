/*
  # Add session_id to token usage tracking

  1. Table Changes
    - Add `session_id` column to `pmc_user_tokens_usage` table
      - `session_id` (uuid, optional, foreign key to pmc_copy_sessions)

  2. Indexes
    - Add index on `session_id` for efficient querying

  3. Security
    - No RLS changes needed (inherits existing policies)
*/

-- Add session_id column to pmc_user_tokens_usage table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_user_tokens_usage' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE pmc_user_tokens_usage ADD COLUMN session_id uuid;
  END IF;
END $$;

-- Add foreign key constraint to pmc_copy_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pmc_user_tokens_usage_session_id_fkey'
  ) THEN
    ALTER TABLE pmc_user_tokens_usage 
    ADD CONSTRAINT pmc_user_tokens_usage_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES pmc_copy_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on session_id for efficient querying
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pmc_user_tokens_usage' AND indexname = 'idx_pmc_user_tokens_usage_session_id'
  ) THEN
    CREATE INDEX idx_pmc_user_tokens_usage_session_id ON pmc_user_tokens_usage(session_id);
  END IF;
END $$;