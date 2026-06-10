/*
  # Add competitor_urls to pmc_templates table
  
  1. Changes
     - Add `competitor_urls` column to `pmc_templates` table
     - This allows storing competitor URLs as a text array
     - Updates the template saving functionality to include competitor URLs
  
  2. Security
     - No security changes needed, using existing RLS policies
*/

-- Add competitor_urls column to pmc_templates table
ALTER TABLE public.pmc_templates
ADD COLUMN IF NOT EXISTS competitor_urls TEXT[];