-- Add description column to pmc_templates table
ALTER TABLE public.pmc_templates
ADD COLUMN IF NOT EXISTS description TEXT;