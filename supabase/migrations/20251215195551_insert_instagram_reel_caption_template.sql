/*
  # Insert Instagram Reel Caption Template

  1. New Template
    - Template Name: "11.) Instagram Reel Caption"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Instagram Reel caption supporting a short-form video
    - keyMessage: The main idea viewers should remember after watching the reel
    - targetAudience: "[enter your Instagram audience]"
    - tone: "Engaging, energetic, on-brand"
    - preferred_writing_style: "Short paragraphs, conversational, scroll-friendly"
    
  3. Output Structure
    - 4 structured sections for Instagram Reel Caption
    - Hook Line (20 words)
    - Context / Insight (70 words)
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
  '11.) Instagram Reel Caption',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Instagram Reel caption for [enter your business name] supporting a short-form video about [enter topic, product, or message]. The caption should reinforce the hook and drive engagement.',
  'The main idea viewers should remember after watching the reel is [enter key takeaway].',
  '[enter your Instagram audience]',
  'Engaging, energetic, on-brand',
  'Short paragraphs, conversational, scroll-friendly',
  'English',
  'medium',
  ARRAY[
    '{"section": "Hook Line", "wordCount": 20, "description": "First line that reinforces the video hook and stops the scroll."}'::jsonb,
    '{"section": "Context / Insight", "wordCount": 70, "description": "Brief explanation or takeaway related to the reel content."}'::jsonb,
    '{"section": "Engagement CTA", "wordCount": 20, "description": "Invite comments, saves, or shares."}'::jsonb,
    '{"section": "Hashtags", "wordCount": 20, "description": "Relevant hashtags to support discovery."}'::jsonb
  ]
);