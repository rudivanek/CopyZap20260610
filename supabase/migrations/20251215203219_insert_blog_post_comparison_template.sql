/*
  # Insert Blog Post – Comparison (X vs Y vs Z) Template

  1. New Template
    - Template Name: "11.) Blog Post – Comparison (X vs Y vs Z)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Comparison blog post evaluating options
    - keyMessage: Objectively compare multiple options
    - targetAudience: "[enter your target audience]"
    - tone: "Objective, analytical, trustworthy"
    - preferred_writing_style: "Clear, structured, decision-oriented"
    
  3. Output Structure
    - SEO Title (14 words)
    - Introduction (120 words)
    - Option A – Overview (200 words)
    - Option B – Overview (200 words)
    - Option C – Overview (200 words)
    - Side-by-Side Comparison (150 words)
    - Who Should Choose What (150 words)
    - Conclusion + CTA (80 words)
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
  '11.) Blog Post – Comparison (X vs Y vs Z)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Comparison blog post evaluating [enter option A] vs [enter option B] vs [enter option C] to help [enter target audience] make an informed decision.',
  'The goal of this article is to objectively compare multiple options and clearly explain who each one is best suited for.',
  '[enter your target audience]',
  'Objective, analytical, trustworthy',
  'Clear, structured, decision-oriented',
  'English',
  'medium',
  ARRAY[
    '{"section": "SEO Title", "wordCount": 14, "description": "Comparison-focused title targeting buyer-intent keywords."}'::jsonb,
    '{"section": "Introduction", "wordCount": 120, "description": "Explain who this comparison is for and what will be covered."}'::jsonb,
    '{"section": "Option A – Overview", "wordCount": 200, "description": "Describe option A, including strengths and limitations."}'::jsonb,
    '{"section": "Option B – Overview", "wordCount": 200, "description": "Describe option B, including strengths and limitations."}'::jsonb,
    '{"section": "Option C – Overview", "wordCount": 200, "description": "Describe option C, including strengths and limitations."}'::jsonb,
    '{"section": "Side-by-Side Comparison", "wordCount": 150, "description": "Compare key differences, trade-offs, and use cases."}'::jsonb,
    '{"section": "Who Should Choose What", "wordCount": 150, "description": "Clear recommendations for different reader scenarios."}'::jsonb,
    '{"section": "Conclusion + CTA", "wordCount": 80, "description": "Summarize and invite the next step."}'::jsonb
  ]
);