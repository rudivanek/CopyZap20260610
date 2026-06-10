/*
  # Security and Performance Fixes - Part 4: Consolidate Duplicate RLS Policies
  
  ## Overview
  Removes duplicate RLS policies that provide the same access control.
  This simplifies policy evaluation and improves performance.
  
  ## Changes
  1. Remove duplicate read policies on pmc_users (keep "Users can read own data")
  2. Remove duplicate update policies on pmc_users (keep "Users can update own data")
  3. Remove duplicate public read policy on blog_posts (keep "Public can read published blog posts")
  4. Consolidate admin blog_posts policies (keep specific ones, remove ALL policy)
  5. Consolidate pmc_templates read policies (keep "Users can read own and public templates")
  6. Remove redundant admin policies where specific CRUD policies exist
  
  ## Security Notes
  - No security is weakened
  - Policies are only removed where exact duplicates exist
  - All access patterns remain protected
*/

-- =====================================================
-- 1. PMC_USERS - Remove duplicate policies
-- =====================================================

-- Keep "Users can read own data", remove "Users can read their own record"
DROP POLICY IF EXISTS "Users can read their own record" ON public.pmc_users;

-- Keep "Users can update own data", remove "Users can update their own record"
DROP POLICY IF EXISTS "Users can update their own record" ON public.pmc_users;

-- =====================================================
-- 2. BLOG_POSTS - Remove duplicate policies
-- =====================================================

-- Keep "Public can read published blog posts", remove "Anyone can view published blog posts"
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;

-- Keep specific admin CRUD policies, remove the ALL policy as it's redundant
-- The ALL policy conflicts with specific policies
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON public.blog_posts;

-- =====================================================
-- 3. PMC_TEMPLATES - Consolidate read policies
-- =====================================================

-- Keep "Users can read own and public templates", remove "Allow reading public templates"
-- They provide the same access but the first one is more descriptive
DROP POLICY IF EXISTS "Allow reading public templates" ON public.pmc_templates;

-- =====================================================
-- 4. PMC_EXTRA_SUGGESTIONS - Keep granular policies
-- =====================================================

-- The "Admins can manage suggestions" ALL policy should be kept along with 
-- specific user policies for different operations, as they serve different roles.
-- No changes needed here - the specific user policies allow regular users to manage
-- their own suggestions, while admin policy allows admins to manage all.

-- =====================================================
-- 5. PMC_USER_TOKENS_USED - Keep both policies
-- =====================================================

-- Both "Users can view own token usage" and "Admins can view all token usage"
-- are needed - they serve different purposes. No changes needed.