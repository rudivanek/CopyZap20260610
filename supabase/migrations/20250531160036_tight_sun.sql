/*
  # Add speak_like column to pmc_templates table
  
  1. Changes
     - Add `speak_like` column to `pmc_templates` table to store the selected voice style option
     - The column stores the name of the well-known communicator whose style should be emulated
     
  2. Purpose
     - Support the new "Speak Like" feature for voice style emulation
     - Allow saving and loading templates with voice style preferences
*/

-- Add speak_like column to pmc_templates table if it doesn't exist
ALTER TABLE public.pmc_templates
ADD COLUMN IF NOT EXISTS speak_like TEXT;

-- Create a comment explaining the column
COMMENT ON COLUMN public.pmc_templates.speak_like IS 'Stores the name of a well-known communicator whose voice style should be emulated (e.g., Steve Jobs, Simon Sinek)';