/*
  # Insert CTA Generator Template

  1. New Template
    - Template Name: "11.) CTA Generator"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Generate high-performing calls to action
    - keyMessage: The action I want the user to take
    - targetAudience: "[enter your target audience]"
    - tone: "Clear, motivating, confident"
    - preferred_writing_style: "Short, action-oriented, benefit-driven"
    
  3. Output Structure
    - 5 structured sections for different CTA types
    - Direct Action CTA (5 words)
    - Benefit-Oriented CTA (6 words)
    - Low-Friction CTA (6 words)
    - Urgency-Based CTA (6 words)
    - Curiosity-Based CTA (6 words)
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
  '11.) CTA Generator',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Generate high-performing calls to action for [enter your business name] related to [enter product / service or offer]. These CTAs will be used across websites, ads, emails, and social media.',
  'The action I want the user to take is [enter desired action].',
  '[enter your target audience]',
  'Clear, motivating, confident',
  'Short, action-oriented, benefit-driven',
  'English',
  'custom',
  ARRAY[
    '{"section": "Direct Action CTA", "wordCount": 5, "description": "Clear and explicit action (e.g., Start, Get, Book, Download)."}'::jsonb,
    '{"section": "Benefit-Oriented CTA", "wordCount": 6, "description": "CTA highlighting the main benefit or outcome."}'::jsonb,
    '{"section": "Low-Friction CTA", "wordCount": 6, "description": "Soft CTA that reduces commitment or risk."}'::jsonb,
    '{"section": "Urgency-Based CTA", "wordCount": 6, "description": "CTA creating urgency or scarcity."}'::jsonb,
    '{"section": "Curiosity-Based CTA", "wordCount": 6, "description": "CTA designed to spark interest without clickbait."}'::jsonb
  ]
);