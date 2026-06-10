/*
  # Add Workflow Permissions System

  1. New Tables
    - `workflow_permissions`
      - `id` (uuid, primary key)
      - `workflow_id` (uuid, references workflows)
      - `user_id` (uuid, references auth.users) - user who receives access
      - `granted_by` (uuid, references auth.users) - user who granted access
      - `permission_level` (text) - 'view' or 'edit'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Workflows Table
    - None required (already has is_public column)

  3. Security
    - Enable RLS on workflow_permissions table
    - Users can view permissions for workflows they own
    - Users can view their own permissions
    - Workflow owners can create/update/delete permissions for their workflows
    - Admins can manage all permissions

  4. Indexes
    - Index on workflow_id for fast permission lookups
    - Index on user_id for finding all workflows a user has access to
    - Unique constraint on (workflow_id, user_id) to prevent duplicate permissions

  5. Updated Workflow Access Logic
    - Users can view workflows if:
      - They own it
      - It's public
      - They have explicit permission (view or edit)
    - Users can edit workflows if:
      - They own it
      - They have 'edit' permission
      - They are admin
*/

-- Create workflow_permissions table
CREATE TABLE IF NOT EXISTS workflow_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text NOT NULL CHECK (permission_level IN ('view', 'edit')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_workflow_user UNIQUE (workflow_id, user_id)
);

-- Enable RLS
ALTER TABLE workflow_permissions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_workflow_id ON workflow_permissions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_user_id ON workflow_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_granted_by ON workflow_permissions(granted_by);

-- RLS Policies for workflow_permissions

-- Users can view permissions for workflows they own
CREATE POLICY "Users can view permissions for their workflows"
  ON workflow_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_permissions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Users can view their own permissions (to know what workflows they have access to)
CREATE POLICY "Users can view their own permissions"
  ON workflow_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Workflow owners can create permissions for their workflows
CREATE POLICY "Workflow owners can grant permissions"
  ON workflow_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_permissions.workflow_id
      AND workflows.user_id = auth.uid()
    )
    AND granted_by = auth.uid()
  );

-- Workflow owners can update permissions for their workflows
CREATE POLICY "Workflow owners can update permissions"
  ON workflow_permissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_permissions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_permissions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Workflow owners can delete permissions for their workflows
CREATE POLICY "Workflow owners can delete permissions"
  ON workflow_permissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_permissions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Admins can manage all permissions
CREATE POLICY "Admins can manage all permissions"
  ON workflow_permissions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Update workflows SELECT policy to include permission-based access
DROP POLICY IF EXISTS "Users can view own or public workflows" ON workflows;

CREATE POLICY "Users can view accessible workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM workflow_permissions
      WHERE workflow_permissions.workflow_id = workflows.id
      AND workflow_permissions.user_id = auth.uid()
    )
  );

-- Update workflows UPDATE policy to include edit permission
DROP POLICY IF EXISTS "Users can update own workflows" ON workflows;

CREATE POLICY "Users can update owned or editable workflows"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM workflow_permissions
      WHERE workflow_permissions.workflow_id = workflows.id
      AND workflow_permissions.user_id = auth.uid()
      AND workflow_permissions.permission_level = 'edit'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM workflow_permissions
      WHERE workflow_permissions.workflow_id = workflows.id
      AND workflow_permissions.user_id = auth.uid()
      AND workflow_permissions.permission_level = 'edit'
    )
  );

-- Create updated_at trigger for workflow_permissions
CREATE OR REPLACE FUNCTION update_workflow_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_workflow_permissions_updated_at
  BEFORE UPDATE ON workflow_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_permissions_updated_at();

-- Helper function to check if user can edit a workflow
CREATE OR REPLACE FUNCTION can_edit_workflow(workflow_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workflows
    WHERE id = workflow_uuid
    AND (
      user_id = user_uuid
      OR EXISTS (
        SELECT 1 FROM workflow_permissions
        WHERE workflow_id = workflow_uuid
        AND user_id = user_uuid
        AND permission_level = 'edit'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can view a workflow
CREATE OR REPLACE FUNCTION can_view_workflow(workflow_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workflows
    WHERE id = workflow_uuid
    AND (
      user_id = user_uuid
      OR is_public = true
      OR EXISTS (
        SELECT 1 FROM workflow_permissions
        WHERE workflow_id = workflow_uuid
        AND user_id = user_uuid
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON workflow_permissions TO authenticated;
