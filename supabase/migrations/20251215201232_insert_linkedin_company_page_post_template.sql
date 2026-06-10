/*
  # Insert LinkedIn Company Page Post Template

  1. New Template
    - Template Name: "11.) LinkedIn Company Page Post"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: LinkedIn company page post for business updates
    - keyMessage: Main company message or announcement
    - targetAudience: "[enter your target audience on LinkedIn]"
    - tone: "Professional, confident, brand-aligned"
    - preferred_writing_style: "Clear, concise, business-focused, approachable"
    
  3. Output Structure
    - 4 structured sections for company page posts
    - Hook (30 words)
    - Main Message (140 words)
    - Value or Context (60 words)
    - Engagement CTA (30 words)
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
  '11.) LinkedIn Company Page Post',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'LinkedIn company page post published by [enter your business name] to share updates, insights, or announcements related to [enter topic, product, or initiative].',
  'The main message the company wants to communicate is [enter key update, insight, or announcement].',
  '[enter your target audience on LinkedIn]',
  'Professional, confident, brand-aligned',
  'Clear, concise, business-focused, approachable',
  'English',
  'medium',
  ARRAY[
    '{"section": "Hook", "wordCount": 30, "description": "Opening lines that grab attention and set context."}'::jsonb,
    '{"section": "Main Message", "wordCount": 140, "description": "Core update, insight, or announcement from the company."}'::jsonb,
    '{"section": "Value or Context", "wordCount": 60, "description": "Why this matters to [target audience]."}'::jsonb,
    '{"section": "Engagement CTA", "wordCount": 30, "description": "Invite interaction or next step."}'::jsonb
  ]
);