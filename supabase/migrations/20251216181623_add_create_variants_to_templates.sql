/*
  # Add Create Variants Option to Templates

  1. Changes to pmc_templates table
    - Add `create_variants` (boolean, default false): Enable generating multiple variants at once
    - Add `number_of_variants` (integer, nullable): Number of variants to create (1-10)

  2. Purpose
    - Allows users to generate multiple copy variations in a single generation
    - Each variant will be unique while following the same parameters
    - Variants are labeled as "Generated copy 1", "Generated copy 2", etc.

  3. Notes
    - New columns are nullable with defaults for backward compatibility
    - Existing templates will have false/null for these fields
*/

-- Add create_variants and number_of_variants columns to pmc_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'create_variants'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN create_variants boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'number_of_variants'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN number_of_variants integer;
  END IF;
END $$;
