/*
  # Add output_structure column to pmc_templates table

  1. Changes
    - Add new `output_structure` column of type TEXT[] to `pmc_templates` table
      The column will store an array of text values representing the structure options for the output
    
  2. Why
    - This column is required by the application for saving and loading templates with output structure preferences
    - Without this column, template saving and loading functionality fails
*/

-- Add output_structure column to pmc_templates table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pmc_templates' AND column_name = 'output_structure'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN output_structure TEXT[] DEFAULT '{}';
  END IF;
END $$;