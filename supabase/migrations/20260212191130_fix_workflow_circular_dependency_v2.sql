/*
  # Fix Workflow Circular Dependency (Again)

  ## Problem
  The recent security migration (20260212162540) re-introduced a circular dependency:
  - `workflows` SELECT policy checks `workflow_permissions` table
  - `workflow_permissions` SELECT policy checks `workflows` table (lines 231-234)
  - This creates infinite recursion when loading workflows

  ## Solution
  Simplify `workflow_permissions` SELECT policy to remove the workflows table query.
  Users should see permissions where:
  - They are the granted user (user_id)
  - They granted the permission (granted_by)
  - They are an admin

  Workflow owners don't need to see permissions through workflow_permissions;
  they can see their workflows directly.

  ## Changes
  - Drop and recreate workflow_permissions_select_combined without workflows dependency
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "workflow_permissions_select_combined" ON public.workflow_permissions;

-- Recreate without circular dependency
CREATE POLICY "workflow_permissions_select_combined"
  ON public.workflow_permissions FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR granted_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.app_admins 
      WHERE app_admins.email = (SELECT auth.email())
    )
  );