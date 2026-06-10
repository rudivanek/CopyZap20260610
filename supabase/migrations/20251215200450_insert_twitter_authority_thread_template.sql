/*
  # Insert Twitter Authority Thread (Educational) Template

  1. New Template
    - Template Name: "11.) Twitter Authority Thread (Educational)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Educational Twitter (X) thread written to teach and position author as authority
    - keyMessage: The core lesson or framework to teach
    - targetAudience: "[enter your target audience on X / Twitter]"
    - tone: "Authoritative, clear, confident"
    - preferred_writing_style: "Concise, educational, high-signal, no fluff"
    
  3. Output Structure
    - 8 structured sections for Educational Authority Thread
    - Tweet 1 – Authority Hook (40 words)
    - Tweet 2 – Context (40 words)
    - Tweet 3 – Core Principle (40 words)
    - Tweet 4 – Breakdown (40 words)
    - Tweet 5 – Breakdown (40 words)
    - Tweet 6 – Practical Application (40 words)
    - Tweet 7 – Common Mistake or Insight (40 words)
    - Tweet 8 – Authority Close / CTA (40 words)
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
  '11.) Twitter Authority Thread (Educational)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Educational Twitter (X) thread written by [enter your role or brand] to teach [enter topic] and position the author as an authority in [enter industry or field].',
  'The core lesson or framework I want to teach is [enter main insight or concept].',
  '[enter your target audience on X / Twitter]',
  'Authoritative, clear, confident',
  'Concise, educational, high-signal, no fluff',
  'English',
  'medium',
  ARRAY[
    '{"section": "Tweet 1 – Authority Hook", "wordCount": 40, "description": "Strong opening that establishes expertise and promises a clear learning outcome."}'::jsonb,
    '{"section": "Tweet 2 – Context", "wordCount": 40, "description": "Explain why this topic matters right now for [target audience]."}'::jsonb,
    '{"section": "Tweet 3 – Core Principle", "wordCount": 40, "description": "Introduce the main concept, framework, or idea."}'::jsonb,
    '{"section": "Tweet 4 – Breakdown", "wordCount": 40, "description": "Explain part of the concept with clarity and example."}'::jsonb,
    '{"section": "Tweet 5 – Breakdown", "wordCount": 40, "description": "Continue the explanation with another angle or step."}'::jsonb,
    '{"section": "Tweet 6 – Practical Application", "wordCount": 40, "description": "Show how the audience can apply this in real life."}'::jsonb,
    '{"section": "Tweet 7 – Common Mistake or Insight", "wordCount": 40, "description": "Highlight a mistake, myth, or advanced insight."}'::jsonb,
    '{"section": "Tweet 8 – Authority Close / CTA", "wordCount": 40, "description": "Wrap up with a takeaway and soft authority CTA (follow, bookmark, reply)."}'::jsonb
  ]
);