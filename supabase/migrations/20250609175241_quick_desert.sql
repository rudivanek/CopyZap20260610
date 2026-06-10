/*
  # Add generation options to templates table

  1. New Columns
    - `generateAlternative` (boolean) - Enable/disable alternative copy generation
    - `generateHumanized` (boolean) - Enable/disable humanized copy generation  
    - `generateHeadlines` (boolean) - Enable/disable headline generation
    - `generateScores` (boolean) - Enable/disable score generation
    - `selectedPersona` (text) - Selected persona for copy styling
    - `numberOfAlternativeVersions` (integer) - Number of alternative versions to generate
    - `numberOfHumanizedVersionsPerAlternative` (integer) - Number of humanized versions per alternative
    - `numberOfHeadlines` (integer) - Number of headlines to generate

  2. Security
    - No RLS changes needed as table already has proper policies

  3. Notes
    - All new columns are optional with sensible defaults
    - Maintains backward compatibility with existing templates
*/

-- Add generation option columns to pmc_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generateAlternative'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN generateAlternative boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generateHumanized'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN generateHumanized boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generateHeadlines'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN generateHeadlines boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generateScores'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN generateScores boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'selectedPersona'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN selectedPersona text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'numberOfAlternativeVersions'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN numberOfAlternativeVersions integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'numberOfHumanizedVersionsPerAlternative'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN numberOfHumanizedVersionsPerAlternative integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'numberOfHeadlines'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN numberOfHeadlines integer DEFAULT 3;
  END IF;
END $$;