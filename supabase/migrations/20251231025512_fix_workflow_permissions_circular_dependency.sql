/*
  # Fix Circular Dependency in Workflow RLS Policies

  1. Problem
    - workflows SELECT policy queries workflow_permissions table
    - workflow_permissions SELECT policy queries workflows table
    - This creates infinite recursion

  2. Solution
    - Simplify workflow_permissions SELECT policies to avoid querying workflows
    - Users can see permissions where they are the user_id
    - Workflow owners will see their workflows directly (they own them)
    - Admins can see everything

  3. Changes
    - Drop existing workflow_permissions SELECT policies
    - Create single simplified SELECT policy without circular dependency
*/

-- Drop existing SELECT policies on workflow_permissions
DROP POLICY IF EXISTS "Owners can view workflow permissions" ON workflow_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON workflow_permissions;

-- Create single simplified SELECT policy
CREATE POLICY "Users can view their permissions"
  ON workflow_permissions
  FOR SELECT
  TO authenticated
  USING (
    is_admin() OR 
    user_id = auth.uid()
  );
