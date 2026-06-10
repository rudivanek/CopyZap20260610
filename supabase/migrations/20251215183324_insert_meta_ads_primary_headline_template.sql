/*
  # Insert Meta Ads (Primary Text + Headline) Template

  1. Template Details
    - Name: "11.) Meta Ads (Primary Text + Headline)"
    - Type: "create"
    - Not a system template (is_public = false)
    - Owner: System user (2ac648bd-fa9e-4323-92a5-2e02799dc514)

  2. Prefilled Fields
    - Business description, product/service name with placeholder syntax
    - Project description for Meta (Facebook/Instagram) ad context
    - Target audience, tone, writing style optimized for social ads
    - Custom length logic: Short (40-80w), Medium (90-150w), Long (180-250w)
    - Headline: max 40 characters

  3. Output Structure
    - Primary Text - 120 words (medium default)
    - Headline - 8 words (max 40 characters)

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
  '11.) Meta Ads (Primary Text + Headline)',
  'create',
  'English',
  'Persuasive, clear, benefit-driven',
  'medium',
  120,
  '[enter your target audience]',
  'The primary benefit or offer to highlight is [enter main benefit, offer, or transformation].',
  '[enter your business description]',
  '[enter product / service name]',
  'Meta (Facebook / Instagram) ad copy for [enter your business name] promoting [enter product / service] to [enter target audience]. Designed to stop the scroll and drive action.',
  'Conversational, scannable, emotionally engaging',
  ARRAY[
    '{"section": "Primary Text", "wordCount": 120, "description": "Main ad copy that hooks the reader, explains the benefit, and motivates action."}'::jsonb,
    '{"section": "Headline", "wordCount": 8, "description": "Short, benefit-focused headline (max 40 characters)."}'::jsonb
  ]::jsonb[],
  false
);