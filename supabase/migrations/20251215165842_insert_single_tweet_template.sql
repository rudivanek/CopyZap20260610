/*
  # Insert Single Tweet Template

  1. New Template
    - Name: "11.) Single Tweet"
    - Type: create
    - Purpose: Pre-configured template for creating single impactful tweets
    - Available publicly for all users

  2. Features
    - Single-section output (one complete tweet)
    - Prefilled fields with placeholder text for easy customization
    - Clear, confident, punchy tone
    - Character-optimized for X/Twitter (280 character hard limit, 180-240 optimal)
    - Conversational, high-signal style

  3. Output Structure
    - Tweet (40 words / ~280 characters max): One concise, impactful statement

  4. Custom Character Logic
    - Maximum length: 280 characters (hard limit)
    - Optimal range: 180–240 characters for engagement
    - No emojis unless explicitly requested
*/

INSERT INTO public.pmc_templates (
  id,
  user_id,
  template_name,
  template_type,
  tone,
  language,
  word_count,
  business_description,
  product_service_name,
  project_description,
  key_message,
  target_audience,
  preferred_writing_style,
  output_structure,
  include_section_titles,
  is_public,
  public_name,
  public_description,
  created_at
) VALUES (
  gen_random_uuid(),
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) Single Tweet',
  'create',
  'Clear, confident, punchy',
  'English',
  'Short: 50-100',
  '[enter your business description]',
  '[enter product / service name]',
  'Single tweet written from [enter your role or brand] to share a sharp insight, opinion, or takeaway related to [enter topic or industry].',
  'The main point I want to communicate in one tweet is [enter your core idea].',
  '[enter your target audience on X / Twitter]',
  'Short sentences, high signal, no fluff, conversational',
  ARRAY[
    jsonb_build_object(
      'section', 'Tweet',
      'wordCount', 40,
      'description', 'One concise, impactful tweet expressing [core idea] within 280 characters.'
    )
  ]::jsonb[],
  false,
  true,
  'Single Tweet',
  'Create sharp, impactful tweets that deliver high-signal insights in 280 characters or less',
  now()
);