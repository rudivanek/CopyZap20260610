/*
  # Add prioritizeWordCount column to pmc_templates table
  
  1. New Columns
     - `prioritizeWordCount` (boolean) - Enable/disable strict word count adherence
     
  2. Purpose
     - Support exact word count requirements in templates
     - Allow users to save and load this preference
     - Ensure template functionality is complete for advanced word count control
*/

-- Add prioritizeWordCount camelCase column to match frontend property naming
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_templates' AND column_name = 'prioritizeWordCount'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN "prioritizeWordCount" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;