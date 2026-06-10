/*
  # Insert Bio Generator (Founder / Brand) Template

  1. New Template
    - Template Name: "11.) Bio Generator (Founder / Brand)"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Generate a professional bio for founder or brand
    - keyMessage: The main positioning or identity to communicate
    - targetAudience: "[enter who will read this bio]"
    - tone: "Professional, authentic, confident"
    - preferred_writing_style: "Clear, human, concise, personable"
    
  3. Output Structure
    - 3 structured sections for different bio lengths
    - Short Bio (40 words) - social profiles
    - Medium Bio (100 words) - about pages
    - Long Bio (180 words) - press kits, speaker pages
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
  '11.) Bio Generator (Founder / Brand)',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Generate a professional bio for [enter founder name or brand name] associated with [enter your business name]. The bio should communicate credibility, clarity, and personality.',
  'The main positioning or identity to communicate is [enter how you want to be known].',
  '[enter who will read this bio]',
  'Professional, authentic, confident',
  'Clear, human, concise, personable',
  'English',
  'custom',
  ARRAY[
    '{"section": "Short Bio", "wordCount": 40, "description": "Concise bio suitable for social profiles."}'::jsonb,
    '{"section": "Medium Bio", "wordCount": 100, "description": "Balanced bio for websites or company pages."}'::jsonb,
    '{"section": "Long Bio", "wordCount": 180, "description": "Detailed bio for press kits or speaker introductions."}'::jsonb
  ]
);