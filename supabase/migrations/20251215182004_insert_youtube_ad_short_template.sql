/*
  # Insert YouTube Ad Script (Short) Template

  1. Template Details
    - Name: "11.) YouTube Ad Script (Short)"
    - Type: "create"
    - Not a system template (is_public = false)
    - Owner: System user (2ac648bd-fa9e-4323-92a5-2e02799dc514)

  2. Prefilled Fields
    - Business description, product/service name with placeholder syntax
    - Project description for short YouTube ad script context
    - Target audience, tone, writing style optimized for video ads
    - Custom duration logic: 6s (~15-20 words), 15s (~35-45 words), 30s (~65-80 words)

  3. Output Structure
    - Hook (First 3 Seconds) - 15 words
    - Problem or Desire - 15 words
    - Solution Introduction - 20 words
    - Key Benefit - 15 words
    - CTA - 10 words
    - Total: 75 words

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
  '11.) YouTube Ad Script (Short)',
  'create',
  'English',
  'Engaging, confident, energetic',
  'short',
  75,
  '[enter your target audience]',
  'The main message viewers should remember is [enter primary benefit or outcome].',
  '[enter your business description]',
  '[enter product / service name]',
  'Short YouTube ad script for [enter your business name] promoting [enter product / service] to [enter target audience]. Designed for fast attention and clear messaging.',
  'Spoken language, short sentences, clear pacing, no jargon',
  ARRAY[
    '{"section": "Hook (First 3 Seconds)", "wordCount": 15, "description": "Immediate attention grabber addressing [problem, desire, or bold promise]."}'::jsonb,
    '{"section": "Problem or Desire", "wordCount": 15, "description": "Quickly state the pain point or goal relevant to [target audience]."}'::jsonb,
    '{"section": "Solution Introduction", "wordCount": 20, "description": "Introduce [product / service] as the solution."}'::jsonb,
    '{"section": "Key Benefit", "wordCount": 15, "description": "Highlight the main benefit or outcome."}'::jsonb,
    '{"section": "CTA", "wordCount": 10, "description": "Clear spoken call to action (visit, sign up, learn more)."}'::jsonb
  ]::jsonb[],
  false
);