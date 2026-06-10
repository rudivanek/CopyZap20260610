/*
  # Add public templates functionality

  1. New Columns
    - `is_public` (boolean) - Whether template is available to all users
    - `public_name` (text) - Display name for public templates 
    - `public_description` (text) - Description for public templates

  2. Security
    - Update RLS policies to allow reading public templates
    - Add constraints to ensure public templates have required fields

  3. Indexes
    - Add index for efficient public template queries
*/

-- Add new columns for public templates
DO $$
BEGIN
  -- Add is_public column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN is_public boolean DEFAULT false;
  END IF;

  -- Add public_name column if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'public_name'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN public_name text;
  END IF;

  -- Add public_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_templates' AND column_name = 'public_description'
  ) THEN
    ALTER TABLE pmc_templates ADD COLUMN public_description text;
  END IF;
END $$;

-- Add constraints for public templates
DO $$
BEGIN
  -- Check if constraint doesn't exist before adding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'pmc_templates' 
    AND constraint_name = 'check_public_template_has_name'
  ) THEN
    ALTER TABLE pmc_templates 
    ADD CONSTRAINT check_public_template_has_name 
    CHECK (
      (is_public = false) OR 
      (is_public = true AND public_name IS NOT NULL AND length(trim(public_name)) > 0)
    );
  END IF;
END $$;

-- Create index for efficient public template queries
CREATE INDEX IF NOT EXISTS idx_pmc_templates_public 
ON pmc_templates (is_public, created_at DESC) 
WHERE is_public = true;

-- Create RLS policy to allow reading public templates
DO $$
BEGIN
  -- Drop existing policy if it exists to avoid conflicts
  DROP POLICY IF EXISTS "Allow reading public templates" ON pmc_templates;
  
  -- Create new policy for public template access
  CREATE POLICY "Allow reading public templates"
    ON pmc_templates
    FOR SELECT
    TO authenticated
    USING (is_public = true OR user_id = auth.uid());
END $$;

-- Update existing read policy to handle both private and public templates
DO $$
BEGIN
  -- Drop the old policy if it exists
  DROP POLICY IF EXISTS "Users can read their own templates" ON pmc_templates;
  
  -- Create comprehensive read policy
  CREATE POLICY "Users can read own and public templates"
    ON pmc_templates
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_public = true);
END $$;