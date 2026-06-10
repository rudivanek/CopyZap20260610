/*
  # Remove public_name column from pmc_templates

  1. Changes
    - Drop `public_name` column from `pmc_templates` table
      - This field is no longer used in the application
      - Templates now use template_name for display regardless of public status

  2. Notes
    - Safe to drop as feature is not being used
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'public_name'
  ) THEN
    ALTER TABLE pmc_templates DROP COLUMN public_name;
  END IF;
END $$;
