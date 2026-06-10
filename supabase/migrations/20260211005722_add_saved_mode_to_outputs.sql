/*
  # Add saved_mode column to pmc_saved_outputs
  
  1. Changes
     - Add `saved_mode` column to `pmc_saved_outputs` table
       - Stores the mode (quick/standard/advanced) the output was saved in
       - Default is 'advanced' for existing records
       - NOT NULL constraint ensures all outputs have a mode
  
  2. Purpose
     - Enables frozen artifact behavior for saved outputs
     - Saved outputs will reopen in the exact mode they were saved with
     - Critical for preserving user intent and output presentation
*/

-- Add saved_mode column with default 'advanced' for existing records
ALTER TABLE public.pmc_saved_outputs 
ADD COLUMN IF NOT EXISTS saved_mode text NOT NULL DEFAULT 'advanced';

-- Add check constraint to ensure only valid modes
ALTER TABLE public.pmc_saved_outputs
ADD CONSTRAINT pmc_saved_outputs_saved_mode_check 
CHECK (saved_mode IN ('quick', 'standard', 'advanced'));