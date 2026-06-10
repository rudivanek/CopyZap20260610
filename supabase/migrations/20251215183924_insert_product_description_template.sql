/*
  # Insert Product Description Template

  1. New Template
    - Template Name: "11.) Product Description"
    - Template Type: "create"
    - Purpose: Generate comprehensive product descriptions with structured sections
    - Target: E-commerce and product marketing teams
  
  2. Template Fields
    - Business description with placeholder
    - Product/service name with placeholder
    - Project description explaining the goal
    - Key message highlighting primary benefit
    - Target audience definition
    - Professional, clear tone
    - Benefit-driven writing style
  
  3. Output Structure
    - Short Description (50 words): Concise product summary
    - Key Benefits (100 words): Main benefits for target audience
    - Features (80 words): Key product capabilities
    - Why It's Different (60 words): Unique value proposition
    - CTA (20 words): Next step encouragement
  
  4. Settings
    - is_public: false (non-system template)
    - Language: English
    - Word count: medium (default)
    - Custom word count logic: Short (80-120), Medium (150-250), Long (300-450)
*/

INSERT INTO pmc_templates (
  user_id,
  template_name,
  template_type,
  language,
  word_count,
  business_description,
  product_service_name,
  project_description,
  key_message,
  target_audience,
  tone,
  preferred_writing_style,
  output_structure,
  is_public
) VALUES (
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) Product Description',
  'create',
  'English',
  'medium',
  '[enter your business description]',
  '[enter product / service name]',
  'Product description for [enter product / service name] offered by [enter your business name]. The goal is to clearly explain what it is, who it''s for, and why it''s valuable.',
  'The main benefit this product delivers is [enter primary benefit or outcome].',
  '[enter ideal customer or buyer persona]',
  'Clear, trustworthy, persuasive',
  'Benefit-driven, scannable, customer-focused',
  ARRAY[
    '{"section": "Short Description", "wordCount": 50, "description": "Concise summary explaining what the product is and who it''s for."}'::jsonb,
    '{"section": "Key Benefits", "wordCount": 100, "description": "List and explain the main benefits for [target audience]."}'::jsonb,
    '{"section": "Features", "wordCount": 80, "description": "Describe key features and capabilities of the product."}'::jsonb,
    '{"section": "Why It''s Different", "wordCount": 60, "description": "Explain what makes this product stand out from alternatives."}'::jsonb,
    '{"section": "CTA", "wordCount": 20, "description": "Encourage the user to take the next step (buy, learn more, sign up)."}'::jsonb
  ],
  false
);