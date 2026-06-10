/*
  # Merge Prefills into Templates - Database Schema Update

  This migration consolidates the pmc_prefills functionality into pmc_templates 
  to create a unified template system with categories and public/private visibility.

  ## Changes Made

  1. **Schema Updates**
     - Add `category` column to pmc_templates for organizing templates
     - Add `is_public` column to pmc_templates for visibility control

  2. **Data Migration**
     - Migrate all existing prefill data to pmc_templates
     - Map prefill fields to template structure
     - Handle potential naming conflicts with suffix approach

  3. **Cleanup**
     - Remove pmc_prefills table after successful migration
     - Add performance indexes for new columns
     - Update RLS policies for public template access

  ## Important Notes
     - All existing prefill data is preserved in form_state_snapshot
     - Naming conflicts are handled by appending "_prefill" suffix
     - Public templates are accessible to all authenticated users
*/

-- Step 1: Add new columns to pmc_templates table
DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pmc_templates' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN category TEXT;
  END IF;

  -- Add is_public column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pmc_templates' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.pmc_templates ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Step 2: Migrate data from pmc_prefills to pmc_templates
DO $$
DECLARE
  prefill_record RECORD;
  template_name_to_use TEXT;
  name_counter INTEGER;
BEGIN
  -- Check if pmc_prefills table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pmc_prefills') THEN
    
    -- Loop through each prefill record
    FOR prefill_record IN 
      SELECT * FROM public.pmc_prefills ORDER BY created_at
    LOOP
      template_name_to_use := prefill_record.label;
      name_counter := 1;
      
      -- Handle potential naming conflicts
      WHILE EXISTS (
        SELECT 1 FROM public.pmc_templates 
        WHERE user_id = prefill_record.user_id 
        AND template_name = template_name_to_use
      ) LOOP
        template_name_to_use := prefill_record.label || '_prefill_' || name_counter;
        name_counter := name_counter + 1;
      END LOOP;
      
      -- Insert the prefill as a template
      INSERT INTO public.pmc_templates (
        id,
        user_id,
        template_name,
        description,
        category,
        is_public,
        language,
        tone,
        word_count,
        custom_word_count,
        target_audience,
        key_message,
        desired_emotion,
        call_to_action,
        brand_values,
        keywords,
        context,
        brief_description,
        page_type,
        business_description,
        original_copy,
        template_type,
        created_at,
        form_state_snapshot,
        project_description
      ) VALUES (
        prefill_record.id,
        prefill_record.user_id,
        template_name_to_use,
        'Migrated from prefill',
        prefill_record.category,
        prefill_record.is_public,
        COALESCE(prefill_record.data->>'language', 'English'),
        COALESCE(prefill_record.data->>'tone', 'Professional'),
        COALESCE(prefill_record.data->>'wordCount', 'Medium: 100-200'),
        CASE 
          WHEN prefill_record.data->>'customWordCount' IS NOT NULL 
          THEN (prefill_record.data->>'customWordCount')::integer 
          ELSE NULL 
        END,
        prefill_record.data->>'targetAudience',
        prefill_record.data->>'keyMessage',
        prefill_record.data->>'desiredEmotion',
        prefill_record.data->>'callToAction',
        prefill_record.data->>'brandValues',
        prefill_record.data->>'keywords',
        prefill_record.data->>'context',
        prefill_record.data->>'briefDescription',
        prefill_record.data->>'pageType',
        prefill_record.data->>'businessDescription',
        prefill_record.data->>'originalCopy',
        CASE 
          WHEN prefill_record.data->>'tab' IS NOT NULL 
          THEN prefill_record.data->>'tab'
          ELSE 'create'
        END,
        prefill_record.created_at,
        prefill_record.data,
        prefill_record.data->>'projectDescription'
      );
      
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated % prefills to templates', 
      (SELECT COUNT(*) FROM public.pmc_prefills);
    
  ELSE
    RAISE NOTICE 'pmc_prefills table does not exist, skipping migration';
  END IF;
END $$;

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pmc_templates_category 
ON public.pmc_templates (category);

CREATE INDEX IF NOT EXISTS idx_pmc_templates_is_public 
ON public.pmc_templates (is_public);

CREATE INDEX IF NOT EXISTS idx_pmc_templates_category_public 
ON public.pmc_templates (category, is_public);

-- Step 4: Update RLS policies for public template access
CREATE POLICY IF NOT EXISTS "Allow reading public templates"
  ON public.pmc_templates
  FOR SELECT
  TO authenticated
  USING ((is_public = true) OR (user_id = uid()));

-- Step 5: Drop pmc_prefills table (only if it exists and migration was successful)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pmc_prefills') THEN
    -- Verify migration was successful by checking if we have the same count
    IF (SELECT COUNT(*) FROM public.pmc_prefills) <= (SELECT COUNT(*) FROM public.pmc_templates WHERE category IS NOT NULL) THEN
      DROP TABLE public.pmc_prefills;
      RAISE NOTICE 'Successfully dropped pmc_prefills table after migration';
    ELSE
      RAISE NOTICE 'Migration verification failed, keeping pmc_prefills table for safety';
    END IF;
  END IF;
END $$;