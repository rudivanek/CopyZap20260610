/*
  # Security and Performance Fixes - Part 6: Fix Backup Table RLS
  
  ## Overview
  Disables Row Level Security on backup and duplicate tables that are not actively
  used by the application. These tables should not be queried by regular users.
  
  ## Changes
  Disables RLS on the following backup/duplicate tables:
  - pmc_prefills_duplicate
  - pmc_templates_duplicate
  - pmc_templates_duplicate-2025-12-18
  - pmc_templates_duplicate_bup
  - pmc_user_tokens_usage_backup
  
  ## Security Notes
  - These tables are backups and should not be accessed by regular users
  - If these tables need to be accessed, proper RLS policies should be added
  - Production data remains in primary tables with proper RLS
  
  ## Alternative
  If these backup tables are needed for queries, add proper RLS policies instead
  of disabling RLS. For now, disabling is safer as no policies means no access.
*/

-- Disable RLS on backup tables (safer than having RLS enabled with no policies)
ALTER TABLE IF EXISTS public.pmc_prefills_duplicate DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pmc_templates_duplicate DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."pmc_templates_duplicate-2025-12-18" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pmc_templates_duplicate_bup DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pmc_user_tokens_usage_backup DISABLE ROW LEVEL SECURITY;

-- Alternative approach (commented out): Add admin-only access policies
-- Uncomment these if backup tables need to be queried through the application

/*
-- pmc_prefills_duplicate
ALTER TABLE public.pmc_prefills_duplicate ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access" ON public.pmc_prefills_duplicate
  FOR ALL TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

-- pmc_templates_duplicate
ALTER TABLE public.pmc_templates_duplicate ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access" ON public.pmc_templates_duplicate
  FOR ALL TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

-- pmc_templates_duplicate-2025-12-18
ALTER TABLE "public"."pmc_templates_duplicate-2025-12-18" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access" ON "public"."pmc_templates_duplicate-2025-12-18"
  FOR ALL TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

-- pmc_templates_duplicate_bup
ALTER TABLE public.pmc_templates_duplicate_bup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access" ON public.pmc_templates_duplicate_bup
  FOR ALL TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');

-- pmc_user_tokens_usage_backup
ALTER TABLE public.pmc_user_tokens_usage_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access" ON public.pmc_user_tokens_usage_backup
  FOR ALL TO authenticated
  USING ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin')
  WITH CHECK ((select (auth.jwt()->>'app_metadata')::jsonb->>'role') = 'admin');
*/