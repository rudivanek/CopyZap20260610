/*
  # Insert USP – Unique Selling Proposition Writer (5 Variants) Template

  1. New Template
    - Template Name: "11.) USP – Unique Selling Proposition Writer (5 Variants)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Generate five clearly different USP options
    - keyMessage: Potential differentiators
    - targetAudience: "[enter your ideal customer or buyer persona]"
    - tone: "Clear, confident, strategic"
    - preferred_writing_style: "Direct, differentiation-focused, no fluff"
    
  3. Output Structure
    - 5 distinct USP positioning options
    - USP Option 1 – Primary Differentiator (40 words)
    - USP Option 2 – Alternative Angle (40 words)
    - USP Option 3 – Customer Outcome Focus (40 words)
    - USP Option 4 – Process or Method (40 words)
    - USP Option 5 – Constraint or Trade-off (40 words)
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
  '11.) USP – Unique Selling Proposition Writer (5 Variants)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Generate five clearly different Unique Selling Proposition (USP) options for [enter your business name] and its offering [enter product / service name]. Each USP should represent a different positioning angle.',
  'Our potential differentiators include [enter strengths, advantages, or constraints].',
  '[enter your ideal customer or buyer persona]',
  'Clear, confident, strategic',
  'Direct, differentiation-focused, no fluff',
  'English',
  'short',
  ARRAY[
    '{"section": "USP Option 1 – Primary Differentiator", "wordCount": 40, "description": "USP based on the strongest or most obvious differentiator."}'::jsonb,
    '{"section": "USP Option 2 – Alternative Angle", "wordCount": 40, "description": "USP based on a secondary but still defensible differentiator."}'::jsonb,
    '{"section": "USP Option 3 – Customer Outcome Focus", "wordCount": 40, "description": "USP focused primarily on a specific customer result or transformation."}'::jsonb,
    '{"section": "USP Option 4 – Process or Method", "wordCount": 40, "description": "USP based on how the solution is delivered differently from competitors."}'::jsonb,
    '{"section": "USP Option 5 – Constraint or Trade-off", "wordCount": 40, "description": "USP based on a deliberate limitation, niche, or trade-off that strengthens positioning."}'::jsonb
  ]
);