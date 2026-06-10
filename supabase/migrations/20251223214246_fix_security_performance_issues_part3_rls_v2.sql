/*
  # Security and Performance Fixes - Part 3: RLS Performance Optimization (Continued)
  
  ## Overview
  Continues RLS optimization for remaining tables.
  
  ## Tables Updated
  1. X-pmc_prefills (4 policies)
  2. modify_content_suggestions (1 policy)
  3. pmc_beta_register (1 policy)
  4. pmc_saved_outputs (4 policies)
  5. pmc_user_tokens_used (2 policies)
  
  Note: xxx-pmc_user_tokens_usage is skipped as it appears to be a backup table
  
  ## Security Notes
  - No data is modified
  - All policies maintain the same security guarantees
  - Only performance characteristics are improved
*/

-- =====================================================
-- 1. X-PMC_PREFILLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."X-pmc_prefills";
CREATE POLICY "Enable insert for authenticated users"
  ON "public"."X-pmc_prefills" FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."X-pmc_prefills";
CREATE POLICY "Enable update for authenticated users"
  ON "public"."X-pmc_prefills" FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."X-pmc_prefills";
CREATE POLICY "Enable delete for authenticated users"
  ON "public"."X-pmc_prefills" FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all prefills" ON "public"."X-pmc_prefills";
CREATE POLICY "Admins can manage all prefills"
  ON "public"."X-pmc_prefills" FOR ALL
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."X-pmc_prefills";
CREATE POLICY "Enable read access for all authenticated users"
  ON "public"."X-pmc_prefills" FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 2. MODIFY_CONTENT_SUGGESTIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage modify suggestions" ON public.modify_content_suggestions;
CREATE POLICY "Admins can manage modify suggestions"
  ON public.modify_content_suggestions FOR ALL
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

-- =====================================================
-- 3. PMC_BETA_REGISTER POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admin can read beta registrations" ON public.pmc_beta_register;
CREATE POLICY "Admin can read beta registrations"
  ON public.pmc_beta_register FOR SELECT
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

-- =====================================================
-- 4. PMC_SAVED_OUTPUTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own saved outputs" ON public.pmc_saved_outputs;
CREATE POLICY "Users can view own saved outputs"
  ON public.pmc_saved_outputs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own saved outputs" ON public.pmc_saved_outputs;
CREATE POLICY "Users can insert own saved outputs"
  ON public.pmc_saved_outputs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own saved outputs" ON public.pmc_saved_outputs;
CREATE POLICY "Users can update own saved outputs"
  ON public.pmc_saved_outputs FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own saved outputs" ON public.pmc_saved_outputs;
CREATE POLICY "Users can delete own saved outputs"
  ON public.pmc_saved_outputs FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 5. PMC_USER_TOKENS_USED POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own token usage" ON public.pmc_user_tokens_used;
CREATE POLICY "Users can view own token usage"
  ON public.pmc_user_tokens_used FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all token usage" ON public.pmc_user_tokens_used;
CREATE POLICY "Admins can view all token usage"
  ON public.pmc_user_tokens_used FOR SELECT
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');