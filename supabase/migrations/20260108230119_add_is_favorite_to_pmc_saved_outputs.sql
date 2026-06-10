/*
  # Add Favorites Feature to Saved Outputs

  1. Changes
    - Add `is_favorite` boolean column to `pmc_saved_outputs` table
    - Default value is `false`
    - Add index for efficient filtering by favorites
  
  2. Notes
    - This enables users to mark their most important outputs as favorites
    - Allows filtering in the dashboard to show only favorited outputs
*/

-- Add is_favorite column to pmc_saved_outputs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_saved_outputs' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE pmc_saved_outputs ADD COLUMN is_favorite boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for efficient filtering by favorites
CREATE INDEX IF NOT EXISTS idx_pmc_saved_outputs_is_favorite ON pmc_saved_outputs(user_id, is_favorite, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN pmc_saved_outputs.is_favorite IS 'Marks output as a user favorite for quick filtering';
