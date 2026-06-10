/*
  # Add last_accessed_at to pmc_copy_sessions and pmc_saved_outputs

  ## Summary
  Adds a `last_accessed_at` timestamp column to both tables so the sidebar
  can sort "Recent Sessions" and "Recent Projects" by the last time the user
  opened or viewed the item, independent of when it was created or saved.

  ## Changes

  ### pmc_copy_sessions
  - Adds `last_accessed_at` (timestamptz, nullable, default null)
  - Adds index `idx_pmc_copy_sessions_last_accessed_at` on (user_id, last_accessed_at DESC)

  ### pmc_saved_outputs
  - Adds `last_accessed_at` (timestamptz, nullable, default null)
  - Adds index `idx_pmc_saved_outputs_last_accessed_at` on (user_id, last_accessed_at DESC)

  ## Notes
  - Existing rows will have NULL for last_accessed_at; queries fall back to created_at when null.
  - The column is updated via a lightweight RPC (touch_session_accessed / touch_output_accessed)
    called every time the item is opened, without requiring a full record save.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_copy_sessions' AND column_name = 'last_accessed_at'
  ) THEN
    ALTER TABLE pmc_copy_sessions ADD COLUMN last_accessed_at timestamptz DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_saved_outputs' AND column_name = 'last_accessed_at'
  ) THEN
    ALTER TABLE pmc_saved_outputs ADD COLUMN last_accessed_at timestamptz DEFAULT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_last_accessed
  ON pmc_copy_sessions (user_id, last_accessed_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_pmc_saved_outputs_last_accessed
  ON pmc_saved_outputs (user_id, last_accessed_at DESC NULLS LAST);

-- RPC: touch session access timestamp (authenticated user can only touch their own)
CREATE OR REPLACE FUNCTION touch_session_accessed(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE pmc_copy_sessions
  SET last_accessed_at = now()
  WHERE id = p_session_id
    AND user_id = auth.uid();
END;
$$;

-- RPC: touch saved output access timestamp (authenticated user can only touch their own)
CREATE OR REPLACE FUNCTION touch_output_accessed(p_output_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE pmc_saved_outputs
  SET last_accessed_at = now()
  WHERE id = p_output_id
    AND user_id = auth.uid();
END;
$$;
