-- Diagnostic script to identify why no records were inserted into pmc_templates

-- 1. Check if there are any records in pmc_prefills
SELECT 'Records in pmc_prefills:' as info, COUNT(*) as count FROM public.pmc_prefills;

-- 2. Show sample data from pmc_prefills
SELECT 'Sample pmc_prefills data:' as info;
SELECT 
    id,
    user_id,
    label,
    category,
    is_public,
    created_at,
    jsonb_pretty(data) as sample_data
FROM public.pmc_prefills 
LIMIT 3;

-- 3. Check if there are existing records in pmc_templates that might conflict
SELECT 'Records in pmc_templates:' as info, COUNT(*) as count FROM public.pmc_templates;

-- 4. Check for potential conflicts by showing existing template names per user
SELECT 'Existing template names per user:' as info;
SELECT 
    user_id,
    template_name,
    created_at
FROM public.pmc_templates 
ORDER BY user_id, template_name;

-- 5. Show what would be inserted (without actually inserting)
SELECT 'What would be inserted:' as info;
SELECT
    p.user_id,
    p.label AS template_name,
    p.data->>'language' AS language,
    p.data->>'tone' AS tone,
    p.data->>'tab' AS template_type,
    p.category,
    p.is_public
FROM public.pmc_prefills AS p
LIMIT 5;

-- 6. Corrected INSERT statement without ON CONFLICT to see actual errors
-- Remove ON CONFLICT temporarily to identify issues
INSERT INTO public.pmc_templates (
    user_id,
    template_name,
    template_type,
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
    competitor_urls,
    product_service_name,
    industry_niche,
    tone_level,
    reader_funnel_stage,
    competitor_copy_text,
    target_audience_pain_points,
    preferred_writing_style,
    language_style_constraints,
    "generateAlternative",
    "generateHumanized", 
    "generateHeadlines",
    "generateScores",
    "selectedPersona",
    "numberOfAlternativeVersions",
    "numberOfHumanizedVersionsPerAlternative",
    "numberOfHeadlines",
    force_elaborations_examples,
    force_keyword_integration,
    prioritize_word_count,
    "adhereToLittleWordCount",
    "littleWordCountTolerancePercentage",
    "wordCountTolerancePercentage",
    generate_seo_metadata,
    is_public,
    public_name,
    public_description,
    project_description,
    form_state_snapshot,
    category,
    created_at
)
SELECT
    p.user_id,
    p.label AS template_name,
    COALESCE(p.data->>'tab', 'create') AS template_type,
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
    CASE
        WHEN jsonb_typeof(p.data->'competitorUrls') = 'array' THEN (SELECT array_agg(elem::text) FROM jsonb_array_elements_text(p.data->'competitorUrls') AS elem WHERE elem IS NOT NULL AND elem != '')
        ELSE NULL
    END AS competitor_urls,
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
    COALESCE((p.data->>'generateAlternative')::boolean, false) AS "generateAlternative",
    COALESCE((p.data->>'generateHumanized')::boolean, false) AS "generateHumanized",
    COALESCE((p.data->>'generateHeadlines')::boolean, false) AS "generateHeadlines", 
    COALESCE((p.data->>'generateScores')::boolean, false) AS "generateScores",
    p.data->>'selectedPersona' AS "selectedPersona",
    COALESCE((p.data->>'numberOfAlternativeVersions')::integer, 1) AS "numberOfAlternativeVersions",
    COALESCE((p.data->>'numberOfHumanizedVersionsPerAlternative')::integer, 1) AS "numberOfHumanizedVersionsPerAlternative",
    COALESCE((p.data->>'numberOfHeadlines')::integer, 3) AS "numberOfHeadlines",
    COALESCE((p.data->>'forceElaborationsExamples')::boolean, false) AS force_elaborations_examples,
    COALESCE((p.data->>'forceKeywordIntegration')::boolean, false) AS force_keyword_integration,
    COALESCE((p.data->>'prioritizeWordCount')::boolean, false) AS prioritize_word_count,
    COALESCE((p.data->>'adhereToLittleWordCount')::boolean, false) AS "adhereToLittleWordCount",
    COALESCE((p.data->>'littleWordCountTolerancePercentage')::integer, 20) AS "littleWordCountTolerancePercentage",
    COALESCE((p.data->>'wordCountTolerancePercentage')::numeric, 2.0) AS "wordCountTolerancePercentage",
    COALESCE((p.data->>'generateSeoMetadata')::boolean, false) AS generate_seo_metadata,
    COALESCE(p.is_public, false) AS is_public,
    p.public_name,
    p.public_description,
    p.data->>'projectDescription' AS project_description,
    p.data AS form_state_snapshot,
    COALESCE(p.category, 'General') AS category,
    COALESCE(p.created_at, NOW()) AS created_at
FROM
    public.pmc_prefills AS p
WHERE p.user_id IS NOT NULL 
  AND p.label IS NOT NULL 
  AND trim(p.label) != '';

-- 7. Show results after insert
SELECT 'Records inserted into pmc_templates:' as info, COUNT(*) as count FROM public.pmc_templates;