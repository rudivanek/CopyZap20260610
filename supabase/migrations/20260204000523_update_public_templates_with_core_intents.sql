/*
  # Update Templates with 8 Core Intent Mapping

  1. Purpose
    - Map existing legacy intent IDs to new 8 core intents
    - Ensure templates use the most specific, appropriate core intent
    - Maintain backwards compatibility

  2. Mapping Strategy
    - hero_positioning → positioning_first_impression
    - homepage_section → explanation_understanding
    - linkedin_post → professional_update_authority
    - landing_page_persuasion → persuasion_conversion
    - pricing_page → commitment_trust
    - twitter_post → short_form_attention
    - paid_ad_copy → paid_promotion_compliance
    - email_marketing → persuasion_conversion

  3. Template-Specific Mapping
    - Hero/Positioning templates → positioning_first_impression
    - Landing pages → persuasion_conversion
    - Pricing pages → commitment_trust
    - LinkedIn posts → professional_update_authority
    - Twitter hooks/posts → short_form_attention
    - Google/Meta ads → paid_promotion_compliance
    - Critiques/scoring/audit templates → evaluation_analysis
    - Everything else → explanation_understanding

  4. No Breaking Changes
    - Only updates default_intent_id for public templates
    - Legacy intent IDs remain valid for backwards compatibility
*/

-- Update legacy intent IDs to new core intents

-- hero_positioning → positioning_first_impression
UPDATE pmc_templates
SET default_intent_id = 'positioning_first_impression'
WHERE is_public = true
  AND default_intent_id = 'hero_positioning';

-- twitter_post → short_form_attention
UPDATE pmc_templates
SET default_intent_id = 'short_form_attention'
WHERE is_public = true
  AND default_intent_id = 'twitter_post';

-- paid_ad_copy → paid_promotion_compliance
UPDATE pmc_templates
SET default_intent_id = 'paid_promotion_compliance'
WHERE is_public = true
  AND default_intent_id = 'paid_ad_copy';

-- linkedin_post → professional_update_authority
UPDATE pmc_templates
SET default_intent_id = 'professional_update_authority'
WHERE is_public = true
  AND default_intent_id = 'linkedin_post';

-- homepage_section → explanation_understanding (context-dependent)
UPDATE pmc_templates
SET default_intent_id = 'explanation_understanding'
WHERE is_public = true
  AND default_intent_id = 'homepage_section'
  AND template_name NOT LIKE '%Landing%'
  AND template_name NOT LIKE '%Pricing%'
  AND template_name NOT LIKE '%Hero%';

-- landing_page_persuasion → persuasion_conversion
UPDATE pmc_templates
SET default_intent_id = 'persuasion_conversion'
WHERE is_public = true
  AND default_intent_id = 'landing_page_persuasion';

-- pricing_page → commitment_trust
UPDATE pmc_templates
SET default_intent_id = 'commitment_trust'
WHERE is_public = true
  AND default_intent_id = 'pricing_page';

-- email_marketing → persuasion_conversion
UPDATE pmc_templates
SET default_intent_id = 'persuasion_conversion'
WHERE is_public = true
  AND default_intent_id = 'email_marketing';

-- Template-name-based updates for templates without intent

-- Critique/Audit/Analysis templates → evaluation_analysis
UPDATE pmc_templates
SET default_intent_id = 'evaluation_analysis'
WHERE is_public = true
  AND (default_intent_id IS NULL OR default_intent_id IN ('hero_positioning', 'homepage_section'))
  AND (
    template_name ILIKE '%critique%'
    OR template_name ILIKE '%audit%'
    OR template_name ILIKE '%analysis%'
    OR template_name ILIKE '%scoring%'
    OR template_name ILIKE '%evaluation%'
  );

-- Hook generators → short_form_attention
UPDATE pmc_templates
SET default_intent_id = 'short_form_attention'
WHERE is_public = true
  AND (default_intent_id IS NULL OR default_intent_id = 'hero_positioning')
  AND (
    template_name ILIKE '%hook%'
    OR template_name ILIKE '%tiktok%'
    OR template_name ILIKE '%instagram story%'
    OR template_name ILIKE '%twitter%viral%'
  );

-- Social media (Instagram, TikTok) → professional_update_authority (except hooks)
UPDATE pmc_templates
SET default_intent_id = 'professional_update_authority'
WHERE is_public = true
  AND default_intent_id IN ('linkedin_post', 'homepage_section')
  AND (
    template_name ILIKE '%instagram caption%'
    OR template_name ILIKE '%instagram reel%'
    OR template_name ILIKE '%tiktok caption%'
    OR template_name ILIKE '%tiktok script%'
  );

-- Ad templates → paid_promotion_compliance
UPDATE pmc_templates
SET default_intent_id = 'paid_promotion_compliance'
WHERE is_public = true
  AND (
    template_name ILIKE '%ad%'
    OR template_name ILIKE '%youtube ad%'
    OR template_name ILIKE '%linkedin ads%'
    OR template_name ILIKE '%ugc ad%'
  );

-- Feature/Product descriptions → explanation_understanding
UPDATE pmc_templates
SET default_intent_id = 'explanation_understanding'
WHERE is_public = true
  AND (default_intent_id IS NULL OR default_intent_id = 'homepage_section')
  AND (
    template_name ILIKE '%feature%'
    OR template_name ILIKE '%product description%'
    OR template_name ILIKE '%services page%'
    OR template_name ILIKE '%saas feature%'
  );

-- Email templates → persuasion_conversion
UPDATE pmc_templates
SET default_intent_id = 'persuasion_conversion'
WHERE is_public = true
  AND (default_intent_id IS NULL OR default_intent_id = 'email_marketing')
  AND (
    template_name ILIKE '%email%'
    OR template_name ILIKE '%newsletter%'
  );

-- Blog posts → explanation_understanding
UPDATE pmc_templates
SET default_intent_id = 'explanation_understanding'
WHERE is_public = true
  AND (default_intent_id IS NULL OR default_intent_id = 'homepage_section')
  AND template_name ILIKE '%blog%';

-- Case studies / Reviews → persuasion_conversion
UPDATE pmc_templates
SET default_intent_id = 'persuasion_conversion'
WHERE is_public = true
  AND (default_intent_id IS NULL)
  AND (
    template_name ILIKE '%case%'
    OR template_name ILIKE '%review%'
    OR template_name ILIKE '%testimonial%'
  );

-- Default fallback for any remaining NULL intents → explanation_understanding
UPDATE pmc_templates
SET default_intent_id = 'explanation_understanding'
WHERE is_public = true
  AND default_intent_id IS NULL;