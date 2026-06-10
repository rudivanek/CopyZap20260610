/*
  # Add customer and brand voice to templates

  1. Changes
    - Add `customer_id` column to `pmc_templates` table to associate templates with customers
    - Add `brand_voice_id` column to `pmc_templates` table to save brand voice preferences
    - Add foreign key constraints to ensure data integrity
    - Add indexes for better query performance

  2. Purpose
    - Allow templates to remember which customer they're for
    - Allow templates to save brand voice selections
    - Improve organization and reusability of templates
*/

-- Add customer_id column to pmc_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.pmc_templates
    ADD COLUMN customer_id uuid REFERENCES public.pmc_customers(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_pmc_templates_customer_id
    ON public.pmc_templates(customer_id);
  END IF;
END $$;

-- Add brand_voice_id column to pmc_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'brand_voice_id'
  ) THEN
    ALTER TABLE public.pmc_templates
    ADD COLUMN brand_voice_id uuid REFERENCES public.pmc_public_brand_voices(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_pmc_templates_brand_voice_id
    ON public.pmc_templates(brand_voice_id);
  END IF;
END $$;
