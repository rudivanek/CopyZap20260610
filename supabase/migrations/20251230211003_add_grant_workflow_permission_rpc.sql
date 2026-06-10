/*
  # Add RPC function for granting workflow permissions

  1. New Functions
    - `grant_workflow_permission` - Safely grants workflow permission by looking up user by email

  2. Security
    - Function runs with SECURITY DEFINER to access auth.users table
    - Only accessible to authenticated users
    - Validates that user exists before granting permission
    - Prevents duplicate permissions

  3. Error Handling
    - Returns clear error messages for user not found
    - Returns clear error messages for duplicate permissions
*/

-- Create RPC function to grant workflow permission
CREATE OR REPLACE FUNCTION grant_workflow_permission(
  p_workflow_id uuid,
  p_user_email text,
  p_permission_level text,
  p_granted_by uuid
)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_permission_id uuid;
  v_created_at timestamptz;
  v_updated_at timestamptz;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  -- If user not found, raise error
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', p_user_email;
  END IF;

  -- Check if permission already exists
  IF EXISTS (
    SELECT 1 FROM workflow_permissions
    WHERE workflow_id = p_workflow_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User already has permission for this workflow';
  END IF;

  -- Insert the permission
  INSERT INTO workflow_permissions (
    workflow_id,
    user_id,
    granted_by,
    permission_level
  )
  VALUES (
    p_workflow_id,
    v_user_id,
    p_granted_by,
    p_permission_level
  )
  RETURNING id, created_at, updated_at INTO v_permission_id, v_created_at, v_updated_at;

  -- Return the created permission as JSON
  RETURN json_build_object(
    'id', v_permission_id,
    'workflow_id', p_workflow_id,
    'user_id', v_user_id,
    'granted_by', p_granted_by,
    'permission_level', p_permission_level,
    'created_at', v_created_at,
    'updated_at', v_updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION grant_workflow_permission(uuid, text, text, uuid) TO authenticated;
