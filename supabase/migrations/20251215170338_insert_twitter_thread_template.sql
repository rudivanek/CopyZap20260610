/*
  # Insert Twitter Thread (5–7 Tweets) Template

  1. New Template
    - Name: "11.) Twitter Thread (5–7 Tweets)"
    - Type: create
    - Purpose: Pre-configured template for creating multi-tweet threads on X/Twitter
    - Available publicly for all users

  2. Features
    - Multi-section output (5-7 tweets in a structured thread)
    - Prefilled fields with placeholder text for easy customization
    - Clear, confident, authoritative tone
    - Character-optimized for X/Twitter (280 character hard limit per tweet, 180-240 optimal)
    - Skimmable, high-signal, conversational style
    - Each tweet designed to stand alone while building narrative

  3. Output Structure
    - Tweet 1 – Hook (40 words / ~280 characters): Scroll-stopping opening
    - Tweet 2 – Context (40 words / ~280 characters): Background or problem
    - Tweet 3 – Insight (40 words / ~280 characters): First key lesson
    - Tweet 4 – Insight (40 words / ~280 characters): Second supporting argument
    - Tweet 5 – Insight (40 words / ~280 characters): Third insight or proof
    - Tweet 6 – Optional Expansion (40 words / ~280 characters): Deeper insight (if 6-7 tweets)
    - Tweet 7 – CTA / Close (40 words / ~280 characters): Wrap-up or engagement prompt

  4. Thread Logic
    - Total tweets: 5–7
    - Each tweet must be under 280 characters (hard limit)
    - Preferred range per tweet: 180–240 characters
    - Use line breaks for readability
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
  '11.) Twitter Thread (5–7 Tweets)',
  'create',
  'Clear, confident, authoritative',
  'English',
  'Short: 50-100',
  '[enter your business description]',
  '[enter product / service name]',
  'Twitter (X) thread written from [enter your role or brand] to explain, teach, or persuade around [enter topic]. The thread should feel valuable and skimmable.',
  'The main idea of this thread is [enter the core insight or lesson].',
  '[enter your target audience on X / Twitter]',
  'Short sentences, high signal, skimmable, conversational',
  ARRAY[
    jsonb_build_object(
      'section', 'Tweet 1 – Hook',
      'wordCount', 40,
      'description', 'Scroll-stopping opening tweet that promises value or challenges a belief about [topic].'
    ),
    jsonb_build_object(
      'section', 'Tweet 2 – Context',
      'wordCount', 40,
      'description', 'Explain the background, problem, or situation related to [topic].'
    ),
    jsonb_build_object(
      'section', 'Tweet 3 – Insight',
      'wordCount', 40,
      'description', 'Share the first key insight or lesson.'
    ),
    jsonb_build_object(
      'section', 'Tweet 4 – Insight',
      'wordCount', 40,
      'description', 'Share the second key insight or supporting argument.'
    ),
    jsonb_build_object(
      'section', 'Tweet 5 – Insight',
      'wordCount', 40,
      'description', 'Share the third insight, example, or proof.'
    ),
    jsonb_build_object(
      'section', 'Tweet 6 – Optional Expansion',
      'wordCount', 40,
      'description', 'Optional deeper insight or example (only if 6–7 tweets are generated).'
    ),
    jsonb_build_object(
      'section', 'Tweet 7 – CTA / Close',
      'wordCount', 40,
      'description', 'Wrap-up or engagement CTA (reply, follow, bookmark).'
    )
  ]::jsonb[],
  true,
  true,
  'Twitter Thread (5–7 Tweets)',
  'Create valuable, skimmable Twitter threads that explain, teach, or persuade with 5-7 character-optimized tweets',
  now()
);