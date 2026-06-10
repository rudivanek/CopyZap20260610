/*
  # Insert Instagram Caption (Feed) Template

  1. New Template
    - Template Name: "11.) Instagram Caption (Feed)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Instagram feed caption for promoting products or sharing content
    - keyMessage: The main message or takeaway of the post
    - targetAudience: "[enter your Instagram audience]"
    - tone: "Friendly, engaging, on-brand"
    - preferred_writing_style: "Conversational, skimmable, visually separated lines"
    
  3. Output Structure
    - 4 structured sections for Instagram feed caption
    - Hook (25 words)
    - Main Caption (90 words)
    - Engagement CTA (20 words)
    - Hashtags (20 words)
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
  '11.) Instagram Caption (Feed)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Instagram feed caption for [enter your business name] promoting [enter product / service] or sharing content related to [enter topic]. Designed to stop the scroll and drive engagement.',
  'The main message or takeaway of this post is [enter key idea or benefit].',
  '[enter your Instagram audience]',
  'Friendly, engaging, on-brand',
  'Conversational, skimmable, visually separated lines',
  'English',
  'custom',
  ARRAY[
    '{"section": "Hook", "wordCount": 25, "description": "First 1–2 lines designed to stop the scroll."}'::jsonb,
    '{"section": "Main Caption", "wordCount": 90, "description": "Core message, story, or value related to [key message]."}'::jsonb,
    '{"section": "Engagement CTA", "wordCount": 20, "description": "Encourage comments, saves, or shares."}'::jsonb,
    '{"section": "Hashtags", "wordCount": 20, "description": "Relevant hashtags for reach and discoverability."}'::jsonb
  ]
);