/*
  # Insert SaaS Feature Page Template

  1. Purpose
    - Creates a SaaS feature page template
    - Focuses on explaining feature functionality and user benefits
    - Helps translate technical features into compelling value propositions

  2. Template Configuration
    - Template Name: "11.) SaaS Feature Page"
    - Type: create
    - Public: true (accessible to all users)
    - Create Variants: false

  3. Prefilled Fields
    - businessDescription: SaaS business context
    - productServiceName: SaaS product name
    - projectDescription: Create feature page explaining value and outcomes
    - keyMessage: Primary feature benefit or outcome
    - targetAudience: Target user or customer segment
    - tone: Clear, confident, product-focused
    - writingStyle: Benefit-driven, simple, user-oriented
    - primaryCTA: Next step action

  4. Output Structure
    - 9 structured sections covering complete feature page
    - Headline, subheadline, problem, how it works, benefits, use cases, integration, proof, CTA
    - Total word count: ~724 words across all sections
    - Focuses on benefits over technical specs

  5. SaaS Feature Page Logic
    - Clearly explain what the feature does
    - Translate functionality into user benefits
    - Address the problem the feature solves
    - Show how the feature fits into the overall product
    - Reduce friction and uncertainty
    - Avoid technical overload and buzzwords

  6. Security
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
  business_description,
  product_service_name,
  project_description,
  key_message,
  target_audience,
  preferred_writing_style,
  call_to_action,
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
  '11.) SaaS Feature Page',
  'create',
  'SaaS Content',
  'Clear, confident, product-focused',
  'English',
  'medium',
  '[enter your SaaS business description]',
  '[enter SaaS product name]',
  'Create a SaaS feature page that clearly explains what this feature does, why it matters, and how it helps users achieve better outcomes.',
  'The primary value of this feature is [enter main benefit or outcome].',
  '[enter target user or customer segment]',
  'Benefit-driven, simple, user-oriented',
  '[enter primary call to action, e.g. Try It Free, Enable Feature, Book a Demo]',
  ARRAY[
    jsonb_build_object(
      'section', 'Feature Headline',
      'wordCount', 14,
      'description', 'Clear headline describing the feature''s primary benefit.'
    ),
    jsonb_build_object(
      'section', 'Feature Subheadline',
      'wordCount', 30,
      'description', 'Short explanation clarifying what the feature does and who it''s for.'
    ),
    jsonb_build_object(
      'section', 'Problem This Feature Solves',
      'wordCount', 100,
      'description', 'Describe the user pain point or limitation addressed.'
    ),
    jsonb_build_object(
      'section', 'How the Feature Works',
      'wordCount', 140,
      'description', 'Simple explanation of how the feature functions in practice.'
    ),
    jsonb_build_object(
      'section', 'Key Benefits',
      'wordCount', 120,
      'description', '3–5 benefit-focused bullet points.'
    ),
    jsonb_build_object(
      'section', 'Use Cases',
      'wordCount', 120,
      'description', 'Realistic scenarios where this feature is valuable.'
    ),
    jsonb_build_object(
      'section', 'Integration With the Product',
      'wordCount', 100,
      'description', 'Explain how this feature fits into the broader SaaS platform.'
    ),
    jsonb_build_object(
      'section', 'Trust Signals / Proof',
      'wordCount', 80,
      'description', 'Adoption metrics, testimonials, or credibility indicators.'
    ),
    jsonb_build_object(
      'section', 'Final CTA',
      'wordCount', 20,
      'description', 'Encourage users to try or explore the feature.'
    )
  ]::jsonb[],
  true,
  true,
  'SaaS Feature Page',
  'Create compelling SaaS feature pages that explain what features do, translate functionality into benefits, and show users how to achieve better outcomes.',
  false,
  now()
);