/*
  # Add Performance Indexes for Token Usage

  1. New Indexes
    - Index on `pmc_user_tokens_used.created_at` for date range filtering
    - Index on `pmc_user_tokens_used.user_id` for user filtering
    - Composite index on `(user_id, created_at)` for combined filtering
    - Index on `(created_at DESC)` for sorting

  2. Performance Impact
    - Dramatically improves query speed for date range filters
    - Speeds up user-specific token usage lookups
    - Enables efficient sorting by date
    - Reduces full table scans

  3. Notes
    - These indexes are critical for dashboard performance with large datasets
    - The composite index helps when filtering by both user and date range
*/

-- Add index for date filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_created_at
  ON pmc_user_tokens_used(created_at DESC);

-- Add index for user filtering
CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_user_id
  ON pmc_user_tokens_used(user_id);

-- Add composite index for user + date filtering (most efficient for combined queries)
CREATE INDEX IF NOT EXISTS idx_pmc_user_tokens_user_date
  ON pmc_user_tokens_used(user_id, created_at DESC);
