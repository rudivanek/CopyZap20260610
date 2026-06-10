-- First, let's see what we're working with
SELECT 'Checking pmc_prefills table...' as step;

-- Count total prefills
SELECT COUNT(*) as total_prefills FROM pmc_prefills;

-- Show sample prefill data structure
SELECT 
    id,
    label,
    category,
    is_public,
    user_id,
    jsonb_pretty(data) as sample_data
FROM pmc_prefills 
LIMIT 2;

-- Check what's in pmc_templates already
SELECT COUNT(*) as existing_templates FROM pmc_templates;

-- Now let's do a simple insert with only the core required fields that definitely exist
INSERT INTO pmc_templates (
    user_id,
    template_name,
    language,
    tone,
    word_count,
    template_type,
    category
)
SELECT
    p.user_id,
    p.label,
    COALESCE(p.data->>'language', 'English'),
    COALESCE(p.data->>'tone', 'Professional'),
    COALESCE(p.data->>'wordCount', 'Medium: 100-200'),
    COALESCE(p.data->>'tab', 'create'),
    p.category
FROM pmc_prefills p
WHERE p.user_id IS NOT NULL
  AND p.label IS NOT NULL
ON CONFLICT (user_id, template_name) DO NOTHING;

-- Check results
SELECT COUNT(*) as templates_after_insert FROM pmc_templates;

-- Show what was inserted
SELECT 
    template_name,
    category,
    language,
    tone,
    word_count,
    template_type
FROM pmc_templates 
ORDER BY created_at DESC 
LIMIT 5;