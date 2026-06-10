/*
  # Add selected_blog_angles column to pmc_templates table

  1. Changes
    - Add selected_blog_angles column to pmc_templates table
    - Type: integer array (integer[])
    - Nullable: true
    - Default: NULL
    
  2. Purpose
    - Allows templates to specify which blog angles (0-4) to generate in All Angles mode
    - User can select 1-5 angles when using the All Angles Blog template
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'selected_blog_angles'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN selected_blog_angles integer[];
  END IF;
END $$;