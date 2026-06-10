/*
  # Insert SEO Meta Optimizer Template

  1. New Template
    - Name: "11.) SEO Meta Optimizer (Title + Meta Rewrite)"
    - Type: improve
    - Purpose: Optimize SEO meta title and meta description for better search visibility
    - Available for use but not public (is_public = false)

  2. Features
    - 4-section structured output (2 title options + 2 description options)
    - Strict character limits enforced (60 chars for title, 160 for description)
    - Prefilled fields with placeholder text for easy customization
    - Focuses on clarity, intent, and human-first optimization
    - Avoids keyword stuffing and clickbait

  3. Output Structure
    - Optimized Meta Title – Option 1 (10 words, max 60 chars)
    - Optimized Meta Title – Option 2 (10 words, max 60 chars)
    - Optimized Meta Description – Option 1 (25 words, max 160 chars)
    - Optimized Meta Description – Option 2 (25 words, max 160 chars)

  4. Character Constraints
    - Meta Title: 50–60 characters (hard max 60)
    - Meta Description: 150–160 characters (hard max 160)
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
  original_copy,
  key_message,
  target_audience,
  preferred_writing_style,
  output_structure,
  include_section_titles,
  is_public,
  created_at
) VALUES (
  gen_random_uuid(),
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) SEO Meta Optimizer (Title + Meta Rewrite)',
  'improve',
  'Clear, trustworthy, click-worthy',
  'English',
  'short',
  '[enter your business description]',
  '[enter product / service name]',
  'Optimize the SEO meta title and meta description for the page [enter page URL or page purpose] to improve search visibility and click-through rate.',
  '[paste current meta title and meta description here]',
  'The main keyword or topic to prioritize is [enter primary keyword or phrase].',
  '[enter target audience searching for this page]',
  'Concise, SEO-optimized, human-readable',
  ARRAY[
    jsonb_build_object(
      'section', 'Optimized Meta Title – Option 1',
      'wordCount', 10,
      'description', 'Primary SEO-optimized title within 60 characters. Must be clear, compelling, and include the main keyword naturally.'
    ),
    jsonb_build_object(
      'section', 'Optimized Meta Title – Option 2',
      'wordCount', 10,
      'description', 'Alternative title with a different angle or phrasing, still within 60 characters.'
    ),
    jsonb_build_object(
      'section', 'Optimized Meta Description – Option 1',
      'wordCount', 25,
      'description', 'Primary description within 160 characters, focused on value and intent. Include a subtle call-to-action.'
    ),
    jsonb_build_object(
      'section', 'Optimized Meta Description – Option 2',
      'wordCount', 25,
      'description', 'Alternative description with a different hook or CTA, still within 160 characters.'
    )
  ]::jsonb[],
  true,
  false,
  now()
);
