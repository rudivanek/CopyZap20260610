/*
  # Normalize Template Defaults to Reduce Intent Guardrail Violations - Part 1

  1. Purpose
    - Update template parameter defaults (tone, style, instructions) to reduce guardrail violations
    - Update default_intent_id to use more specific intents where applicable
    - Normalize aggressive tone/style fields

  2. Changes
    A) Update default_intent_id for key templates to use specific intents
    B) Normalize aggressive tone fields for hero/homepage/pricing intents
    C) Add safe instruction lines to prevent hallucinated proof

  3. No Breaking Changes
    - Only updates stored template defaults/metadata
    - Does not modify template prompt logic or generation pipeline
    - Does not change user-entered copy
*/

-- =============================================================================
-- STEP 1: Update default_intent_id for specific templates
-- =============================================================================

-- Website Home Page – Hero + Value Proposition
UPDATE pmc_templates 
SET default_intent_id = 'hero_positioning'
WHERE template_name = 'Website Home Page – Hero + Value Proposition'
  AND is_public = true;

-- Landing Page – Lead Generation
UPDATE pmc_templates 
SET default_intent_id = 'landing_page_persuasion'
WHERE template_name = 'Landing Page – Lead Generation'
  AND is_public = true;

-- Pricing Page Copy
UPDATE pmc_templates 
SET default_intent_id = 'pricing_page'
WHERE template_name = 'Pricing Page Copy'
  AND is_public = true;

-- Twitter – Viral Hook Generator
UPDATE pmc_templates 
SET default_intent_id = 'twitter_post'
WHERE template_name = 'Twitter – Viral Hook Generator'
  AND is_public = true;

-- Google Ads
UPDATE pmc_templates 
SET default_intent_id = 'paid_ad_copy'
WHERE template_name = 'Google Ads'
  AND is_public = true;

-- Meta Ads
UPDATE pmc_templates 
SET default_intent_id = 'paid_ad_copy'
WHERE template_name LIKE 'Meta Ads%'
  AND is_public = true;

-- =============================================================================
-- STEP 2: Normalize aggressive tone fields for hero/homepage/pricing intents
-- =============================================================================

-- Website Home Page – Hero + Value Proposition
UPDATE pmc_templates 
SET 
  tone = 'Clear, confident, grounded',
  preferred_writing_style = 'Direct, specific, no hype, no absolutes'
WHERE template_name = 'Website Home Page – Hero + Value Proposition'
  AND is_public = true;

-- Landing Page – Lead Generation
UPDATE pmc_templates 
SET 
  tone = 'Clear, confident, grounded',
  preferred_writing_style = 'Direct, specific, benefit-driven, no hype'
WHERE template_name = 'Landing Page – Lead Generation'
  AND is_public = true;

-- Pricing Page Copy
UPDATE pmc_templates 
SET 
  tone = 'Clear, confident, grounded',
  preferred_writing_style = 'Direct, transparent, no pressure, no absolutes'
WHERE template_name = 'Pricing Page Copy'
  AND is_public = true;

-- Google Ads
UPDATE pmc_templates 
SET 
  tone = 'Clear, direct, benefit-focused',
  preferred_writing_style = 'Concise, specific, action-oriented, no hype'
WHERE template_name = 'Google Ads'
  AND is_public = true;

-- Meta Ads
UPDATE pmc_templates 
SET 
  tone = 'Clear, benefit-driven, authentic',
  preferred_writing_style = 'Conversational, specific, emotionally resonant, no exaggeration'
WHERE template_name LIKE 'Meta Ads%'
  AND is_public = true;

-- =============================================================================
-- STEP 3: Add safe instruction lines to prevent hallucinated proof
-- =============================================================================

-- Website Home Page – Hero + Value Proposition
UPDATE pmc_templates 
SET special_instructions = COALESCE(special_instructions || E'\n\n', '') || 
  'IMPORTANT: Do not invent metrics, examples, client names, or results. If specific details are missing, stay qualitative and focus on clear benefits.'
WHERE template_name = 'Website Home Page – Hero + Value Proposition'
  AND is_public = true
  AND (special_instructions IS NULL OR special_instructions NOT LIKE '%Do not invent metrics%');

-- Landing Page – Lead Generation
UPDATE pmc_templates 
SET special_instructions = COALESCE(special_instructions || E'\n\n', '') || 
  'IMPORTANT: Do not invent metrics, examples, client names, or results. If specific details are missing, stay qualitative and focus on clear benefits.'
WHERE template_name = 'Landing Page – Lead Generation'
  AND is_public = true
  AND (special_instructions IS NULL OR special_instructions NOT LIKE '%Do not invent metrics%');

-- Pricing Page Copy
UPDATE pmc_templates 
SET special_instructions = COALESCE(special_instructions || E'\n\n', '') || 
  'IMPORTANT: Do not invent specific guarantees, refund terms, or support details. If details are missing, use general trust language without making specific promises.'
WHERE template_name = 'Pricing Page Copy'
  AND is_public = true
  AND (special_instructions IS NULL OR special_instructions NOT LIKE '%Do not invent specific guarantees%');

-- Google Ads
UPDATE pmc_templates 
SET special_instructions = COALESCE(special_instructions || E'\n\n', '') || 
  'IMPORTANT: Do not invent metrics, statistics, or unverified claims. Focus on clear, specific benefits without exaggeration.'
WHERE template_name = 'Google Ads'
  AND is_public = true
  AND (special_instructions IS NULL OR special_instructions NOT LIKE '%Do not invent metrics%');

-- Meta Ads
UPDATE pmc_templates 
SET special_instructions = COALESCE(special_instructions || E'\n\n', '') || 
  'IMPORTANT: Do not invent metrics, statistics, or unverified claims. Focus on authentic, relatable benefits without exaggeration.'
WHERE template_name LIKE 'Meta Ads%'
  AND is_public = true
  AND (special_instructions IS NULL OR special_instructions NOT LIKE '%Do not invent metrics%');

-- =============================================================================
-- STEP 4: Update audience placeholders to avoid "teams/stakeholders" language
-- =============================================================================

-- Website Home Page – Hero + Value Proposition
UPDATE pmc_templates 
SET target_audience = '[your ideal customer or end user]'
WHERE template_name = 'Website Home Page – Hero + Value Proposition'
  AND is_public = true
  AND target_audience LIKE '%audience%';