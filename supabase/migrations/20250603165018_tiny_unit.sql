/*
  # Remove speak_like column from pmc_templates table
  
  1. Changes
     - Remove the `speak_like` column from `pmc_templates` table
     
  2. Purpose
     - The speak_like functionality has been refactored to apply after copy generation
     - The column is no longer needed for template storage
     - This change aligns the database schema with the updated application design
*/

-- Check if column exists before attempting to drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'pmc_templates' 
      AND column_name = 'speak_like'
  ) THEN
    ALTER TABLE public.pmc_templates DROP COLUMN speak_like;
  END IF;
END $$;