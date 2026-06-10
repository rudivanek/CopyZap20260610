/*
  # Add project_description to token usage tracking

  1. New Columns
    - `project_description` (text, nullable) - Description of the project for organization purposes
  
  2. Changes
    - Add project_description column to pmc_user_tokens_usage table for better organization and tracking
*/

-- Add project_description column to pmc_user_tokens_usage table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pmc_user_tokens_usage' 
    AND column_name = 'project_description'
  ) THEN
    ALTER TABLE pmc_user_tokens_usage 
    ADD COLUMN project_description text;
  END IF;
END $$;