/*
  # Add Optional Features to Templates

  1. Changes to pmc_templates table
    - Add `generate_seo_metadata` (boolean, default false): Whether to generate SEO metadata
    - Add `generate_scores` (boolean, default false): Whether to generate content scores
    - Add `generate_geo_score` (boolean, default false): Whether to generate GEO scores
    - Add `prioritize_word_count` (boolean, default false): Strict word count enforcement
    - Add `force_keyword_integration` (boolean, default false): Force SEO keyword integration
    - Add `force_elaborations_examples` (boolean, default false): Force detailed elaborations
    - Add `enhance_for_geo` (boolean, default false): Enhance for GEO optimization
    - Add `add_tldr_summary` (boolean, default false): Add TL;DR summary at top
    - Add `geo_regions` (text, nullable): Target countries or regions for GEO
    - Add `num_url_slugs` (integer, nullable): Number of URL slug variants
    - Add `num_meta_descriptions` (integer, nullable): Number of meta description variants
    - Add `num_h1_variants` (integer, nullable): Number of H1 variants
    - Add `num_h2_variants` (integer, nullable): Number of H2 variants
    - Add `num_h3_variants` (integer, nullable): Number of H3 variants
    - Add `num_og_titles` (integer, nullable): Number of OG title variants
    - Add `num_og_descriptions` (integer, nullable): Number of OG description variants
    - Add `word_count_tolerance_percentage` (numeric, nullable): Tolerance % for strict word count

  2. Purpose
    - Allows users to save their optional feature preferences with templates
    - Restores all optimization settings when loading a template
    - Ensures complete template state preservation

  3. Notes
    - All new columns are nullable or have defaults for backward compatibility
    - Existing templates will have NULL/default values for these fields
*/

-- Add optional feature columns to pmc_templates table
DO $$
BEGIN
  -- Boolean toggles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generate_seo_metadata'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN generate_seo_metadata boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generate_scores'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN generate_scores boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'generate_geo_score'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN generate_geo_score boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'prioritize_word_count'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN prioritize_word_count boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'force_keyword_integration'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN force_keyword_integration boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'force_elaborations_examples'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN force_elaborations_examples boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'enhance_for_geo'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN enhance_for_geo boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'add_tldr_summary'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN add_tldr_summary boolean DEFAULT false;
  END IF;

  -- Text and numeric fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'geo_regions'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN geo_regions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'num_url_slugs'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN num_url_slugs integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'num_meta_descriptions'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN num_meta_descriptions integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'num_h1_variants'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN num_h1_variants integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'num_h2_variants'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN num_h2_variants integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'num_h3_variants'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN num_h3_variants integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'num_og_titles'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN num_og_titles integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'num_og_descriptions'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN num_og_descriptions integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'word_count_tolerance_percentage'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN word_count_tolerance_percentage numeric(4,1);
  END IF;
END $$;