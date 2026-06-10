/*
  # Insert Promotional Email Template

  1. Template Details
    - Name: "11.) Promotional Email"
    - Type: "create"
    - Not a system template (is_public = false)
    - Owner: System user (2ac648bd-fa9e-4323-92a5-2e02799dc514)

  2. Prefilled Fields
    - Business description, product/service name with placeholder syntax
    - Project description for promotional email context
    - Target audience, tone, writing style
    - Custom word count logic: Short 120-180, Medium 200-300, Long 350-500

  3. Output Structure
    - Subject Line (10 words)
    - Opening Hook (50 words)
    - Offer Explanation (120 words)
    - Benefits (100 words)
    - Urgency or Incentive (60 words)
    - CTA (30 words)

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
  '11.) Promotional Email',
  'create',
  'English',
  'Persuasive, clear, confident',
  'medium',
  250,
  '[enter your target audience]',
  'The primary offer or promotion is [enter your offer, discount, or incentive].',
  '[enter your business description]',
  '[enter product / service name]',
  'Promotional email written for [enter your business name] to promote [enter product / service] and motivate [enter target audience] to take action.',
  'Benefit-driven, concise, action-oriented',
  ARRAY[
    '{"section": "Subject Line", "wordCount": 10, "description": "Attention-grabbing subject line highlighting [offer or benefit]."}'::jsonb,
    '{"section": "Opening Hook", "wordCount": 50, "description": "Quickly state the value or urgency of the promotion."}'::jsonb,
    '{"section": "Offer Explanation", "wordCount": 120, "description": "Explain what is being offered and why it matters to [target audience]."}'::jsonb,
    '{"section": "Benefits", "wordCount": 100, "description": "Highlight key benefits of [product / service]."}'::jsonb,
    '{"section": "Urgency or Incentive", "wordCount": 60, "description": "Create urgency using time limits, bonuses, or scarcity."}'::jsonb,
    '{"section": "CTA", "wordCount": 30, "description": "Clear, action-focused call to action."}'::jsonb
  ]::jsonb[],
  false
);