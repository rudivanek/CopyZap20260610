/*
  # Add project_description column to pmc_templates table

  1. Changes
     - Add `project_description` column to `pmc_templates` table
     - Column is optional (nullable) text field
     - Used for project organization, not included in AI prompts

  2. Notes
     - This field helps users organize their templates by project context
     - The field is for internal organization only and not sent to AI models
     - Other tables (pmc_copy_sessions, pmc_saved_outputs) already store complete form state in JSONB fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'project_description'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN project_description text;
  END IF;
END $$;