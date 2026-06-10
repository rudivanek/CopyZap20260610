/*
  # Update Public Templates with Default Intent IDs

  1. Purpose
    - Add recommended default_intent_id to existing public templates
    - Intent is used as a recommendation only - user can change it
    - Maps templates to appropriate intents based on their content type

  2. Intent Mapping Strategy
    - Social media posts → linkedin_post
    - Hero/tagline content → hero_positioning
    - Homepage/landing pages → homepage_section
    - Email content → email_marketing
    - Product descriptions → homepage_section (general content)
    - Hooks/CTAs → hero_positioning (short, punchy content)
    
  3. No Breaking Changes
    - Only updates metadata field
    - Does not modify prompts, sections, or generation logic
    - Intent remains fully user-editable
*/

-- LinkedIn Posts
UPDATE pmc_templates 
SET default_intent_id = 'linkedin_post'
WHERE template_name LIKE '%LinkedIn%'
  AND is_public = true;

-- Twitter/X Posts
UPDATE pmc_templates 
SET default_intent_id = 'linkedin_post'  -- Using linkedin_post for social media posts
WHERE (template_name LIKE '%Twitter%' OR template_name LIKE '%Tweet%')
  AND is_public = true;

-- Hero/Hook/CTA Templates (short, punchy content)
UPDATE pmc_templates 
SET default_intent_id = 'hero_positioning'
WHERE (
  template_name LIKE '%Hook%'
  OR template_name LIKE '%CTA%'
  OR template_name LIKE '%Hero%'
  OR template_name LIKE '%Tagline%'
  OR template_name LIKE '%Bio%'
)
AND is_public = true;

-- Email Templates
UPDATE pmc_templates 
SET default_intent_id = 'email_marketing'
WHERE (
  template_name LIKE '%Email%'
  OR template_name LIKE '%Newsletter%'
)
AND is_public = true;

-- Homepage/Landing Page/Web Copy Templates
UPDATE pmc_templates 
SET default_intent_id = 'homepage_section'
WHERE (
  template_name LIKE '%Homepage%'
  OR template_name LIKE '%Landing Page%'
  OR template_name LIKE '%Website%'
  OR template_name LIKE '%Product Description%'
  OR template_name LIKE '%Services Page%'
  OR template_name LIKE '%Pricing Page%'
  OR template_name LIKE '%Feature Page%'
)
AND is_public = true;

-- Instagram Templates (social media)
UPDATE pmc_templates 
SET default_intent_id = 'linkedin_post'
WHERE template_name LIKE '%Instagram%'
  AND is_public = true;

-- TikTok Templates (social media)
UPDATE pmc_templates 
SET default_intent_id = 'linkedin_post'
WHERE template_name LIKE '%TikTok%'
  AND is_public = true;

-- Ad Copy Templates
UPDATE pmc_templates 
SET default_intent_id = 'hero_positioning'
WHERE (
  template_name LIKE '%Ad%'
  OR template_name LIKE '%Google Ads%'
  OR template_name LIKE '%Meta Ads%'
  OR template_name LIKE '%YouTube Ad%'
)
AND is_public = true;

-- Blog Post Templates
UPDATE pmc_templates 
SET default_intent_id = 'homepage_section'
WHERE template_name LIKE '%Blog%'
  AND is_public = true;

-- SEO Templates
UPDATE pmc_templates 
SET default_intent_id = 'homepage_section'
WHERE (
  template_name LIKE '%SEO%'
  OR template_name LIKE '%Meta%Optimizer%'
  OR template_name LIKE '%GEO%'
)
AND is_public = true;