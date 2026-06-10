/*
  # Add word count control columns to pmc_templates table

  1. New Columns
    - `adhereToLittleWordCount` (boolean, default false)
      - Controls whether flexible word count is enabled for short content targets (below 100 words)
    - `littleWordCountTolerancePercentage` (integer, default 20)
      - Percentage tolerance for little word count adherence
    - `wordCountTolerancePercentage` (numeric, default 2)
      - Percentage below target that triggers revision for strict word count control

  2. Changes
    - Add columns to existing pmc_templates table using safe ALTER TABLE statements
    - Set appropriate default values to ensure existing templates remain functional
    - Use IF NOT EXISTS checks to prevent errors if columns already exist

  These columns support the new word count control features that allow users to:
  - Enable flexible word count for short content (adhereToLittleWordCount)
  - Set tolerance percentages for word count adherence
  - Control strict word count behavior for generated content
*/

-- Add adhereToLittleWordCount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'adhereToLittleWordCount'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "adhereToLittleWordCount" boolean DEFAULT false;
  END IF;
END $$;

-- Add littleWordCountTolerancePercentage column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'littleWordCountTolerancePercentage'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "littleWordCountTolerancePercentage" integer DEFAULT 20;
  END IF;
END $$;

-- Add wordCountTolerancePercentage column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'wordCountTolerancePercentage'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "wordCountTolerancePercentage" numeric(4,1) DEFAULT 2.0;
  END IF;
END $$;