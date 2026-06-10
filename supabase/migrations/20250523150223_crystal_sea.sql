/*
  # Add competitorUrls to templates table
  
  1. Changes
    - Add `competitorUrls` column to `pmc_templates` table
    - This allows storing competitor URLs along with template information
    
  2. Purpose
    - Enhance template functionality by saving the complete form state
    - Ensure when templates are loaded, competitor URL information is preserved
*/

-- Add competitorUrls column to pmc_templates table as TEXT array
ALTER TABLE public.pmc_templates
ADD COLUMN IF NOT EXISTS competitor_urls TEXT[];