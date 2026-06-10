/*
  # Insert LinkedIn Carousel Text (Slide by Slide) Template

  1. New Template
    - Template Name: "11.) LinkedIn Carousel Text (Slide by Slide)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: LinkedIn carousel text for educational content
    - keyMessage: Core insight or framework to communicate
    - targetAudience: "[enter your LinkedIn audience]"
    - tone: "Professional, insightful, authoritative"
    - preferred_writing_style: "Clear, concise, slide-friendly, no fluff"
    
  3. Output Structure
    - 8 structured slides for LinkedIn carousel
    - Slide 1 – Hook (12 words)
    - Slide 2 – Problem or Context (15 words)
    - Slide 3 – Key Insight (15 words)
    - Slide 4 – Breakdown (15 words)
    - Slide 5 – Breakdown (15 words)
    - Slide 6 – Practical Takeaway (15 words)
    - Slide 7 – Optional Insight (15 words)
    - Slide 8 – CTA / Close (12 words)
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
  '11.) LinkedIn Carousel Text (Slide by Slide)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'LinkedIn carousel text written slide by slide for [enter your business name] to educate or share insights about [enter topic]. Designed to increase saves and shares.',
  'The main idea this carousel should communicate is [enter core insight or framework].',
  '[enter your LinkedIn audience]',
  'Professional, insightful, authoritative',
  'Clear, concise, slide-friendly, no fluff',
  'English',
  'medium',
  ARRAY[
    '{"section": "Slide 1 – Hook", "wordCount": 12, "description": "Strong opening slide that promises value or learning."}'::jsonb,
    '{"section": "Slide 2 – Problem or Context", "wordCount": 15, "description": "Why this topic matters to [target audience]."}'::jsonb,
    '{"section": "Slide 3 – Key Insight", "wordCount": 15, "description": "Introduce the core idea or framework."}'::jsonb,
    '{"section": "Slide 4 – Breakdown", "wordCount": 15, "description": "Explain part of the framework or concept."}'::jsonb,
    '{"section": "Slide 5 – Breakdown", "wordCount": 15, "description": "Continue explanation with clarity."}'::jsonb,
    '{"section": "Slide 6 – Practical Takeaway", "wordCount": 15, "description": "Actionable takeaway for [target audience]."}'::jsonb,
    '{"section": "Slide 7 – Optional Insight", "wordCount": 15, "description": "Advanced tip or common mistake (optional)."}'::jsonb,
    '{"section": "Slide 8 – CTA / Close", "wordCount": 12, "description": "Encourage save, share, or follow."}'::jsonb
  ]
);