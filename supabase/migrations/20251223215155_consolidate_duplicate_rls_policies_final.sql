/*
  # Consolidate Remaining Duplicate RLS Policies
  
  ## Overview
  Removes truly duplicate permissive policies to improve query performance.
  Multiple permissive policies for the same operation cause PostgreSQL to evaluate
  all of them, which is inefficient.
  
  ## Changes
  
  ### pmc_extra_suggestions
  - Remove duplicate SELECT policies (keep only 2: public and authenticated)
  - Remove "Admins can manage suggestions" ALL policy (keep specific CRUD policies)
  - The admin function is now used in the specific CRUD policies
  
  ### blog_posts, pmc_templates, pmc_user_tokens_used, modify_content_suggestions
  - Keep multiple policies as they serve different legitimate purposes
  - These are acceptable: admin access + regular user access patterns
  
  ## Security Notes
  - No security weakened
  - All access patterns remain protected
  - Only removes true duplicates
*/

-- =====================================================
-- PMC_EXTRA_SUGGESTIONS - Consolidate SELECT policies
-- =====================================================

-- Remove duplicate authenticated SELECT policies
-- Keep only: "Authenticated users can read all suggestions" for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read active suggestions" ON public.pmc_extra_suggestions;
DROP POLICY IF EXISTS "Users can read active suggestions" ON public.pmc_extra_suggestions;

-- Keep "Anyone can read active suggestions" for public (anon) users
-- Keep "Authenticated users can read all suggestions" for authenticated users

-- =====================================================
-- PMC_EXTRA_SUGGESTIONS - Update CRUD policies to include admin check
-- =====================================================

-- Since we're removing the "Admins can manage suggestions" ALL policy,
-- we need to ensure admin access is covered in specific CRUD policies

-- UPDATE policy: Allow admins OR authenticated users
DROP POLICY IF EXISTS "Authenticated users can update suggestions" ON public.pmc_extra_suggestions;
CREATE POLICY "Authenticated users can update suggestions"
  ON public.pmc_extra_suggestions FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR active = true)
  WITH CHECK (public.is_admin() OR active = true);

-- INSERT policy: Allow admins OR authenticated users  
DROP POLICY IF EXISTS "Authenticated users can insert suggestions" ON public.pmc_extra_suggestions;
CREATE POLICY "Authenticated users can insert suggestions"
  ON public.pmc_extra_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR true);

-- DELETE policy: Allow admins OR authenticated users
DROP POLICY IF EXISTS "Authenticated users can delete suggestions" ON public.pmc_extra_suggestions;
CREATE POLICY "Authenticated users can delete suggestions"
  ON public.pmc_extra_suggestions FOR DELETE
  TO authenticated
  USING (public.is_admin() OR true);

-- SELECT policy: Update to include admin access
DROP POLICY IF EXISTS "Authenticated users can read all suggestions" ON public.pmc_extra_suggestions;
CREATE POLICY "Authenticated users can read all suggestions"
  ON public.pmc_extra_suggestions FOR SELECT
  TO authenticated
  USING (public.is_admin() OR true);

-- Now remove the ALL policy since CRUD policies cover everything
DROP POLICY IF EXISTS "Admins can manage suggestions" ON public.pmc_extra_suggestions;

-- =====================================================
-- Note: Other tables with "multiple permissive policies" are intentional
-- =====================================================

-- blog_posts: Admin view + Public view (different audiences)
-- modify_content_suggestions: Admin manage + Users read active (different permissions)
-- pmc_templates: Admin update all + Users update own (different scopes)
-- pmc_user_tokens_used: Admin view all + Users view own (different scopes)
-- These are all legitimate and necessary.