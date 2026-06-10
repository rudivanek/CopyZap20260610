/*
  # Insert Welcome Email Template

  1. New Template
    - Template Name: "11.) Welcome Email"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Welcome email sent to new subscribers or customers
    - keyMessage: The key message to communicate
    - targetAudience: "[enter your new subscribers or customers]"
    - tone: "Warm, friendly, reassuring"
    - preferred_writing_style: "Conversational, clear, supportive"
    
  3. Output Structure
    - 5 structured sections for welcome email
    - Subject Line (10 words)
    - Warm Welcome (60 words)
    - What to Expect (120 words)
    - First Step (80 words)
    - Friendly CTA (30 words)
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
  '11.) Welcome Email',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Welcome email sent from [enter your business name] to new subscribers or customers after they sign up for [enter product / service]. The goal is to set expectations and build trust.',
  'The key message to communicate is [enter what the user should know or do first].',
  '[enter your new subscribers or customers]',
  'Warm, friendly, reassuring',
  'Conversational, clear, supportive',
  'English',
  'custom',
  ARRAY[
    '{"section": "Subject Line", "wordCount": 10, "description": "Friendly subject line welcoming the reader."}'::jsonb,
    '{"section": "Warm Welcome", "wordCount": 60, "description": "Thank the reader for joining and acknowledge their action."}'::jsonb,
    '{"section": "What to Expect", "wordCount": 120, "description": "Explain what they will receive or experience next."}'::jsonb,
    '{"section": "First Step", "wordCount": 80, "description": "Guide the reader to the first recommended action."}'::jsonb,
    '{"section": "Friendly CTA", "wordCount": 30, "description": "Encourage engagement without pressure."}'::jsonb
  ]
);