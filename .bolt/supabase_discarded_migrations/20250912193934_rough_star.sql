-- Copy data from pmc_prefills to pmc_templates
-- Using only columns that actually exist in both tables

-- First, let's see what we're working with
SELECT 'Checking pmc_prefills data...' as status;
SELECT COUNT(*) as prefill_count FROM pmc_prefills;
SELECT COUNT(*) as template_count FROM pmc_templates;

-- Now insert the data
INSERT INTO pmc_templates (
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
    product_service_name,
    industry_niche,
    tone_level,
    reader_funnel_stage,
    competitor_copy_text,
    target_audience_pain_points,
    preferred_writing_style,
    language_style_constraints,
    forceElaborationsExamples,
    forceKeywordIntegration,
    prioritizeWordCount,
    adhereToLittleWordCount,
    littleWordCountTolerancePercentage,
    wordCountTolerancePercentage,
    generate_seo_metadata,
    is_public,
    project_description,
    form_state_snapshot,
    category,
    created_at
)
SELECT
    p.user_id,
    p.label,
    COALESCE(p.data->>'language', 'English'),
    COALESCE(p.data->>'tone', 'Professional'),
    COALESCE(p.data->>'wordCount', 'Medium: 100-200'),
    (p.data->>'customWordCount')::integer,
    p.data->>'targetAudience',
    p.data->>'keyMessage',
    p.data->>'desiredEmotion',
    p.data->>'callToAction',
    p.data->>'brandValues',
    p.data->>'keywords',
    p.data->>'context',
    p.data->>'briefDescription',
    p.data->>'pageType',
    p.data->>'businessDescription',
    p.data->>'originalCopy',
    COALESCE(p.data->>'tab', 'copyMaker'),
    CASE
        WHEN jsonb_typeof(p.data->'competitorUrls') = 'array' 
        THEN (SELECT array_agg(elem::text) FROM jsonb_array_elements_text(p.data->'competitorUrls') AS elem WHERE elem::text != '')
        ELSE NULL
    END,
    p.data->>'productServiceName',
    p.data->>'industryNiche',
    (p.data->>'toneLevel')::integer,
    p.data->>'readerFunnelStage',
    p.data->>'competitorCopyText',
    p.data->>'targetAudiencePainPoints',
    p.data->>'preferredWritingStyle',
    CASE
        WHEN jsonb_typeof(p.data->'languageStyleConstraints') = 'array' 
        THEN (SELECT array_agg(elem::text) FROM jsonb_array_elements_text(p.data->'languageStyleConstraints') AS elem)
        ELSE NULL
    END,
    COALESCE((p.data->>'forceElaborationsExamples')::boolean, false),
    COALESCE((p.data->>'forceKeywordIntegration')::boolean, false),
    COALESCE((p.data->>'prioritizeWordCount')::boolean, false),
    COALESCE((p.data->>'adhereToLittleWordCount')::boolean, false),
    COALESCE((p.data->>'littleWordCountTolerancePercentage')::integer, 20),
    COALESCE((p.data->>'wordCountTolerancePercentage')::numeric, 2.0),
    COALESCE((p.data->>'generateSeoMetadata')::boolean, false),
    p.is_public,
    p.data->>'projectDescription',
    p.data,
    p.category,
    p.created_at
FROM pmc_prefills p
WHERE p.label IS NOT NULL 
  AND p.category IS NOT NULL;

-- Show results
SELECT 'Copy completed. Checking results...' as status;
SELECT COUNT(*) as new_template_count FROM pmc_templates;
SELECT template_name, category, created_at FROM pmc_templates ORDER BY created_at DESC LIMIT 5;