/*
  # Insert TikTok UGC Ad Script Template

  1. New Template
    - Template Name: "11.) TikTok UGC Ad Script"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: TikTok UGC-style ad script where a creator casually talks about their experience
    - keyMessage: The main outcome or result after using the product
    - targetAudience: "[enter your TikTok audience]"
    - tone: "Authentic, casual, relatable"
    - preferred_writing_style: "First-person, spoken language, imperfect, natural"
    
  3. Output Structure
    - 5 structured sections for UGC Ad Script
    - Relatable Hook (12 words)
    - Problem or Frustration (15 words)
    - Product Experience (20 words)
    - Result / Outcome (15 words)
    - Soft CTA (10 words)
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
  '11.) TikTok UGC Ad Script',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'TikTok UGC-style ad script where a creator casually talks about their experience using [enter product / service name] from [enter your business name].',
  'The main outcome or result after using the product is [enter main benefit or transformation].',
  '[enter your TikTok audience]',
  'Authentic, casual, relatable',
  'First-person, spoken language, imperfect, natural',
  'English',
  'short',
  ARRAY[
    '{"section": "Relatable Hook", "wordCount": 12, "description": "Casual opening line that feels natural and relatable."}'::jsonb,
    '{"section": "Problem or Frustration", "wordCount": 15, "description": "Brief mention of the problem before discovering the product."}'::jsonb,
    '{"section": "Product Experience", "wordCount": 20, "description": "How the creator used [product / service] in real life."}'::jsonb,
    '{"section": "Result / Outcome", "wordCount": 15, "description": "Specific result or improvement experienced."}'::jsonb,
    '{"section": "Soft CTA", "wordCount": 10, "description": "Light, non-pushy call to action."}'::jsonb
  ]
);