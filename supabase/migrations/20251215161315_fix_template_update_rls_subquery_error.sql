/*
  # Fix Template Update RLS Policy Subquery Error
  
  1. Problem
    - The "Users can update own templates (no public access)" policy has a broken subquery
    - The subquery `WHERE id = pmc_templates.id` compares the column to itself (always true)
    - This causes the error: "more than one row returned by a subquery used as an expression"
  
  2. Solution
    - Drop the broken policy
    - Create a simpler policy that:
      - Allows users to update their own templates
      - Prevents users from changing is_public from false to true
      - Admin can still update any template through the separate admin policy
  
  3. Logic
    - Regular users can only update templates where is_public = false
    - This prevents them from modifying public templates or making templates public
    - Admin policy (separate) allows full control
*/

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can update own templates (no public access)" ON pmc_templates;

-- Create new policy with correct logic
CREATE POLICY "Users can update own templates (no public access)"
  ON pmc_templates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND is_public = false
  )
  WITH CHECK (
    auth.uid() = user_id
    AND is_public = false
  );
