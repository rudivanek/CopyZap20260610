/*
  # Add public_name column to pmc_templates

  1. Changes
    - Add `public_name` column to `pmc_templates` table
      - Used for display name when templates are public
      - Nullable to support existing templates
      - Text type for flexible naming

  2. Notes
    - Existing templates will have NULL public_name
    - Public templates should set this for better UX
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'public_name'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN public_name text;
  END IF;
END $$;
