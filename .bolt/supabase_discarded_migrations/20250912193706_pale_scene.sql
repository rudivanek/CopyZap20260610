-- SQL script to diagnose and copy data from pmc_prefills to pmc_templates
-- First, let's see what we're working with

-- 1. Check how many records exist in pmc_prefills
SELECT 'Records in pmc_prefills:' as info, COUNT(*) as count FROM pmc_prefills;

-- 2. Show sample data from pmc_prefills
SELECT 'Sample pmc_prefills data:' as info;
SELECT id, label, category, is_public, user_id, created_at 
FROM pmc_prefills 
LIMIT 5;

-- 3. Check existing records in pmc_templates 
SELECT 'Records in pmc_templates:' as info, COUNT(*) as count FROM pmc_templates;

-- 4. Now copy data from pmc_prefills to pmc_templates
INSERT INTO public.pmc_templates (
    user_id,
    template_name,
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
    generatehumanized,
    generateheadlines,
    generatescores,
    selectedpersona,
    numberofheadlines,
    force_elaborations_examples,
    force_keyword_integration,
    prioritize_word_count,
    "adhereToLittleWordCount",
    "littleWordCountTolerancePercentage", 
    "wordCountTolerancePercentage",
    generate_seo_metadata,
    is_public,
    project_description,
    form_state_snapshot,
    category,
    created_at
)
SELECT
    p.user_id,
    p.label AS template_name,
    COALESCE(p.data->>'language', 'English') AS language,
    COALESCE(p.data->>'tone', 'Professional') AS tone,
    COALESCE(p.data->>'wordCount', 'Medium: 100-200') AS word_count,
    (p.data->>'customWordCount')::integer AS custom_word_count,
    p.data->>'targetAudience' AS target_audience,
    p.data->>'keyMessage' AS key_message,
    p.data->>'desiredEmotion' AS desired_emotion,
    p.data->>'callToAction' AS call_to_action,
    p.data->>'brandValues' AS brand_values,
    p.data->>'keywords' AS keywords,
    p.data->>'context' AS context,
    p.data->>'briefDescription' AS brief_description,
    p.data->>'pageType' AS page_type,
    p.data->>'businessDescription' AS business_description,
    p.data->>'originalCopy' AS original_copy,
    COALESCE(p.data->>'tab', 'create') AS template_type,
    CASE
        WHEN jsonb_typeof(p.data->'competitorUrls') = 'array' THEN (SELECT array_agg(elem::text) FROM jsonb_array_elements_text(p.data->'competitorUrls') AS elem WHERE elem IS NOT NULL AND elem != '')
        ELSE NULL
    END AS competitor_urls,
    CASE
        WHEN jsonb_typeof(p.data->'outputStructure') = 'array' THEN (p.data->'outputStructure')::jsonb[]
        ELSE NULL
    END AS output_structure,
    p.data->>'productServiceName' AS product_service_name,
    p.data->>'industryNiche' AS industry_niche,
    (p.data->>'toneLevel')::integer AS tone_level,
    p.data->>'readerFunnelStage' AS reader_funnel_stage,
    p.data->>'competitorCopyText' AS competitor_copy_text,
    p.data->>'targetAudiencePainPoints' AS target_audience_pain_points,
    p.data->>'preferredWritingStyle' AS preferred_writing_style,
    CASE
        WHEN jsonb_typeof(p.data->'languageStyleConstraints') = 'array' THEN (SELECT array_agg(elem::text) FROM jsonb_array_elements_text(p.data->'languageStyleConstraints') AS elem WHERE elem IS NOT NULL AND elem != '')
        ELSE NULL
    END AS language_style_constraints,
    COALESCE((p.data->>'generateHumanized')::boolean, false) AS generatehumanized,
    COALESCE((p.data->>'generateHeadlines')::boolean, false) AS generateheadlines,
    COALESCE((p.data->>'generateScores')::boolean, false) AS generatescores,
    p.data->>'selectedPersona' AS selectedpersona,
    COALESCE((p.data->>'numberOfHeadlines')::integer, 3) AS numberofheadlines,
    COALESCE((p.data->>'forceElaborationsExamples')::boolean, false) AS force_elaborations_examples,
    COALESCE((p.data->>'forceKeywordIntegration')::boolean, false) AS force_keyword_integration,
    COALESCE((p.data->>'prioritizeWordCount')::boolean, false) AS prioritize_word_count,
    COALESCE((p.data->>'adhereToLittleWordCount')::boolean, false) AS "adhereToLittleWordCount",
    COALESCE((p.data->>'littleWordCountTolerancePercentage')::integer, 20) AS "littleWordCountTolerancePercentage",
    COALESCE((p.data->>'wordCountTolerancePercentage')::numeric, 2.0) AS "wordCountTolerancePercentage",
    COALESCE((p.data->>'generateSeoMetadata')::boolean, false) AS generate_seo_metadata,
    p.is_public,
    p.data->>'projectDescription' AS project_description,
    p.data AS form_state_snapshot,
    p.category,
    COALESCE(p.created_at, NOW()) AS created_at
FROM
    public.pmc_prefills AS p
WHERE 
    p.label IS NOT NULL 
    AND p.user_id IS NOT NULL
    AND p.category IS NOT NULL;

-- 5. Show results
SELECT 'Records copied to pmc_templates:' as info, COUNT(*) as count FROM pmc_templates;

-- 6. Show sample of copied data
SELECT 'Sample copied templates:' as info;
SELECT template_name, language, tone, word_count, template_type, category, created_at 
FROM pmc_templates 
ORDER BY created_at DESC
LIMIT 5;