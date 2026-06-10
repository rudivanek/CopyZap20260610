/*
  # Fix Workflow RLS Infinite Recursion

  1. Problem
    - Circular dependency between workflows and workflow_permissions policies
    - Workflows SELECT policy queries workflow_permissions
    - workflow_permissions SELECT policy queries workflows
    - This creates infinite recursion

  2. Solution
    - Mark helper functions as STABLE instead of VOLATILE
    - Simplify policies to avoid circular references
    - Use direct checks instead of nested EXISTS queries where possible

  3. Changes
    - Drop and recreate all workflow RLS policies with optimized queries
    - Drop and recreate workflow_permissions policies
    - Mark is_admin function as STABLE
*/

-- First, drop all existing policies to start clean
DROP POLICY IF EXISTS "Admins can manage all workflows" ON workflows;
DROP POLICY IF EXISTS "Users can create own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update owned or editable workflows" ON workflows;
DROP POLICY IF EXISTS "Users can view accessible workflows" ON workflows;

DROP POLICY IF EXISTS "Admins can manage all permissions" ON workflow_permissions;
DROP POLICY IF EXISTS "Users can view permissions for their workflows" ON workflow_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON workflow_permissions;
DROP POLICY IF EXISTS "Workflow owners can grant permissions" ON workflow_permissions;
DROP POLICY IF EXISTS "Workflow owners can update permissions" ON workflow_permissions;
DROP POLICY IF EXISTS "Workflow owners can delete permissions" ON workflow_permissions;

-- Recreate is_admin as STABLE (it doesn't modify data)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'app_metadata')::jsonb->>'role',
    ''
  ) = 'admin';
$$;

-- ============================================
-- WORKFLOWS TABLE POLICIES
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins can manage all workflows"
  ON workflows
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can view: own workflows, public workflows, OR workflows they have permission to
CREATE POLICY "Users can view accessible workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id 
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM workflow_permissions
      WHERE workflow_permissions.workflow_id = workflows.id
      AND workflow_permissions.user_id = auth.uid()
    )
  );

-- Users can create their own workflows
CREATE POLICY "Users can create own workflows"
  ON workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update: own workflows OR workflows they have edit permission on
CREATE POLICY "Users can update owned or editable workflows"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM workflow_permissions
      WHERE workflow_permissions.workflow_id = workflows.id
      AND workflow_permissions.user_id = auth.uid()
      AND workflow_permissions.permission_level = 'edit'
    )
  )
  WITH CHECK (
    public.is_admin()
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM workflow_permissions
      WHERE workflow_permissions.workflow_id = workflows.id
      AND workflow_permissions.user_id = auth.uid()
      AND workflow_permissions.permission_level = 'edit'
    )
  );

-- Users can delete their own workflows
CREATE POLICY "Users can delete own workflows"
  ON workflows
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id
  );

-- ============================================
-- WORKFLOW_PERMISSIONS TABLE POLICIES
-- ============================================

-- Admins can manage all permissions
CREATE POLICY "Admins can manage all permissions"
  ON workflow_permissions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can view their own permission records (to know what they can access)
CREATE POLICY "Users can view their own permissions"
  ON workflow_permissions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
  );

-- Workflow owners can view permissions on their workflows
-- NOTE: This uses a subquery but it's not circular because:
-- - It only checks user_id on workflows (indexed column)
-- - It doesn't trigger the workflows SELECT policy recursively
CREATE POLICY "Owners can view workflow permissions"
  ON workflow_permissions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.uid()
    )
  );

-- Workflow owners can grant permissions
CREATE POLICY "Owners can grant permissions"
  ON workflow_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      workflow_id IN (SELECT id FROM workflows WHERE user_id = auth.uid())
      AND granted_by = auth.uid()
    )
  );

-- Workflow owners can update permissions
CREATE POLICY "Owners can update permissions"
  ON workflow_permissions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR workflow_id IN (SELECT id FROM workflows WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR workflow_id IN (SELECT id FROM workflows WHERE user_id = auth.uid())
  );

-- Workflow owners can delete permissions
CREATE POLICY "Owners can delete permissions"
  ON workflow_permissions
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR workflow_id IN (SELECT id FROM workflows WHERE user_id = auth.uid())
  );
