/*
  # Insert Newsletter Template

  1. Template Details
    - Name: "11.) Newsletter"
    - Type: "create"
    - Public template (is_public = false, but owned by system user)
    - Owner: System user (2ac648bd-fa9e-4323-92a5-2e02799dc514)

  2. Prefilled Fields
    - Business description, product/service name with placeholder syntax
    - Project description for newsletter context
    - Target audience, tone, writing style
    - Custom word count logic: Short 200-300, Medium 350-500, Long 600-800

  3. Output Structure
    - Subject Line (10 words)
    - Opening Hook (60 words)
    - Main Insight (200 words)
    - Supporting Example/Tip (120 words)
    - Soft CTA (40 words)

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
  '11.) Newsletter',
  'create',
  'English',
  'Friendly, informative, trustworthy',
  'medium',
  425,
  '[enter your newsletter audience]',
  'The main takeaway I want subscribers to remember is [enter your core insight or message].',
  '[enter your business description]',
  '[enter product / service name]',
  'Newsletter written for [enter your business name] to educate, inform, or engage subscribers about [enter topic or theme]. The goal is to provide value first and gently guide readers toward an action.',
  'Clear, conversational, value-driven, easy to skim',
  ARRAY[
    '{"section": "Subject Line", "wordCount": 10, "description": "Clear, curiosity-driven subject line related to [topic]."}'::jsonb,
    '{"section": "Opening Hook", "wordCount": 60, "description": "Warm opening that connects with the reader and sets context."}'::jsonb,
    '{"section": "Main Insight", "wordCount": 200, "description": "Core content delivering value, insight, or lesson to [target audience]."}'::jsonb,
    '{"section": "Supporting Example or Tip", "wordCount": 120, "description": "Practical example, story, or actionable tip."}'::jsonb,
    '{"section": "Soft CTA", "wordCount": 40, "description": "Invite readers to reply, click, or explore more—no hard selling."}'::jsonb
  ]::jsonb[],
  false
);