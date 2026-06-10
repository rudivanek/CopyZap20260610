/*
  # Add Default Value and Constraint for Template Category
  
  1. Changes
    - Set default value for `category` column to 'Uncategorized'
    - Add NOT NULL constraint to prevent null categories
    
  2. Purpose
    - Prevents `toLowerCase()` errors when category is null
    - Ensures all templates have a valid category
*/

-- Set default value for category column
ALTER TABLE pmc_templates 
  ALTER COLUMN category SET DEFAULT 'Uncategorized';

-- Add NOT NULL constraint (all existing rows already have non-null values)
ALTER TABLE pmc_templates 
  ALTER COLUMN category SET NOT NULL;