/*
  # Add include_section_titles column to pmc_templates

  1. Changes
    - Add `include_section_titles` boolean column to `pmc_templates` table
    - Set default value to `true` (section titles enabled by default)
    - Make the column NOT NULL with default value

  2. Purpose
    - Allows users to control whether AI-generated section titles should be included
    - When enabled, the AI will generate descriptive titles for each section in structured output
    - Defaults to true for better user experience
*/

-- Add include_section_titles column to pmc_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'include_section_titles'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN include_section_titles BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;
