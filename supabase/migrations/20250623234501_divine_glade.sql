/*
  # Add prioritize_word_count column to templates

  1. Changes
    - Add `prioritize_word_count` column to `pmc_templates` table
    - Set as boolean type with default value false
    - Column is nullable to maintain compatibility with existing records

  This migration resolves the error where the application tries to save templates
  with the prioritizeWordCount field but the database column doesn't exist.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'prioritize_word_count'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN prioritize_word_count boolean DEFAULT false;
  END IF;
END $$;