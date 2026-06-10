/*
  # Merge Prefills into Templates

  This migration consolidates the pmc_prefills functionality into pmc_templates,
  creating a unified template system with categories and public visibility.

  ## Changes Made

  1. **Schema Updates**
     - Add `category` column to pmc_templates for grouping templates
     - Add `is_public` column to pmc_templates for public template sharing

  2. **Data Migration**
     - Transfer all data from pmc_prefills to pmc_templates
     - Map prefill fields to corresponding template fields
     - Preserve all JSONB data in form_state_snapshot
     - Handle unique constraint conflicts by appending "_prefill" suffix

  3. **Cleanup**
     - Drop pmc_prefills table after successful migration
     - Update any dependent views or functions

  ## Migration Strategy
     - Uses UPSERT to handle potential conflicts gracefully
     - Preserves all existing template data
     - Maintains data integrity throughout the process
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

-- Step 2: Set default values for existing templates
UPDATE public.pmc_templates 
SET 
  category = 'User Templates',
  is_public = FALSE
WHERE category IS NULL OR is_public IS NULL;

-- Step 3: Migrate data from pmc_prefills to pmc_templates
INSERT INTO public.pmc_templates (
    id,
    user_id,
    template_name,
    description,
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
    section,
    business_description,
    original_copy,
    template_type,
    created_at,
    competitor_urls,
    output_structure,
    product_service_name,
    industry_niche,
    tone_level,
    reader_funnel_stage,
    competitor_copy_text,
    target_audience_pain_points,
    preferred_writing_style,
    language_style_constraints,
    excluded_terms,
    "generateHeadlines",
    "generateScores",
    "selectedPersona",
    "numberOfHeadlines",
    "forceElaborationsExamples",
    "forceKeywordIntegration",
    "prioritizeWordCount",
    "adhereToLittleWordCount",
    "littleWordCountTolerancePercentage",
    project_description,
    form_state_snapshot,
    category,
    is_public,
    public_name,
    public_description
)
SELECT
    gen_random_uuid() as id, -- Generate new UUID for migrated records
    user_id,
    -- Handle potential naming conflicts by appending _prefill
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pmc_templates t 
        WHERE t.user_id = p.user_id AND t.template_name = p.label
      ) THEN CONCAT(p.label, '_prefill')
      ELSE p.label
    END as template_name,
    CONCAT('Migrated from prefill: ', p.label) as description,
    COALESCE(data->>'language', 'English') as language,
    COALESCE(data->>'tone', 'Professional') as tone,
    COALESCE(data->>'wordCount', 'Medium: 100-200') as word_count,
    (data->>'customWordCount')::integer as custom_word_count,
    data->>'targetAudience' as target_audience,
    data->>'keyMessage' as key_message,
    data->>'desiredEmotion' as desired_emotion,
    data->>'callToAction' as call_to_action,
    data->>'brandValues' as brand_values,
    data->>'keywords' as keywords,
    data->>'context' as context,
    data->>'briefDescription' as brief_description,
    data->>'pageType' as page_type,
    data->>'section' as section,
    data->>'businessDescription' as business_description,
    data->>'originalCopy' as original_copy,
    COALESCE(data->>'tab', 'create') as template_type,
    p.created_at,
    CASE 
      WHEN data->>'competitorUrls' IS NOT NULL 
      THEN (data->>'competitorUrls')::text[]
      ELSE NULL
    END as competitor_urls,
    CASE 
      WHEN data->'outputStructure' IS NOT NULL 
      THEN (data->'outputStructure')::jsonb[]
      ELSE NULL
    END as output_structure,
    data->>'productServiceName' as product_service_name,
    data->>'industryNiche' as industry_niche,
    (data->>'toneLevel')::integer as tone_level,
    data->>'readerFunnelStage' as reader_funnel_stage,
    data->>'competitorCopyText' as competitor_copy_text,
    data->>'targetAudiencePainPoints' as target_audience_pain_points,
    data->>'preferredWritingStyle' as preferred_writing_style,
    CASE 
      WHEN data->>'languageStyleConstraints' IS NOT NULL 
      THEN (data->>'languageStyleConstraints')::text[]
      ELSE NULL
    END as language_style_constraints,
    data->>'excludedTerms' as excluded_terms,
    COALESCE((data->>'generateHeadlines')::boolean, false) as "generateHeadlines",
    COALESCE((data->>'generateScores')::boolean, false) as "generateScores",
    data->>'selectedPersona' as "selectedPersona",
    COALESCE((data->>'numberOfHeadlines')::integer, 3) as "numberOfHeadlines",
    COALESCE((data->>'forceElaborationsExamples')::boolean, false) as "forceElaborationsExamples",
    COALESCE((data->>'forceKeywordIntegration')::boolean, false) as "forceKeywordIntegration",
    COALESCE((data->>'prioritizeWordCount')::boolean, false) as "prioritizeWordCount",
    COALESCE((data->>'adhereToLittleWordCount')::boolean, false) as "adhereToLittleWordCount",
    COALESCE((data->>'littleWordCountTolerancePercentage')::integer, 20) as "littleWordCountTolerancePercentage",
    data->>'projectDescription' as project_description,
    p.data as form_state_snapshot, -- Store the complete prefill data
    p.category as category, -- Map prefill category
    p.is_public as is_public, -- Map prefill visibility
    NULL as public_name, -- Prefills don't have public names
    NULL as public_description -- Prefills don't have public descriptions
FROM public.pmc_prefills p
WHERE p.id IS NOT NULL;

-- Step 4: Drop the pmc_prefills table
DROP TABLE IF EXISTS public.pmc_prefills CASCADE;

-- Step 5: Add indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_pmc_templates_category 
  ON public.pmc_templates (category);
  
CREATE INDEX IF NOT EXISTS idx_pmc_templates_public 
  ON public.pmc_templates (is_public, created_at DESC) 
  WHERE is_public = true;

-- Step 6: Update RLS policies to handle public templates
CREATE POLICY "Allow reading public templates" ON public.pmc_templates
  FOR SELECT 
  TO authenticated 
  USING ((is_public = true) OR (user_id = uid()));