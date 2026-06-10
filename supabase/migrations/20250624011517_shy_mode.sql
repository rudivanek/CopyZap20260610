/*
  # Add prioritize_word_count column to pmc_templates table
  
  1. New Tables
    - None - enhancing existing tables
    
  2. Changes
    - Add `prioritize_word_count` column to `pmc_templates` table
    - Ensure both camelCase and snake_case variants exist for compatibility
    
  3. Security
    - No security changes needed
*/

-- Add prioritize_word_count column to pmc_templates table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_templates' AND column_name = 'prioritize_word_count'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN prioritize_word_count BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pmc_templates' AND column_name = 'prioritizeWordCount'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN "prioritizeWordCount" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add a comment explaining the purpose
COMMENT ON COLUMN public.pmc_templates.prioritize_word_count IS 'Controls whether the AI should strictly adhere to the target word count';