/*
  # Insert Instagram Story Text (Slide by Slide) Template

  1. New Template
    - Template Name: "11.) Instagram Story Text (Slide by Slide)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Instagram Story copy written slide by slide
    - keyMessage: The main message to communicate across the story sequence
    - targetAudience: "[enter your Instagram audience]"
    - tone: "Casual, engaging, clear"
    - preferred_writing_style: "Very short lines, conversational, visual-first"
    
  3. Output Structure
    - 5 structured sections for Instagram Story slides
    - Slide 1 – Hook (8 words)
    - Slide 2 – Context (10 words)
    - Slide 3 – Value (10 words)
    - Slide 4 – Solution (10 words)
    - Slide 5 – CTA (8 words)
*/

INSERT INTO pmc_templates (
  user_id,
  template_name,
  template_type,
  is_public,
  business_description,
  product_service_name,
  project_description,
  key_message,
  target_audience,
  tone,
  preferred_writing_style,
  language,
  word_count,
  output_structure
)
VALUES (
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) Instagram Story Text (Slide by Slide)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Instagram Story copy written slide by slide for [enter your business name], promoting [enter product / service] or communicating [enter message or offer]. Designed for fast consumption and taps forward.',
  'The main message to communicate across the story sequence is [enter key message or offer].',
  '[enter your Instagram audience]',
  'Casual, engaging, clear',
  'Very short lines, conversational, visual-first',
  'English',
  'custom',
  ARRAY[
    '{"section": "Slide 1 – Hook", "wordCount": 8, "description": "Immediate attention grabber (question, bold statement, or curiosity hook)."}'::jsonb,
    '{"section": "Slide 2 – Context", "wordCount": 10, "description": "Brief context or problem relevant to [target audience]."}'::jsonb,
    '{"section": "Slide 3 – Value", "wordCount": 10, "description": "Main insight, benefit, or idea."}'::jsonb,
    '{"section": "Slide 4 – Solution", "wordCount": 10, "description": "Introduce [product / service] or the solution."}'::jsonb,
    '{"section": "Slide 5 – CTA", "wordCount": 8, "description": "Clear action (swipe, reply, DM, tap link)."}'::jsonb
  ]
);