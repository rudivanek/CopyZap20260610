/*
  # Security and Performance Fixes - Part 2: RLS Performance Optimization
  
  ## Overview
  This migration optimizes Row Level Security (RLS) policies for better performance at scale.
  
  ## Changes
  Replaces `auth.uid()` with `(select auth.uid())` and wraps JWT checks in subqueries
  to prevent re-evaluation for each row. This is critical for query performance at scale.
  
  ## Tables Updated
  1. pmc_public_brand_voices (5 policies)
  2. blog_posts (5 policies)
  3. pmc_users (5 policies)
  4. pmc_copy_sessions (4 policies)
  5. pmc_customers (3 policies)
  6. pmc_extra_suggestions (1 policy)
  7. pmc_templates (4 policies)
  8. X-pmc_prefills (4 policies)
  9. modify_content_suggestions (1 policy)
  10. xxx-pmc_user_tokens_usage (4 policies)
  11. pmc_beta_register (1 policy)
  12. pmc_saved_outputs (4 policies)
  13. pmc_user_tokens_used (2 policies)
  
  ## Security Notes
  - No data is modified
  - All policies maintain the same security guarantees
  - Only performance characteristics are improved
*/

-- =====================================================
-- 1. PMC_PUBLIC_BRAND_VOICES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view brand voices for their customers" ON public.pmc_public_brand_voices;
CREATE POLICY "Users can view brand voices for their customers"
  ON public.pmc_public_brand_voices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND pmc_customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert brand voices for their customers" ON public.pmc_public_brand_voices;
CREATE POLICY "Users can insert brand voices for their customers"
  ON public.pmc_public_brand_voices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND pmc_customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update brand voices for their customers" ON public.pmc_public_brand_voices;
CREATE POLICY "Users can update brand voices for their customers"
  ON public.pmc_public_brand_voices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND pmc_customers.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND pmc_customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete brand voices for their customers" ON public.pmc_public_brand_voices;
CREATE POLICY "Users can delete brand voices for their customers"
  ON public.pmc_public_brand_voices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND pmc_customers.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 2. BLOG_POSTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admin can view all blog posts" ON public.blog_posts;
CREATE POLICY "Admin can view all blog posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

DROP POLICY IF EXISTS "Admin can create blog posts" ON public.blog_posts;
CREATE POLICY "Admin can create blog posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

DROP POLICY IF EXISTS "Admin can update blog posts" ON public.blog_posts;
CREATE POLICY "Admin can update blog posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

DROP POLICY IF EXISTS "Admin can delete blog posts" ON public.blog_posts;
CREATE POLICY "Admin can delete blog posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

DROP POLICY IF EXISTS "Admin can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Admin can manage all blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

-- =====================================================
-- 3. PMC_USERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can read own data" ON public.pmc_users;
CREATE POLICY "Users can read own data"
  ON public.pmc_users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own data" ON public.pmc_users;
CREATE POLICY "Users can insert own data"
  ON public.pmc_users FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own data" ON public.pmc_users;
CREATE POLICY "Users can update own data"
  ON public.pmc_users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can read their own record" ON public.pmc_users;
CREATE POLICY "Users can read their own record"
  ON public.pmc_users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own record" ON public.pmc_users;
CREATE POLICY "Users can update their own record"
  ON public.pmc_users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- 4. PMC_COPY_SESSIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can read own copy sessions" ON public.pmc_copy_sessions;
CREATE POLICY "Users can read own copy sessions"
  ON public.pmc_copy_sessions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own copy sessions" ON public.pmc_copy_sessions;
CREATE POLICY "Users can insert own copy sessions"
  ON public.pmc_copy_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own copy sessions" ON public.pmc_copy_sessions;
CREATE POLICY "Users can delete own copy sessions"
  ON public.pmc_copy_sessions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own copy sessions" ON public.pmc_copy_sessions;
CREATE POLICY "Users can update own copy sessions"
  ON public.pmc_copy_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 5. PMC_CUSTOMERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own customers" ON public.pmc_customers;
CREATE POLICY "Users can insert their own customers"
  ON public.pmc_customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own customers" ON public.pmc_customers;
CREATE POLICY "Users can update their own customers"
  ON public.pmc_customers FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own customers" ON public.pmc_customers;
CREATE POLICY "Users can delete their own customers"
  ON public.pmc_customers FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 6. PMC_EXTRA_SUGGESTIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage suggestions" ON public.pmc_extra_suggestions;
CREATE POLICY "Admins can manage suggestions"
  ON public.pmc_extra_suggestions FOR ALL
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

-- =====================================================
-- 7. PMC_TEMPLATES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own templates" ON public.pmc_templates;
CREATE POLICY "Users can insert their own templates"
  ON public.pmc_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.pmc_templates;
CREATE POLICY "Users can delete their own templates"
  ON public.pmc_templates FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow reading public templates" ON public.pmc_templates;
CREATE POLICY "Allow reading public templates"
  ON public.pmc_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can read own and public templates" ON public.pmc_templates;
CREATE POLICY "Users can read own and public templates"
  ON public.pmc_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin can update all templates" ON public.pmc_templates;
CREATE POLICY "Admin can update all templates"
  ON public.pmc_templates FOR UPDATE
  TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

DROP POLICY IF EXISTS "Users can update own templates (no public access)" ON public.pmc_templates;
CREATE POLICY "Users can update own templates (no public access)"
  ON public.pmc_templates FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) AND is_public = false)
  WITH CHECK (user_id = (select auth.uid()) AND is_public = false);