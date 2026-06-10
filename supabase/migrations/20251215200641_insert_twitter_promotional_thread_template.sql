/*
  # Insert Twitter Promotional Thread Template

  1. New Template
    - Template Name: "11.) Twitter Promotional Thread"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Promotional Twitter (X) thread to introduce or promote product/service
    - keyMessage: The main offer or value to promote
    - targetAudience: "[enter your target audience on X / Twitter]"
    - tone: "Confident, helpful, non-pushy"
    - preferred_writing_style: "Concise, benefit-driven, conversational"
    
  3. Output Structure
    - 7 structured sections for Promotional Thread
    - Tweet 1 – Hook (40 words)
    - Tweet 2 – Problem or Context (40 words)
    - Tweet 3 – Insight or Value (40 words)
    - Tweet 4 – Solution Introduction (40 words)
    - Tweet 5 – Benefits (40 words)
    - Tweet 6 – Proof or Credibility (40 words)
    - Tweet 7 – CTA (40 words)
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
  '11.) Twitter Promotional Thread',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Promotional Twitter (X) thread written by [enter your role or brand] to introduce or promote [enter product / service name] to [enter target audience] in a value-first way.',
  'The main offer or value to promote is [enter main benefit, result, or offer].',
  '[enter your target audience on X / Twitter]',
  'Confident, helpful, non-pushy',
  'Concise, benefit-driven, conversational',
  'English',
  'medium',
  ARRAY[
    '{"section": "Tweet 1 – Hook", "wordCount": 40, "description": "Attention-grabbing opening related to a problem, desire, or opportunity."}'::jsonb,
    '{"section": "Tweet 2 – Problem or Context", "wordCount": 40, "description": "Describe the problem or situation faced by [target audience]."}'::jsonb,
    '{"section": "Tweet 3 – Insight or Value", "wordCount": 40, "description": "Share a useful insight or lesson related to the problem."}'::jsonb,
    '{"section": "Tweet 4 – Solution Introduction", "wordCount": 40, "description": "Introduce [product / service name] naturally as a solution."}'::jsonb,
    '{"section": "Tweet 5 – Benefits", "wordCount": 40, "description": "Highlight key benefits or outcomes."}'::jsonb,
    '{"section": "Tweet 6 – Proof or Credibility", "wordCount": 40, "description": "Mention proof, results, use case, or credibility signal."}'::jsonb,
    '{"section": "Tweet 7 – CTA", "wordCount": 40, "description": "Soft CTA inviting action (check link, reply, DM, learn more)."}'::jsonb
  ]
);