/*
  # Insert Hook Generator Template

  1. New Template
    - Template Name: "11.) Hook Generator"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Generate high-impact hooks
    - keyMessage: Core idea to hook attention
    - targetAudience: "[enter your target audience]"
    - tone: "Bold, clear, attention-grabbing"
    - preferred_writing_style: "Short, punchy, conversational, high-contrast"
    
  3. Output Structure
    - 5 structured sections for different hook types
    - Bold Statement Hook (12 words)
    - Question Hook (12 words)
    - Problem-Focused Hook (14 words)
    - Contrarian / Insight Hook (14 words)
    - Outcome-Oriented Hook (14 words)
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
  '11.) Hook Generator',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Generate high-impact hooks for [enter your business name] related to [enter topic, product, or message]. Hooks should stop the scroll and invite the audience to keep reading or watching.',
  'The core idea or message to hook attention is [enter your main idea].',
  '[enter your target audience]',
  'Bold, clear, attention-grabbing',
  'Short, punchy, conversational, high-contrast',
  'English',
  'custom',
  ARRAY[
    '{"section": "Bold Statement Hook", "wordCount": 12, "description": "Strong declarative statement that challenges assumptions or states a clear belief."}'::jsonb,
    '{"section": "Question Hook", "wordCount": 12, "description": "Direct question that speaks to a pain, desire, or curiosity of [target audience]."}'::jsonb,
    '{"section": "Problem-Focused Hook", "wordCount": 14, "description": "Hook that highlights a common problem or frustration."}'::jsonb,
    '{"section": "Contrarian / Insight Hook", "wordCount": 14, "description": "Unexpected insight or contrarian perspective."}'::jsonb,
    '{"section": "Outcome-Oriented Hook", "wordCount": 14, "description": "Hook that promises a clear outcome or result."}'::jsonb
  ]
);