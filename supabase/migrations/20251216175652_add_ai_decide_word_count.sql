/*
  # Add AI Decide Word Count Option

  1. Changes to pmc_templates table
    - Add `ai_decide_word_count` (boolean, default false): Let AI decide word count without restrictions

  2. Purpose
    - Allows users to enable unrestricted word count generation
    - When enabled, AI focuses on quality and completeness without length constraints
    - Mutually exclusive with strict word count enforcement

  3. Notes
    - New column is nullable with default false for backward compatibility
    - Existing templates will have false (default) for this field
*/

-- Add ai_decide_word_count column to pmc_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'ai_decide_word_count'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN ai_decide_word_count boolean DEFAULT false;
  END IF;
END $$;
