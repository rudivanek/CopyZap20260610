/*
  # Insert Twitter Viral Hook Generator Template

  1. New Template
    - Template Name: "11.) Twitter – Viral Hook Generator"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Generate scroll-stopping viral hooks for Twitter (X)
    - keyMessage: The core idea that should instantly capture attention
    - targetAudience: "[enter your target audience on X / Twitter]"
    - tone: "Bold, confident, provocative"
    - preferred_writing_style: "Short, sharp, high-contrast, conversational"
    
  3. Output Structure
    - 5 structured sections for different hook types
    - Bold Statement Hook (25 words)
    - Contrarian Hook (25 words)
    - Question Hook (25 words)
    - Data / Insight Hook (25 words)
    - Outcome / Promise Hook (25 words)
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
  '11.) Twitter – Viral Hook Generator',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Generate scroll-stopping viral hooks for Twitter (X) written by [enter your role or brand] related to [enter topic, insight, or message]. These hooks are designed to be the first tweet of a post or thread.',
  'The core idea that should instantly capture attention is [enter main insight, belief, or claim].',
  '[enter your target audience on X / Twitter]',
  'Bold, confident, provocative',
  'Short, sharp, high-contrast, conversational',
  'English',
  'medium',
  ARRAY[
    '{"section": "Bold Statement Hook", "wordCount": 25, "description": "Strong declarative hook that states a clear belief or claim."}'::jsonb,
    '{"section": "Contrarian Hook", "wordCount": 25, "description": "Hook that challenges a common assumption in [industry or topic]."}'::jsonb,
    '{"section": "Question Hook", "wordCount": 25, "description": "Direct question that invites reaction or reflection."}'::jsonb,
    '{"section": "Data / Insight Hook", "wordCount": 25, "description": "Specific insight, observation, or surprising fact."}'::jsonb,
    '{"section": "Outcome / Promise Hook", "wordCount": 25, "description": "Hook that promises a clear result or takeaway."}'::jsonb
  ]
);