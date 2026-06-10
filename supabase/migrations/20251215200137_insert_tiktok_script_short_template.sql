/*
  # Insert TikTok Script (Short) Template

  1. New Template
    - Template Name: "11.) TikTok Script (Short)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Short TikTok script for explaining or promoting in a natural, spoken way
    - keyMessage: The one idea viewers must understand by the end of the video
    - targetAudience: "[enter your TikTok audience]"
    - tone: "Natural, confident, engaging"
    - preferred_writing_style: "Spoken language, short sentences, no jargon"
    
  3. Output Structure
    - 3 structured sections for TikTok Script
    - Hook (First 2–3 Seconds) (10 words)
    - Core Message (20 words)
    - CTA or Close (10 words)
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
  '11.) TikTok Script (Short)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Short TikTok script for [enter your business name] explaining or promoting [enter topic, product, or idea] in a natural, spoken way.',
  'The one idea viewers must understand by the end of the video is [enter core takeaway].',
  '[enter your TikTok audience]',
  'Natural, confident, engaging',
  'Spoken language, short sentences, no jargon',
  'English',
  'short',
  ARRAY[
    '{"section": "Hook (First 2–3 Seconds)", "wordCount": 10, "description": "Immediate spoken hook that stops the scroll."}'::jsonb,
    '{"section": "Core Message", "wordCount": 20, "description": "Main point, insight, or explanation delivered clearly."}'::jsonb,
    '{"section": "CTA or Close", "wordCount": 10, "description": "Optional closing line encouraging engagement or action."}'::jsonb
  ]
);