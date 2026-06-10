/*
  # Restrict is_public to Admin Only

  Fix the templates table RLS so that ONLY rfv@datago.net can set is_public = true.
  Regular users can still update their own templates but cannot make them public.

  ## Changes:
  1. Drop the current UPDATE policy that allows any user to set is_public
  2. Create new UPDATE policy for regular users (blocks is_public changes)
  3. Create separate UPDATE policy for admin (rfv@datago.net) with full access
*/

-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own templates" ON pmc_templates;

-- Regular users can update their own templates BUT cannot change is_public to true
CREATE POLICY "Users can update own templates (no public access)"
  ON pmc_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- If they're trying to set is_public = true, block it
      is_public = false
      OR
      -- Allow if is_public was already true and staying true (no change)
      (is_public = true AND (SELECT is_public FROM pmc_templates WHERE id = pmc_templates.id) = true)
    )
  );

-- Admin (rfv@datago.net) can update ANY template and set is_public to anything
CREATE POLICY "Admin can update all templates"
  ON pmc_templates
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'rfv@datago.net')
  WITH CHECK (auth.jwt() ->> 'email' = 'rfv@datago.net');
