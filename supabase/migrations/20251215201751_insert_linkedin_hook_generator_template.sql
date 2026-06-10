/*
  # Insert LinkedIn Hook Generator (First 2 Lines) Template

  1. New Template
    - Template Name: "11.) LinkedIn Hook Generator (First 2 Lines)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Generate scroll-stopping LinkedIn hooks
    - keyMessage: Core idea to capture attention
    - targetAudience: "[enter your LinkedIn audience]"
    - tone: "Professional, confident, intriguing"
    - preferred_writing_style: "Short sentences, clear, curiosity-driven"
    
  3. Output Structure
    - 5 different hook variations
    - Bold Insight Hook (20 words)
    - Question Hook (20 words)
    - Problem-Focused Hook (20 words)
    - Contrarian Hook (20 words)
    - Outcome-Oriented Hook (20 words)
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
  '11.) LinkedIn Hook Generator (First 2 Lines)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Generate scroll-stopping LinkedIn hooks for [enter your business name] related to [enter topic or insight]. These hooks are designed to appear in the first 2 lines before ''see more''.',
  'The core idea that should immediately capture attention is [enter main insight or belief].',
  '[enter your LinkedIn audience]',
  'Professional, confident, intriguing',
  'Short sentences, clear, curiosity-driven',
  'English',
  'short',
  ARRAY[
    '{"section": "Bold Insight Hook", "wordCount": 20, "description": "Strong insight or statement that challenges assumptions."}'::jsonb,
    '{"section": "Question Hook", "wordCount": 20, "description": "Question that speaks directly to [target audience]''s problem or curiosity."}'::jsonb,
    '{"section": "Problem-Focused Hook", "wordCount": 20, "description": "Hook highlighting a specific pain or frustration."}'::jsonb,
    '{"section": "Contrarian Hook", "wordCount": 20, "description": "Unexpected or counterintuitive perspective."}'::jsonb,
    '{"section": "Outcome-Oriented Hook", "wordCount": 20, "description": "Hook promising a clear takeaway or result."}'::jsonb
  ]
);