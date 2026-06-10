/*
  # Insert Google Ads Template

  1. Template Details
    - Name: "11.) Google Ads"
    - Type: "create"
    - Not a system template (is_public = false)
    - Owner: System user (2ac648bd-fa9e-4323-92a5-2e02799dc514)

  2. Prefilled Fields
    - Business description, product/service name with placeholder syntax
    - Project description for Google Search Ads context
    - Target audience, tone, writing style
    - Custom character logic: Headlines max 30 chars, Descriptions max 90 chars

  3. Output Structure
    - Headline 1 (6 words, max 30 characters)
    - Headline 2 (6 words, max 30 characters)
    - Headline 3 (6 words, max 30 characters)
    - Description 1 (15 words, max 90 characters)
    - Description 2 (15 words, max 90 characters)

  4. Security
    - Uses existing RLS policies on pmc_templates
*/

INSERT INTO pmc_templates (
  user_id,
  template_name,
  template_type,
  language,
  tone,
  word_count,
  custom_word_count,
  target_audience,
  key_message,
  business_description,
  product_service_name,
  project_description,
  preferred_writing_style,
  output_structure,
  is_public
) VALUES (
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) Google Ads',
  'create',
  'English',
  'Clear, direct, benefit-focused',
  'short',
  48,
  '[enter your target audience]',
  'The primary value or offer to highlight is [enter main benefit or offer].',
  '[enter your business description]',
  '[enter product / service name]',
  'Google Search Ads copy for [enter your business name] promoting [enter product / service] to attract [enter target audience] searching for [enter keywords or intent].',
  'Concise, keyword-aware, action-oriented',
  ARRAY[
    '{"section": "Headline 1", "wordCount": 6, "description": "Primary keyword-focused headline (max 30 characters)."}'::jsonb,
    '{"section": "Headline 2", "wordCount": 6, "description": "Secondary benefit-driven headline (max 30 characters)."}'::jsonb,
    '{"section": "Headline 3", "wordCount": 6, "description": "Optional CTA or differentiator (max 30 characters)."}'::jsonb,
    '{"section": "Description 1", "wordCount": 15, "description": "Explain value or offer clearly (max 90 characters)."}'::jsonb,
    '{"section": "Description 2", "wordCount": 15, "description": "Reinforce benefit, urgency, or trust signal (max 90 characters)."}'::jsonb
  ]::jsonb[],
  false
);