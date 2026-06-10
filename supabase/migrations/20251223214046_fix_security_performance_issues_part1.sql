/*
  # Security and Performance Fixes - Part 1: Indexes and RLS Optimization
  
  ## Overview
  This migration addresses critical security and performance issues identified by Supabase:
  
  ## 1. Foreign Key Indexes
  - Add missing index on `X-pmc_prefills.user_id`
  - Add missing index on `pmc_prefills_duplicate.user_id`
  
  ## 2. Duplicate Indexes (Dropped)
  - Drop `brand_voices_customer_id_idx` (kept `pmc_public_brand_voices_customer_id_idx`)
  - Drop `idx_pmc_user_tokens_used_user_id` (kept `idx_pmc_user_tokens_user_id`)
  
  ## 3. Unused Indexes (Dropped for Write Performance)
  - Drop 22 unused indexes identified by Supabase
  
  ## 4. Missing Primary Key
  - Add primary key to `pmc_user_tokens_usage_backup` table
  
  ## Security Notes
  - All operations are safe and use IF EXISTS/IF NOT EXISTS
  - No data is modified, only indexes and constraints
  - Performance improvements for both reads and writes
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Index for X-pmc_prefills.user_id
CREATE INDEX IF NOT EXISTS "idx_X-pmc_prefills_user_id" 
ON "public"."X-pmc_prefills" (user_id);

-- Index for pmc_prefills_duplicate.user_id
CREATE INDEX IF NOT EXISTS idx_pmc_prefills_duplicate_user_id 
ON public.pmc_prefills_duplicate (user_id);

-- =====================================================
-- 2. DROP DUPLICATE INDEXES
-- =====================================================

-- Drop duplicate brand_voices index (keeping the more descriptive one)
DROP INDEX IF EXISTS public.brand_voices_customer_id_idx;

-- Drop duplicate tokens_used index (keeping the more descriptive one)
DROP INDEX IF EXISTS public.idx_pmc_user_tokens_used_user_id;

-- =====================================================
-- 3. DROP UNUSED INDEXES (Improve Write Performance)
-- =====================================================

-- Token usage indexes
DROP INDEX IF EXISTS public.idx_pmc_user_tokens_used_model;
DROP INDEX IF EXISTS public.idx_pmc_user_tokens_used_operation_type;
DROP INDEX IF EXISTS public.idx_pmc_user_tokens_used_user_session;

-- Template duplicate table indexes
DROP INDEX IF EXISTS public.pmc_templates_duplicate_user_id_idx;
DROP INDEX IF EXISTS public.pmc_templates_duplicate_template_type_idx;
DROP INDEX IF EXISTS public.pmc_templates_duplicate_created_at_idx;
DROP INDEX IF EXISTS public.pmc_templates_duplicate_is_public_created_at_idx;

-- Another template duplicate backup
DROP INDEX IF EXISTS public.pmc_templates_duplicate_bup_user_id_idx;
DROP INDEX IF EXISTS public.pmc_templates_duplicate_bup_template_type_idx;
DROP INDEX IF EXISTS public.pmc_templates_duplicate_bup_created_at_idx;
DROP INDEX IF EXISTS public.pmc_templates_duplicate_bup_is_public_created_at_idx;

-- Third template duplicate table
DROP INDEX IF EXISTS "public"."pmc_templates_duplicate-2025-12-18_is_public_created_at_idx";
DROP INDEX IF EXISTS "public"."pmc_templates_duplicate-2025-12-18_user_id_idx";
DROP INDEX IF EXISTS "public"."pmc_templates_duplicate-2025-12-18_template_type_idx";
DROP INDEX IF EXISTS "public"."pmc_templates_duplicate-2025-12-18_created_at_idx";

-- Other unused indexes
DROP INDEX IF EXISTS public.idx_saved_outputs_tags;
DROP INDEX IF EXISTS public.idx_beta_register_created_at;
DROP INDEX IF EXISTS public.idx_special_instructions_suggestions_active;
DROP INDEX IF EXISTS public.idx_special_instructions_suggestions_category;
DROP INDEX IF EXISTS public.idx_blog_posts_is_published;
DROP INDEX IF EXISTS public.brand_voices_customer_id_idx;
DROP INDEX IF EXISTS public.idx_saved_outputs_session_id;

-- =====================================================
-- 4. ADD PRIMARY KEY TO BACKUP TABLE
-- =====================================================

-- Add id column if it doesn't exist, then make it primary key
DO $$
BEGIN
  -- Check if the table exists first
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pmc_user_tokens_usage_backup') THEN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'pmc_user_tokens_usage_backup' 
      AND column_name = 'id'
    ) THEN
      ALTER TABLE public.pmc_user_tokens_usage_backup 
      ADD COLUMN id BIGSERIAL;
    END IF;
    
    -- Add primary key if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM pg_constraint 
      WHERE conrelid = 'public.pmc_user_tokens_usage_backup'::regclass 
      AND contype = 'p'
    ) THEN
      ALTER TABLE public.pmc_user_tokens_usage_backup 
      ADD PRIMARY KEY (id);
    END IF;
  END IF;
END $$;