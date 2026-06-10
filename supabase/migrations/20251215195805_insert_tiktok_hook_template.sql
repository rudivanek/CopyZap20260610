/*
  # Insert TikTok Hook Template

  1. New Template
    - Template Name: "11.) TikTok Hook (First 2–3 Seconds)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: TikTok hook designed to stop the scroll in the first 2–3 seconds
    - keyMessage: The core idea that must immediately capture attention
    - targetAudience: "[enter your TikTok audience]"
    - tone: "Bold, curious, energetic"
    - preferred_writing_style: "Ultra-short, conversational, spoken language"
    
  3. Output Structure
    - 5 structured sections for TikTok Hook variations
    - Bold Statement Hook (8 words)
    - Question Hook (8 words)
    - Problem Hook (9 words)
    - Curiosity Hook (9 words)
    - Outcome Hook (9 words)
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
  '11.) TikTok Hook (First 2–3 Seconds)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'TikTok hook designed to stop the scroll in the first 2–3 seconds for [enter your business name] related to [enter topic, product, or message]. The hook should be spoken or shown as on-screen text.',
  'The core idea that must immediately capture attention is [enter your main idea].',
  '[enter your TikTok audience]',
  'Bold, curious, energetic',
  'Ultra-short, conversational, spoken language',
  'English',
  'short',
  ARRAY[
    '{"section": "Bold Statement Hook", "wordCount": 8, "description": "Strong declarative hook that challenges a belief or states a bold claim."}'::jsonb,
    '{"section": "Question Hook", "wordCount": 8, "description": "Direct question that immediately pulls in [target audience]."}'::jsonb,
    '{"section": "Problem Hook", "wordCount": 9, "description": "Call out a specific pain or frustration."}'::jsonb,
    '{"section": "Curiosity Hook", "wordCount": 9, "description": "Open loop that makes viewers want to keep watching."}'::jsonb,
    '{"section": "Outcome Hook", "wordCount": 9, "description": "Promise a clear outcome or result."}'::jsonb
  ]
);