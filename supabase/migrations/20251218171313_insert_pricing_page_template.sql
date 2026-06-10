/*
  # Insert Pricing Page Copy Template

  1. Purpose
    - Creates a comprehensive pricing page template that reduces buyer anxiety
    - Focuses on clear communication of value and plan differentiation
    - Helps visitors confidently choose the right pricing option

  2. Template Configuration
    - Template Name: "11.) Pricing Page Copy"
    - Type: create
    - Public: true (accessible to all users)
    - Create Variants: false

  3. Prefilled Fields
    - businessDescription: Placeholder for business context
    - productServiceName: Product/service being sold
    - projectDescription: Trust-building pricing page creation
    - keyMessage: Pricing philosophy and positioning
    - targetAudience: Ideal buyer persona
    - tone: Transparent, confident, reassuring
    - writingStyle: Clear, benefit-focused, low-pressure
    - primaryCTA: Next step action

  4. Output Structure
    - 10 structured sections covering complete pricing page flow
    - Headline, intro, plan overviews, comparisons, trust signals, FAQ
    - Total word count: ~894 words across all sections
    - Follows trust-building and objection-handling best practices

  5. Pricing Page Logic
    - Reduce anxiety around pricing decisions
    - Clearly explain what's included in each plan
    - Emphasize value over features
    - Guide users toward best-fit option
    - Handle common pricing objections
    - Avoid aggressive or manipulative language

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
  '11.) Pricing Page Copy',
  'create',
  'Pricing Pages',
  'Transparent, confident, reassuring',
  'English',
  'medium',
  '[enter your business description]',
  '[enter product / service name]',
  'Create a clear, trust-building pricing page that helps visitors understand plans and confidently choose the right option.',
  'The pricing philosophy and main value promise is [enter pricing logic or positioning].',
  '[enter your ideal customer or buyer persona]',
  'Clear, benefit-focused, low-pressure',
  '[enter primary call to action, e.g. Start Free Trial, Book a Call, Get Started]',
  ARRAY[
    jsonb_build_object(
      'section', 'Pricing Page Headline',
      'wordCount', 14,
      'description', 'Clear headline explaining pricing approach or value.'
    ),
    jsonb_build_object(
      'section', 'Pricing Introduction',
      'wordCount', 60,
      'description', 'Brief explanation of how pricing works and who it''s for.'
    ),
    jsonb_build_object(
      'section', 'Plan Overview',
      'wordCount', 120,
      'description', 'High-level overview of available plans or tiers.'
    ),
    jsonb_build_object(
      'section', 'Plan A Description',
      'wordCount', 120,
      'description', 'Who this plan is for, what''s included, and its main benefit.'
    ),
    jsonb_build_object(
      'section', 'Plan B Description',
      'wordCount', 120,
      'description', 'Who this plan is for, what''s included, and its main benefit.'
    ),
    jsonb_build_object(
      'section', 'Plan C Description',
      'wordCount', 120,
      'description', 'Optional third plan or premium tier.'
    ),
    jsonb_build_object(
      'section', 'Feature Comparison Highlights',
      'wordCount', 100,
      'description', 'Key differences between plans explained simply.'
    ),
    jsonb_build_object(
      'section', 'Trust & Guarantees',
      'wordCount', 80,
      'description', 'Risk reducers such as guarantees, trials, or support promises.'
    ),
    jsonb_build_object(
      'section', 'Pricing FAQ',
      'wordCount', 140,
      'description', 'Answers to common pricing-related questions.'
    ),
    jsonb_build_object(
      'section', 'Final CTA',
      'wordCount', 20,
      'description', 'Encourage the visitor to take the next step.'
    )
  ]::jsonb[],
  true,
  true,
  'Pricing Page Copy',
  'Create clear, trust-building pricing pages with plan comparisons, value-focused descriptions, FAQs, and risk reducers to help visitors confidently choose the right option.',
  false,
  now()
);