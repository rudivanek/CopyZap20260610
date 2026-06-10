/*
  # Add force_keyword_integration column to pmc_templates table
  
  1. Changes
     - Add `force_keyword_integration` column to `pmc_templates` table
     - Add camelCase version `forceKeywordIntegration` for frontend compatibility
     
  2. Purpose
     - Support explicit SEO keyword integration feature
     - Allow saving and loading templates with this SEO optimization setting
*/

-- Add force_keyword_integration column to pmc_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'force_keyword_integration'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN force_keyword_integration BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'forceKeywordIntegration'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "forceKeywordIntegration" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create a comment explaining the column
COMMENT ON COLUMN public.pmc_templates.force_keyword_integration IS 'Forces AI to ensure all keywords appear naturally throughout the copy for better SEO';