/*
  # Add description field to workflows table

  1. Changes
    - Add `description` column to workflows table (optional text field)
    - Allows users to add a helpful description/note for each workflow
  
  2. Notes
    - Description is optional and can be null
    - No data migration needed since this is a new field
*/

-- Add description column to workflows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflows' AND column_name = 'description'
  ) THEN
    ALTER TABLE workflows ADD COLUMN description text;
  END IF;
END $$;