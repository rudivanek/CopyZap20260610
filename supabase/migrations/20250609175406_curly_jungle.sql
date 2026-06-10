/*
  # Add missing template columns with correct camelCase names

  1. New Columns
    - Add camelCase versions of generation option columns
    - Add camelCase versions of count control columns
    - Add camelCase version of selectedPersona column
  
  2. Data Migration
    - Copy data from existing snake_case columns to new camelCase columns
    - Preserve existing data integrity
  
  3. Notes
    - PostgreSQL requires quoted identifiers to preserve camelCase
    - This ensures compatibility with the frontend application
*/

-- Add the missing camelCase columns
DO $$
BEGIN
  -- Add generateAlternative column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generateAlternative'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "generateAlternative" boolean DEFAULT false;
  END IF;

  -- Add generateHumanized column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generateHumanized'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "generateHumanized" boolean DEFAULT false;
  END IF;

  -- Add generateHeadlines column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generateHeadlines'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "generateHeadlines" boolean DEFAULT false;
  END IF;

  -- Add generateScores column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generateScores'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "generateScores" boolean DEFAULT false;
  END IF;

  -- Add selectedPersona column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'selectedPersona'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "selectedPersona" text;
  END IF;

  -- Add numberOfAlternativeVersions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'numberOfAlternativeVersions'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "numberOfAlternativeVersions" integer DEFAULT 1;
  END IF;

  -- Add numberOfHumanizedVersionsPerAlternative column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'numberOfHumanizedVersionsPerAlternative'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "numberOfHumanizedVersionsPerAlternative" integer DEFAULT 1;
  END IF;

  -- Add numberOfHeadlines column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'numberOfHeadlines'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN "numberOfHeadlines" integer DEFAULT 3;
  END IF;
END $$;

-- Copy data from existing snake_case columns to new camelCase columns
UPDATE pmc_templates SET
  "generateAlternative" = COALESCE(generatealternative, false),
  "generateHumanized" = COALESCE(generatehumanized, false),
  "generateHeadlines" = COALESCE(generateheadlines, false),
  "generateScores" = COALESCE(generatescores, false),
  "selectedPersona" = selectedpersona,
  "numberOfAlternativeVersions" = COALESCE(numberofalternativeversions, 1),
  "numberOfHumanizedVersionsPerAlternative" = COALESCE(numberofhumanizedversionsperalternative, 1),
  "numberOfHeadlines" = COALESCE(numberofheadlines, 3)
WHERE id IS NOT NULL;