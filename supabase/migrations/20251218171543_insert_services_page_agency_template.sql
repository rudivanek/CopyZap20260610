/*
  # Insert Services Page – Agency Style Template

  1. Purpose
    - Creates a professional services page template for agencies
    - Focuses on outcomes, expertise, and strategic positioning
    - Helps potential clients understand offerings and process

  2. Template Configuration
    - Template Name: "11.) Services Page – Agency Style"
    - Type: create
    - Public: true (accessible to all users)
    - Create Variants: false

  3. Prefilled Fields
    - businessDescription: Agency or business context
    - productServiceName: Main service category
    - projectDescription: Clear professional services page creation
    - keyMessage: Core value and positioning differentiator
    - targetAudience: Ideal client type or industry
    - tone: Professional, confident, trustworthy
    - writingStyle: Clear, structured, benefit-oriented
    - primaryCTA: Next step action

  4. Output Structure
    - 10 structured sections covering complete services page
    - Headline, intro, service descriptions, process, differentiators, qualification
    - Total word count: ~1,044 words across all sections
    - Focuses on outcomes over deliverables

  5. Services Page Logic
    - Clearly explain what services are offered
    - Emphasize outcomes, not just deliverables
    - Show expertise and process clarity
    - Reduce uncertainty for potential clients
    - Position agency as strategic partner
    - Avoid jargon, hype, or buzzwords

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
  '11.) Services Page – Agency Style',
  'create',
  'Website Pages',
  'Professional, confident, trustworthy',
  'English',
  'long',
  '[enter your agency or business description]',
  '[enter main service category or offering]',
  'Create a clear, professional services page that explains what we offer, how we work, and why clients should choose us.',
  'The core value and positioning of our services is [enter main differentiator or promise].',
  '[enter ideal client type or industry]',
  'Clear, structured, benefit-oriented',
  '[enter primary call to action, e.g. Book a Call, Request a Proposal, Contact Us]',
  ARRAY[
    jsonb_build_object(
      'section', 'Services Page Headline',
      'wordCount', 14,
      'description', 'Clear headline explaining what the agency helps clients achieve.'
    ),
    jsonb_build_object(
      'section', 'Intro / Positioning',
      'wordCount', 90,
      'description', 'Short introduction explaining who the services are for and the agency''s approach.'
    ),
    jsonb_build_object(
      'section', 'Core Services Overview',
      'wordCount', 120,
      'description', 'High-level overview of the main service categories.'
    ),
    jsonb_build_object(
      'section', 'Service 1 – Description & Outcomes',
      'wordCount', 140,
      'description', 'Explain the service, who it''s for, and the outcomes clients can expect.'
    ),
    jsonb_build_object(
      'section', 'Service 2 – Description & Outcomes',
      'wordCount', 140,
      'description', 'Second core service with focus on value and results.'
    ),
    jsonb_build_object(
      'section', 'Service 3 – Description & Outcomes',
      'wordCount', 140,
      'description', 'Optional third service or specialization.'
    ),
    jsonb_build_object(
      'section', 'How We Work',
      'wordCount', 140,
      'description', 'Outline the agency''s process in simple steps.'
    ),
    jsonb_build_object(
      'section', 'Why Choose Us',
      'wordCount', 120,
      'description', 'Differentiators, expertise, and trust signals.'
    ),
    jsonb_build_object(
      'section', 'Who This Is For / Not For',
      'wordCount', 120,
      'description', 'Clarify ideal clients and set expectations.'
    ),
    jsonb_build_object(
      'section', 'Final CTA',
      'wordCount', 20,
      'description', 'Encourage qualified visitors to take the next step.'
    )
  ]::jsonb[],
  true,
  true,
  'Services Page – Agency Style',
  'Create professional services pages that explain offerings, demonstrate expertise, outline process, and position your agency as a strategic partner clients can trust.',
  false,
  now()
);