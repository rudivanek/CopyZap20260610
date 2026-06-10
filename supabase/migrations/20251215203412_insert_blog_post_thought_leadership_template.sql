/*
  # Insert Blog Post – Thought Leadership / Opinion Template

  1. New Template
    - Template Name: "11.) Blog Post – Thought Leadership / Opinion"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Thought leadership blog post with strong opinion
    - keyMessage: Core opinion or insight to argue
    - targetAudience: "[enter your target audience]"
    - tone: "Confident, insightful, provocative but professional"
    - preferred_writing_style: "Opinion-led, persuasive, clear, no fluff"
    
  3. Output Structure
    - Hook Title (12 words)
    - Opening Hook (140 words)
    - Common Belief (140 words)
    - Why This Is Wrong (200 words)
    - New Perspective (200 words)
    - Implications (150 words)
    - Discussion CTA (80 words)
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
  '11.) Blog Post – Thought Leadership / Opinion',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Thought leadership blog post presenting a strong opinion or unique perspective on [enter topic] to position [enter brand or author] as an authority.',
  'The core opinion or insight I want to argue is [enter contrarian belief or strong viewpoint].',
  '[enter your target audience]',
  'Confident, insightful, provocative but professional',
  'Opinion-led, persuasive, clear, no fluff',
  'English',
  'medium',
  ARRAY[
    '{"section": "Hook Title", "wordCount": 12, "description": "Bold, opinionated title that sparks curiosity."}'::jsonb,
    '{"section": "Opening Hook", "wordCount": 140, "description": "Strong opening that states the opinion or frames the debate."}'::jsonb,
    '{"section": "Common Belief", "wordCount": 140, "description": "Explain the widely accepted belief or norm."}'::jsonb,
    '{"section": "Why This Is Wrong", "wordCount": 200, "description": "Challenge the common belief with clear reasoning."}'::jsonb,
    '{"section": "New Perspective", "wordCount": 200, "description": "Present the author''s alternative viewpoint or insight."}'::jsonb,
    '{"section": "Implications", "wordCount": 150, "description": "Explain what this new perspective means in practice."}'::jsonb,
    '{"section": "Discussion CTA", "wordCount": 80, "description": "Invite readers to reflect, comment, or discuss."}'::jsonb
  ]
);