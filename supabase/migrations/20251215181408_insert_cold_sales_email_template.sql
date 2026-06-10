/*
  # Insert Cold Sales Email Template

  1. Template Details
    - Name: "11.) Sales Email (Cold)"
    - Type: "create"
    - Not a system template (is_public = false)
    - Owner: System user (2ac648bd-fa9e-4323-92a5-2e02799dc514)

  2. Prefilled Fields
    - Business description, product/service name with placeholder syntax
    - Project description for cold sales outreach context
    - Target audience, tone, writing style
    - Custom word count logic: Short 80-120, Medium 130-180, Long 200-250

  3. Output Structure
    - Subject Line (8 words)
    - Personalized Opening (40 words)
    - Problem Statement (50 words)
    - Value Proposition (70 words)
    - Soft CTA (30 words)

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
  '11.) Sales Email (Cold)',
  'create',
  'English',
  'Professional, respectful, confident',
  'medium',
  155,
  '[enter your ideal prospect or role]',
  'The main reason to reach out is that [enter the primary problem you solve].',
  '[enter your business description]',
  '[enter product / service name]',
  'Cold sales email written on behalf of [enter your business name] to initiate a first-time conversation with [enter target audience] about [enter product / service].',
  'Short, direct, personalized, no fluff',
  ARRAY[
    '{"section": "Subject Line", "wordCount": 8, "description": "Short, curiosity-based or personalized subject line."}'::jsonb,
    '{"section": "Personalized Opening", "wordCount": 40, "description": "Show relevance by referencing [prospect context, role, or company]."}'::jsonb,
    '{"section": "Problem Statement", "wordCount": 50, "description": "Briefly highlight a common pain point faced by [target audience]."}'::jsonb,
    '{"section": "Value Proposition", "wordCount": 70, "description": "Explain how [product / service] helps solve the problem."}'::jsonb,
    '{"section": "Soft CTA", "wordCount": 30, "description": "Low-friction call to action (e.g., quick chat, reply yes/no)."}'::jsonb
  ]::jsonb[],
  false
);