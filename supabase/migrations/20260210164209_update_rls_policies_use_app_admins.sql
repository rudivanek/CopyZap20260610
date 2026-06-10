/*
  # Update RLS Policies to Use Centralized is_app_admin() Function

  1. Changes
    - Update all RLS policies that hardcode 'rfv@datago.net' email checks
    - Replace with calls to public.is_app_admin() function
    - Maintains exact same access control, just centralized

  2. Tables Affected
    - llm_model_pricing (4 policies updated)
    - llm_billing_rules (1 policy updated)
    - pmc_templates (1 policy updated)

  ## Purpose
  This migration replaces hardcoded admin email checks in RLS policies with
  the centralized is_app_admin() function, making admin management database-driven
  instead of code-driven.
*/

-- Drop existing admin-only policies for llm_model_pricing
DROP POLICY IF EXISTS "Only admin can insert new pricing records" ON public.llm_model_pricing;
DROP POLICY IF EXISTS "Only admin can update pricing records" ON public.llm_model_pricing;
DROP POLICY IF EXISTS "Only admin can delete pricing records" ON public.llm_model_pricing;
DROP POLICY IF EXISTS "Admin can write pricing data" ON public.llm_model_pricing;

-- Recreate with centralized admin check
CREATE POLICY "Admin can write pricing data"
  ON public.llm_model_pricing
  FOR ALL
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Drop existing admin-only policy for llm_billing_rules
DROP POLICY IF EXISTS "Admin can write billing rules" ON public.llm_billing_rules;

-- Recreate with centralized admin check
CREATE POLICY "Admin can write billing rules"
  ON public.llm_billing_rules
  FOR ALL
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Drop existing admin-only policy for pmc_templates
DROP POLICY IF EXISTS "Admin can update any template and set is_public" ON public.pmc_templates;

-- Recreate with centralized admin check
CREATE POLICY "Admin can update any template and set is_public"
  ON public.pmc_templates
  FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
