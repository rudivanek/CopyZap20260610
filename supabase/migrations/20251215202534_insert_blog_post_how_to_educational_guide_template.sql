/*
  # Insert Blog Post – How-To / Educational Guide Template

  1. New Template
    - Template Name: "11.) Blog Post – How-To / Educational Guide"
    - Template Type: create
    - Is Public: false
    
  2. Fields
    - businessDescription: "[enter your business description]"
    - productServiceName: "[enter product / service name]"
    - projectDescription: Educational blog post explaining how to [topic]
    - keyMessage: Goal to help readers understand and apply [core topic]
    - targetAudience: "[enter your target audience]"
    - tone: "Helpful, clear, authoritative"
    - preferred_writing_style: "Educational, structured, SEO-friendly"
    
  3. Output Structure
    - SEO Title (12 words)
    - Meta Description (22 words)
    - Introduction (120 words)
    - Why This Matters (120 words)
    - Step 1 (180 words)
    - Step 2 (180 words)
    - Step 3 (180 words)
    - Common Mistakes (120 words)
    - Conclusion + CTA (100 words)
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
  '11.) Blog Post – How-To / Educational Guide',
  'create',
  false,
  '[enter your business description]',
  '[enter product / service name]',
  'Educational blog post explaining how to [enter topic] for [enter target audience] in a clear, step-by-step way.',
  'The goal of this article is to help readers understand and successfully apply [enter core topic or skill].',
  '[enter your target audience]',
  'Helpful, clear, authoritative',
  'Educational, structured, SEO-friendly',
  'English',
  'medium',
  ARRAY[
    '{"section": "SEO Title", "wordCount": 12, "description": "Clear, keyword-focused title."}'::jsonb,
    '{"section": "Meta Description", "wordCount": 22, "description": "Concise SEO meta description summarizing the article."}'::jsonb,
    '{"section": "Introduction", "wordCount": 120, "description": "Introduce the problem, context, and what the reader will learn."}'::jsonb,
    '{"section": "Why This Matters", "wordCount": 120, "description": "Explain why this topic is important for the reader."}'::jsonb,
    '{"section": "Step 1", "wordCount": 180, "description": "First actionable step explained clearly."}'::jsonb,
    '{"section": "Step 2", "wordCount": 180, "description": "Second actionable step with guidance."}'::jsonb,
    '{"section": "Step 3", "wordCount": 180, "description": "Third actionable step completing the process."}'::jsonb,
    '{"section": "Common Mistakes", "wordCount": 120, "description": "Typical mistakes or pitfalls to avoid."}'::jsonb,
    '{"section": "Conclusion + CTA", "wordCount": 100, "description": "Summarize key takeaways and invite the next step."}'::jsonb
  ]
);