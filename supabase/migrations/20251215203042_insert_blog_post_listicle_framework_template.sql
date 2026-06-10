/*
  # Insert Blog Post – Listicle / Framework Template

  1. New Template
    - Template Name: "11.) Blog Post – Listicle / Framework"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: List-based or framework-style blog post
    - keyMessage: Present multiple clear, actionable insights
    - targetAudience: "[enter your target audience]"
    - tone: "Clear, practical, confident"
    - preferred_writing_style: "Skimmable, structured, value-focused"
    
  3. Output Structure
    - SEO Title (12 words)
    - Introduction (120 words)
    - Item 1 (160 words)
    - Item 2 (160 words)
    - Item 3 (160 words)
    - Item 4 (160 words)
    - Summary (100 words)
    - CTA (80 words)
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
  '11.) Blog Post – Listicle / Framework',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'List-based or framework-style blog post presenting key ideas, steps, or insights about [enter topic] for [enter target audience].',
  'The purpose of this article is to present multiple clear, actionable insights or elements related to [enter topic].',
  '[enter your target audience]',
  'Clear, practical, confident',
  'Skimmable, structured, value-focused',
  'English',
  'medium',
  ARRAY[
    '{"section": "SEO Title", "wordCount": 12, "description": "Number- or framework-based title optimized for search."}'::jsonb,
    '{"section": "Introduction", "wordCount": 120, "description": "Explain what the list covers and why it matters."}'::jsonb,
    '{"section": "Item 1", "wordCount": 160, "description": "First key insight, step, or framework element."}'::jsonb,
    '{"section": "Item 2", "wordCount": 160, "description": "Second key insight or element."}'::jsonb,
    '{"section": "Item 3", "wordCount": 160, "description": "Third key insight or element."}'::jsonb,
    '{"section": "Item 4", "wordCount": 160, "description": "Fourth key insight or element (optional but recommended)."}'::jsonb,
    '{"section": "Summary", "wordCount": 100, "description": "Recap the main ideas in a concise way."}'::jsonb,
    '{"section": "CTA", "wordCount": 80, "description": "Invite the reader to take the next step."}'::jsonb
  ]
);