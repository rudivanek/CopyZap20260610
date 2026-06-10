/*
  # Add SEO Keyword Integration Fields
  
  1. New Columns
     - `force_keyword_integration` column to pmc_templates table
     - camelCase version `forceKeywordIntegration` for frontend compatibility
     
  2. Purpose
     - Support explicit SEO keyword integration instructions
     - Ensure keywords appear naturally throughout the copy
     - Allow saving and loading templates with this SEO optimization setting
     
  3. Notes
     - This migration adds both snake_case and camelCase versions for database/frontend compatibility
     - Includes documentation comment explaining the purpose of the feature
*/

-- Add force_keyword_integration column to pmc_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_templates' AND column_name = 'force_keyword_integration'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN force_keyword_integration BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_templates' AND column_name = 'forceKeywordIntegration'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN "forceKeywordIntegration" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create a comment explaining the column purpose
COMMENT ON COLUMN public.pmc_templates.force_keyword_integration IS 'Forces AI to ensure all keywords appear naturally throughout the copy for better SEO';