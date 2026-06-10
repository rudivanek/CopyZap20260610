/*
  # Add new columns to pmc_templates table
  
  1. Changes
     - Add missing columns to support new template features:
       - product_service_name (text)
       - industry_niche (text)
       - tone_level (integer)
       - reader_funnel_stage (text)
       - competitor_copy_text (text)
       - target_audience_pain_points (text)
       - preferred_writing_style (text)
       - language_style_constraints (text[])
     
  2. Notes
     - Some columns are already present in the schema (description, competitor_urls, output_structure)
     - Using IF NOT EXISTS to safely add columns even if some may already exist
*/

-- Use PL/pgSQL to conditionally add columns only if they don't exist
DO $$
BEGIN
  -- Add product_service_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'product_service_name'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN product_service_name text;
  END IF;

  -- Add industry_niche column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'industry_niche'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN industry_niche text;
  END IF;

  -- Add tone_level column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'tone_level'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN tone_level integer;
  END IF;

  -- Add reader_funnel_stage column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'reader_funnel_stage'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN reader_funnel_stage text;
  END IF;

  -- Add competitor_copy_text column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'competitor_copy_text'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN competitor_copy_text text;
  END IF;

  -- Add target_audience_pain_points column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'target_audience_pain_points'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN target_audience_pain_points text;
  END IF;

  -- Add preferred_writing_style column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'preferred_writing_style'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN preferred_writing_style text;
  END IF;

  -- Add language_style_constraints column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'language_style_constraints'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN language_style_constraints text[];
  END IF;
END $$;

-- Ensure that the policies for this table still work with the new columns
-- We don't need to modify them as long as they're based on user_id