/*
  # Add is_public support to workflows table

  1. Changes
    - Add `is_public` boolean column to workflows table (default: false)
    - Update RLS policies to support public workflows visibility
    - Create function to auto-set is_public based on user email

  2. Security
    - Users can view their own workflows
    - All users can view public workflows
    - Only rfv@datago.net user's workflows are automatically set as public
    - Users can only update/delete their own workflows

  3. How to apply
    - Run this SQL in your Supabase SQL Editor
    - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
    - Copy and paste this entire file
    - Click "Run"
*/

-- Add is_public column to workflows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflows' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE workflows ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view own workflows" ON workflows;

-- Create new SELECT policy to allow viewing own workflows OR public workflows
CREATE POLICY "Users can view own or public workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR is_public = true
  );

-- Create function to automatically set is_public based on user email
CREATE OR REPLACE FUNCTION set_workflow_public_for_special_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the email of the user creating the workflow
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- If the user is rfv@datago.net, set is_public to true
  IF user_email = 'rfv@datago.net' THEN
    NEW.is_public := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before INSERT on workflows
DROP TRIGGER IF EXISTS auto_set_workflow_public ON workflows;
CREATE TRIGGER auto_set_workflow_public
  BEFORE INSERT ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION set_workflow_public_for_special_user();

-- Create index on is_public for faster queries
CREATE INDEX IF NOT EXISTS idx_workflows_is_public ON workflows(is_public) WHERE is_public = true;
