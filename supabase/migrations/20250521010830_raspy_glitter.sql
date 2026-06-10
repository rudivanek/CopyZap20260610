/*
  # Add output_type column to pmc_copy_sessions table

  1. Changes
    - Add `output_type` column to `pmc_copy_sessions` table to track whether the session is for "New Copy" or "Improve Copy"
    - Add default values for existing records
*/

-- Add output_type column to pmc_copy_sessions table
ALTER TABLE public.pmc_copy_sessions
ADD COLUMN IF NOT EXISTS output_type text;

-- Set default values for existing records based on the 'tab' field in input_data
UPDATE public.pmc_copy_sessions
SET output_type = CASE 
    WHEN input_data->>'tab' = 'create' THEN 'New Copy'
    WHEN input_data->>'tab' = 'improve' THEN 'Improve Copy'
    ELSE 'Unknown'
  END
WHERE output_type IS NULL;