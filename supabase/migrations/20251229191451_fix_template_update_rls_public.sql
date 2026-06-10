/*
  # Fix Template Update RLS Policy

  1. Changes
    - Drop the overly restrictive update policy that prevents users from updating their own public templates
    - Create a new policy that allows users to update their own templates regardless of is_public status
    - Users can update their own templates whether public or private
    - Only the owner (user_id = auth.uid()) can update their templates

  2. Security
    - Users can only update templates they own
    - Public templates can be read by everyone but only updated by owner
    - Admin policy remains unchanged for admin access
*/

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can update own templates (no public access)" ON pmc_templates;

-- Create a new policy that allows users to update their own templates (public or private)
CREATE POLICY "Users can update their own templates"
  ON pmc_templates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
