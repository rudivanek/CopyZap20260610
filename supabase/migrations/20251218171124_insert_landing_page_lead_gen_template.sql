/*
  # Insert Landing Page – Lead Generation Template

  1. Purpose
    - Creates a comprehensive landing page template optimized for lead generation
    - Focuses on conversion-focused copywriting with structured sections
    - Provides clear guidance for creating high-converting landing pages

  2. Template Configuration
    - Template Name: "11.) Landing Page – Lead Generation"
    - Type: create
    - Public: true (accessible to all users)
    - Create Variants: false

  3. Prefilled Fields
    - businessDescription: Placeholder for business context
    - productServiceName: Product/service being promoted
    - projectDescription: Lead generation landing page creation
    - keyMessage: Main value proposition
    - targetAudience: Ideal customer definition
    - tone: Clear, confident, trustworthy
    - writingStyle: Conversion-focused, concise, benefit-driven
    - primaryCTA: Call to action placeholder

  4. Output Structure
    - 10 structured sections covering complete landing page flow
    - Hero elements, problem/solution, benefits, trust signals, CTAs
    - Total word count: ~678 words across all sections
    - Follows conversion-focused best practices

  5. Conversion Logic
    - Focus on ONE primary goal: lead capture
    - Eliminate distractions and secondary offers
    - Clear value communication above the fold
    - Address objections before the form
    - Reinforce trust and credibility
    - Simple, persuasive language without hype

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
  '11.) Landing Page – Lead Generation',
  'create',
  'Landing Pages',
  'Clear, confident, trustworthy',
  'English',
  'medium',
  '[enter your business description]',
  '[enter product / service name]',
  'Create a high-conversion landing page whose primary goal is lead generation for [enter product / service name].',
  'The main value proposition or offer is [enter main benefit or promise].',
  '[enter your ideal customer or audience]',
  'Conversion-focused, concise, benefit-driven',
  '[enter primary call to action, e.g. Book a Call, Get the Guide, Request a Demo]',
  ARRAY[
    jsonb_build_object(
      'section', 'Hero Headline',
      'wordCount', 12,
      'description', 'Clear, benefit-driven headline stating the main promise.'
    ),
    jsonb_build_object(
      'section', 'Hero Subheadline',
      'wordCount', 30,
      'description', 'Supporting explanation that clarifies the offer and audience.'
    ),
    jsonb_build_object(
      'section', 'Primary CTA',
      'wordCount', 6,
      'description', 'Clear call to action encouraging the visitor to convert.'
    ),
    jsonb_build_object(
      'section', 'Problem Statement',
      'wordCount', 90,
      'description', 'Describe the core problem the audience is facing.'
    ),
    jsonb_build_object(
      'section', 'Solution Overview',
      'wordCount', 100,
      'description', 'Explain how the product or service solves the problem.'
    ),
    jsonb_build_object(
      'section', 'Key Benefits',
      'wordCount', 120,
      'description', '3–5 concise benefit bullets focused on outcomes.'
    ),
    jsonb_build_object(
      'section', 'How It Works',
      'wordCount', 120,
      'description', 'Simple step-by-step explanation of the process.'
    ),
    jsonb_build_object(
      'section', 'Social Proof / Trust Signals',
      'wordCount', 80,
      'description', 'Testimonials, credentials, or credibility indicators.'
    ),
    jsonb_build_object(
      'section', 'Objection Handling',
      'wordCount', 100,
      'description', 'Address common doubts or hesitations.'
    ),
    jsonb_build_object(
      'section', 'Final CTA',
      'wordCount', 20,
      'description', 'Reinforce the call to action and urgency.'
    )
  ]::jsonb[],
  true,
  true,
  'Landing Page – Lead Generation',
  'Create high-conversion landing pages focused on lead capture with structured sections covering hero, problem/solution, benefits, social proof, and compelling CTAs.',
  false,
  now()
);