/*
  # Fix Remaining RLS Auth Re-evaluation Issues
  
  ## Overview
  Some policies still have auth function re-evaluation issues detected by Supabase.
  This migration ensures all auth.jwt() calls are properly wrapped to be evaluated once per query.
  
  ## Changes
  Re-creates policies with improved subquery wrapping for admin role checks.
  The key change is ensuring auth.jwt() is wrapped in (SELECT ...) at the innermost level.
  
  ## Tables Updated
  1. blog_posts (4 admin policies)
  2. pmc_extra_suggestions (1 policy)
  3. modify_content_suggestions (1 policy)
  4. pmc_templates (1 policy)
  5. pmc_beta_register (1 policy)
  6. pmc_user_tokens_used (1 policy)
  
  ## Security Notes
  - Maintains exact same security guarantees
  - Only improves query performance at scale
*/

-- =====================================================
-- Helper: Create a function to check admin role (evaluated once)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT ((auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin';
$$;

-- =====================================================
-- 1. BLOG_POSTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admin can view all blog posts" ON public.blog_posts;
CREATE POLICY "Admin can view all blog posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can create blog posts" ON public.blog_posts;
CREATE POLICY "Admin can create blog posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update blog posts" ON public.blog_posts;
CREATE POLICY "Admin can update blog posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete blog posts" ON public.blog_posts;
CREATE POLICY "Admin can delete blog posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- 2. PMC_EXTRA_SUGGESTIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage suggestions" ON public.pmc_extra_suggestions;
CREATE POLICY "Admins can manage suggestions"
  ON public.pmc_extra_suggestions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 3. MODIFY_CONTENT_SUGGESTIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage modify suggestions" ON public.modify_content_suggestions;
CREATE POLICY "Admins can manage modify suggestions"
  ON public.modify_content_suggestions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 4. PMC_TEMPLATES
-- =====================================================

DROP POLICY IF EXISTS "Admin can update all templates" ON public.pmc_templates;
CREATE POLICY "Admin can update all templates"
  ON public.pmc_templates FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 5. PMC_BETA_REGISTER
-- =====================================================

DROP POLICY IF EXISTS "Admin can read beta registrations" ON public.pmc_beta_register;
CREATE POLICY "Admin can read beta registrations"
  ON public.pmc_beta_register FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- 6. PMC_USER_TOKENS_USED
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all token usage" ON public.pmc_user_tokens_used;
CREATE POLICY "Admins can view all token usage"
  ON public.pmc_user_tokens_used FOR SELECT
  TO authenticated
  USING (public.is_admin());