/*
  # Insert Blog Post – Case Study / Real-World Breakdown Template

  1. New Template
    - Template Name: "11.) Blog Post – Case Study / Real-World Breakdown"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Case study blog post with real-world outcomes
    - keyMessage: Main lesson or result from case study
    - targetAudience: "[enter your target audience]"
    - tone: "Professional, credible, results-focused"
    - preferred_writing_style: "Clear, factual, story-driven"
    
  3. Output Structure
    - Case Study Title (14 words)
    - Client / Context (120 words)
    - Problem (150 words)
    - Approach (200 words)
    - Results (150 words)
    - Key Lessons (120 words)
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
  '11.) Blog Post – Case Study / Real-World Breakdown',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Case study blog post describing how [enter client, project, or scenario] achieved [enter outcome] using [enter product, service, or approach].',
  'The main lesson or result demonstrated by this case study is [enter key outcome or insight].',
  '[enter your target audience]',
  'Professional, credible, results-focused',
  'Clear, factual, story-driven',
  'English',
  'medium',
  ARRAY[
    '{"section": "Case Study Title", "wordCount": 14, "description": "Outcome-driven title highlighting results."}'::jsonb,
    '{"section": "Client / Context", "wordCount": 120, "description": "Who the client is and relevant background."}'::jsonb,
    '{"section": "Problem", "wordCount": 150, "description": "Challenges or situation before the solution."}'::jsonb,
    '{"section": "Approach", "wordCount": 200, "description": "What was done and how the solution was applied."}'::jsonb,
    '{"section": "Results", "wordCount": 150, "description": "Outcomes, improvements, or metrics achieved."}'::jsonb,
    '{"section": "Key Lessons", "wordCount": 120, "description": "Insights or takeaways others can learn from."}'::jsonb,
    '{"section": "CTA", "wordCount": 80, "description": "Invite readers to take the next step."}'::jsonb
  ]
);