/*
  # Add generate_seo_metadata column to pmc_templates table

  1. Changes
    - Add `generate_seo_metadata` boolean column to `pmc_templates` table
    - Set default value to `false`
    - Make the column nullable to handle existing records

  2. Notes
    - This column tracks whether SEO metadata should be generated for templates
    - Default value ensures backward compatibility with existing templates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generate_seo_metadata'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN generate_seo_metadata boolean DEFAULT false;
  END IF;
END $$;