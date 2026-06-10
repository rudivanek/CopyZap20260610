/*
  # Remove automatic is_public trigger for workflows
  
  This migration removes the trigger that was automatically setting
  workflows to public for rfv@datago.net user.
  
  After this change, the is_public flag will be fully controlled
  by the UI checkbox in the workflow editor modal.
*/

-- Drop the trigger
DROP TRIGGER IF EXISTS auto_set_workflow_public ON workflows;

-- Drop the function
DROP FUNCTION IF EXISTS set_workflow_public_for_special_user();
