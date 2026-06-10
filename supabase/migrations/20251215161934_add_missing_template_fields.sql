/*
  # Add Missing Template Fields

  1. Problem
    - Several form fields are not being saved with templates
    - Users lose their settings when saving and reloading templates
    - Fields like output_structure, section, location, etc. are missing

  2. New Columns
    - `section` (text): Page section being targeted
    - `location` (text): Geographic location for targeting
    - `include_section_titles` (boolean): Whether to include AI-generated section titles
    - `generateheadlines` (boolean): Whether to generate headlines (already exists as camelCase)
    - Note: output_structure, excluded_terms, selectedPersona, numberOfHeadlines already exist

  3. Purpose
    - Ensure complete template state preservation
    - Allow users to save and restore all form settings
*/

-- Add include_section_titles column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'include_section_titles'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN include_section_titles boolean DEFAULT true;
  END IF;
END $$;

-- Add section column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'section'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN section text;
  END IF;
END $$;

-- Add location column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN location text;
  END IF;
END $$;
