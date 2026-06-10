/*
  # Insert LinkedIn Personal Post Template

  1. New Template
    - Name: "12.) LinkedIn Personal Post – Founder / Expert"
    - Type: create
    - Purpose: Pre-configured template for founders/experts to create LinkedIn posts
    - Available publicly for all users

  2. Features
    - 4-section structured output (Hook, Context, Value, CTA)
    - Prefilled fields with placeholder text for easy customization
    - Professional + conversational tone
    - Default medium word count (150–250 words)
    - First-person perspective

  3. Output Structure
    - Hook (30 words)
    - Context / Personal Insight (100 words)
    - Value or Lesson (80 words)
    - Soft CTA (30 words)
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
  project_description,
  key_message,
  target_audience,
  preferred_writing_style,
  product_service_name,
  output_structure,
  include_section_titles,
  is_public,
  public_name,
  public_description,
  created_at
) VALUES (
  gen_random_uuid(),
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '12.) LinkedIn Personal Post – Founder / Expert',
  'create',
  'Professional, authentic, insightful',
  'English',
  'medium',
  '[enter your business description]',
  'LinkedIn personal post written from the perspective of a founder or expert at [enter your business name], sharing an insight, lesson, or opinion related to [enter your industry or topic].',
  'The key insight I want to share is [enter your main insight or belief].',
  '[enter your target audience on LinkedIn]',
  'First-person, clear, confident, conversational, expert tone',
  '[enter product / service name]',
  ARRAY[
    jsonb_build_object(
      'section', 'Hook',
      'wordCount', 30,
      'description', 'Strong first 1–2 lines to stop the LinkedIn scroll. Reference [problem, belief, or bold statement].'
    ),
    jsonb_build_object(
      'section', 'Context / Personal Insight',
      'wordCount', 100,
      'description', 'Personal experience, lesson learned, or expert perspective from [your role or experience].'
    ),
    jsonb_build_object(
      'section', 'Value or Lesson',
      'wordCount', 80,
      'description', 'Clear takeaway or insight for [target audience].'
    ),
    jsonb_build_object(
      'section', 'Soft CTA',
      'wordCount', 30,
      'description', 'Invite discussion, comment, or reflection (no hard selling).'
    )
  ]::jsonb[],
  true,
  true,
  'LinkedIn Personal Post – Founder / Expert',
  'Create authentic LinkedIn posts sharing founder insights and expertise with your professional network',
  now()
);
