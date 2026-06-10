/*
  # Insert Review → Marketing Copy Template

  1. Purpose
    - Transforms raw customer reviews into polished marketing copy
    - Preserves authenticity while improving clarity and usability
    - Suitable for websites, landing pages, and sales materials

  2. Template Configuration
    - Template Name: "11.) Review → Marketing Copy"
    - Type: improve
    - Public: true (accessible to all users)
    - Create Variants: false (single output)

  3. Template Logic
    - Preserves original meaning and sentiment
    - Removes repetition, rambling, or unclear phrasing
    - Translates emotion into concrete benefits or outcomes
    - Maintains human voice without exaggeration
    - No invented claims or metrics

  4. Input Fields
    - business_description: Business context
    - product_service_name: Product or service being reviewed
    - project_description: Purpose of the transformation
    - original_copy: Raw customer review
    - target_audience: Intended readers
    - tone: "Authentic, trustworthy, human"
    - preferred_writing_style: "Clear, benefit-focused, natural language"

  5. Output Structure
    - 2 structured sections:
      1. Polished Review Copy (80 words) - clean, concise marketing-ready version
      2. Key Benefit Highlight (30 words) - summary of main benefit/outcome
    - Total word count: ~110 words

  6. Transformation Rules
    - Preserve original meaning and sentiment
    - Remove repetition and unclear phrasing
    - Translate emotion into concrete benefits
    - Avoid exaggeration or invented claims
    - Keep natural, human voice
    - Do NOT over-polish into corporate language
    - Do NOT change reviewer's intent

  7. Security
    - Public template accessible to all authenticated users
    - No special permissions required
*/

INSERT INTO public.pmc_templates (
  id,
  user_id,
  template_name,
  template_type,
  category,
  tone,
  language,
  word_count,
  preferred_writing_style,
  special_instructions,
  business_description,
  product_service_name,
  project_description,
  target_audience,
  original_copy,
  output_structure,
  include_section_titles,
  is_public,
  public_name,
  public_description,
  create_variants,
  created_at
) VALUES (
  gen_random_uuid(),
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) Review → Marketing Copy',
  'improve',
  'Sales & Conversion',
  'Authentic, trustworthy, human',
  'English',
  'short',
  'Clear, benefit-focused, natural language',
  'Transform a raw customer review into clear, credible marketing copy.

The output must:

- Preserve the original meaning and sentiment of the review
- Remove repetition, rambling, or unclear phrasing
- Translate emotion into concrete benefits or outcomes
- Avoid exaggeration or invented claims
- Sound human, not like an ad
- Be suitable for public-facing marketing use

Do NOT:
- Invent new results or metrics
- Over-polish into corporate language
- Change the reviewer''s intent

The final copy should feel authentic and trustworthy while being clear and benefit-focused.',
  '[enter your business description]',
  '[enter product / service name]',
  'Transform a raw customer review into clear, credible marketing copy that can be used on a website, landing page, or sales material.',
  '[enter who should read this review-based copy]',
  '[paste the raw customer review here]',
  ARRAY[
    jsonb_build_object(
      'section', 'Polished Review Copy',
      'wordCount', 80,
      'description', 'Clean, concise version of the review suitable for marketing use.'
    ),
    jsonb_build_object(
      'section', 'Key Benefit Highlight',
      'wordCount', 30,
      'description', 'Short summary of the main benefit or outcome expressed in the review.'
    )
  ]::jsonb[],
  true,
  true,
  'Review → Marketing Copy',
  'Transform raw customer reviews into polished, authentic marketing copy that preserves the original sentiment while improving clarity and usability.',
  false,
  now()
);