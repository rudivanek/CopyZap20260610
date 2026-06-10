/*
  # Insert TikTok Caption Template

  1. New Template
    - Template Name: "11.) TikTok Caption"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: TikTok caption for supporting a short-form video
    - keyMessage: The main idea viewers should understand after reading the caption
    - targetAudience: "[enter your TikTok audience]"
    - tone: "Casual, engaging, native"
    - preferred_writing_style: "Short lines, conversational, informal"
    
  3. Output Structure
    - 4 structured sections for TikTok Caption
    - Hook Line (15 words)
    - Supporting Context (40 words)
    - Engagement CTA (15 words)
    - Hashtags (15 words)
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
  '11.) TikTok Caption',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'TikTok caption for [enter your business name] supporting a short-form video about [enter topic, product, or message]. The caption should add context and encourage engagement.',
  'The main idea viewers should understand after reading the caption is [enter key takeaway].',
  '[enter your TikTok audience]',
  'Casual, engaging, native',
  'Short lines, conversational, informal',
  'English',
  'short',
  ARRAY[
    '{"section": "Hook Line", "wordCount": 15, "description": "First line that adds intrigue or context to the video."}'::jsonb,
    '{"section": "Supporting Context", "wordCount": 40, "description": "Brief explanation or takeaway related to the video content."}'::jsonb,
    '{"section": "Engagement CTA", "wordCount": 15, "description": "Encourage interaction (comment, follow, save)."}'::jsonb,
    '{"section": "Hashtags", "wordCount": 15, "description": "Relevant hashtags to support discovery."}'::jsonb
  ]
);