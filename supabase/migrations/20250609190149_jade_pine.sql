/*
  # Add section breakdown and force elaborations columns to pmc_templates table
  
  1. Changes
     - Add `section_breakdown` column to `pmc_templates` table to store section-by-section word count allocation
     - Add `force_elaborations_examples` column to `pmc_templates` table to store toggle for forcing elaborations
     - Add both camelCase and snake_case versions for compatibility
     
  2. Purpose
     - Support new Pro Mode features for better word count adherence
     - Allow saving and loading templates with these advanced word count control features
     - Help meet user-requested word counts more consistently
*/

-- Add section_breakdown column to pmc_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'section_breakdown'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN section_breakdown TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'sectionBreakdown'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "sectionBreakdown" TEXT;
  END IF;
END $$;

-- Add force_elaborations_examples column to pmc_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'force_elaborations_examples'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN force_elaborations_examples BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'forceElaborationsExamples'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "forceElaborationsExamples" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create a comment explaining the columns
COMMENT ON COLUMN public.pmc_templates.section_breakdown IS 'Stores section-by-section word count allocation to help meet requested word count';
COMMENT ON COLUMN public.pmc_templates.force_elaborations_examples IS 'Forces AI to provide detailed explanations, examples, and case studies to expand content';