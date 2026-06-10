/*
  # Insert LinkedIn Ads Template

  1. Template Details
    - Name: "11.) LinkedIn Ads"
    - Type: "create"
    - Not a system template (is_public = false)
    - Owner: System user (2ac648bd-fa9e-4323-92a5-2e02799dc514)

  2. Prefilled Fields
    - Business description, product/service name with placeholder syntax
    - Project description for LinkedIn B2B ad context
    - Target audience, tone, writing style optimized for professional LinkedIn ads
    - Custom length logic: Intro Text (60-150w), Headline (max 70 chars), Description (max 100 chars)
    - Default to 90-120 words for intro text

  3. Output Structure
    - Intro Text - 120 words (main ad copy)
    - Headline - 12 words (max 70 characters)
    - Description - 15 words (max 100 characters, optional)

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
  '11.) LinkedIn Ads',
  'create',
  'English',
  'Professional, confident, value-focused',
  'medium',
  120,
  '[enter your target audience on LinkedIn]',
  'The primary value proposition or offer is [enter main benefit or outcome].',
  '[enter your business description]',
  '[enter product / service name]',
  'LinkedIn ad copy for [enter your business name] promoting [enter product / service] to [enter target audience] in a professional B2B context.',
  'Clear, concise, business-oriented, benefit-driven',
  ARRAY[
    '{"section": "Intro Text", "wordCount": 120, "description": "Main ad copy that addresses a business problem and highlights value for [target audience]."}'::jsonb,
    '{"section": "Headline", "wordCount": 12, "description": "Clear, benefit-focused headline (max 70 characters)."}'::jsonb,
    '{"section": "Description", "wordCount": 15, "description": "Optional supporting line reinforcing the value or offer (max 100 characters)."}'::jsonb
  ]::jsonb[],
  false
);