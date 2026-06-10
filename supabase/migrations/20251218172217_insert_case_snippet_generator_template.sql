/*
  # Insert Case Snippet Generator Template

  1. Purpose
    - Creates short, reusable case proof snippets from existing content
    - Generates three variants in a single generation
    - Designed for landing pages, services pages, pricing pages, feature pages, and sales materials

  2. Template Configuration
    - Template Name: "11.) Case Snippet Generator (Short Proof Blocks)"
    - Type: improve
    - Public: true (accessible to all users)
    - Create Variants: true (generates all three snippet types in one response)

  3. Template Logic
    - Uses special_instructions to define the generation rules
    - Generates THREE distinct proof snippet styles
    - Each snippet is standalone and reusable
    - Focuses on concrete results, outcomes, or transformations

  4. Input Fields
    - original_copy: Case study, testimonial, notes, or results to transform
    - business_description: Business context
    - target_audience: Target audience for the proof snippets

  5. Output Structure
    - 3 structured sections with specific styles:
      1. Result-Focused Snippet (40 words) - outcome/metric-driven
      2. Problem → Solution Snippet (45 words) - challenge and resolution narrative
      3. Quote-Style Proof Snippet (35 words) - customer quote with result
    - Total word count: ~120 words across all variants

  6. Snippet Requirements
    - Stand-alone blocks suitable for immediate use
    - Avoid vague praise and marketing fluff
    - Prefer specificity and clarity over hype
    - Keep language credible and grounded
    - No exaggerated claims

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
  special_instructions,
  business_description,
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
  '11.) Case Snippet Generator (Short Proof Blocks)',
  'improve',
  'Sales & Conversion',
  'Credible, specific, outcome-focused',
  'English',
  'short',
  'Generate THREE short case proof snippets in ONE response.

Each snippet must be a standalone, reusable proof block that highlights a concrete result, outcome, or transformation.

The snippets should be suitable for use on:
- Landing pages
- Services pages
- Pricing pages
- SaaS feature pages
- Sales decks or proposals

VARIANT REQUIREMENTS:

You MUST generate ALL THREE variants below:

1) Result-Focused Snippet  
   - Emphasize a clear outcome or metric  
   - Short headline + 1–2 sentence explanation  

2) Problem → Solution Snippet  
   - Briefly describe the challenge and how it was solved  
   - Outcome-oriented, not technical  

3) Quote-Style Proof Snippet  
   - Short quote (realistic or derived)  
   - Followed by a concise interpretation or result  

STRICT RULES:

- Each snippet must stand on its own
- Avoid vague praise (e.g. "great service", "amazing results")
- Prefer specificity and clarity over hype
- Keep language credible and grounded
- No marketing fluff or exaggerated claims
- Suitable for immediate copy-paste use',
  '[enter business description or company context]',
  '[enter target audience for these proof snippets]',
  '[paste case study, testimonial, results summary, or client notes here]',
  ARRAY[
    jsonb_build_object(
      'section', 'Case Snippet – Result Focused',
      'wordCount', 40,
      'description', 'Outcome- or metric-driven proof block.'
    ),
    jsonb_build_object(
      'section', 'Case Snippet – Problem to Solution',
      'wordCount', 45,
      'description', 'Short narrative showing challenge and resolution.'
    ),
    jsonb_build_object(
      'section', 'Case Snippet – Quote Style',
      'wordCount', 35,
      'description', 'Customer-style quote with implied result.'
    )
  ]::jsonb[],
  true,
  true,
  'Case Snippet Generator',
  'Transform case studies and testimonials into three short, reusable proof blocks perfect for landing pages, feature pages, and sales materials.',
  true,
  now()
);