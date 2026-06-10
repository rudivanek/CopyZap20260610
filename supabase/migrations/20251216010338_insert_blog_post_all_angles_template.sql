/*
  # Insert Blog Post – All Angles Template

  1. New Template
    - Template Name: "12.) Blog Post – All Angles (5 Strategies)"
    - Template Type: create
    - Is Public: false
    - Category: Blog / Content Marketing
    
  2. Description
    - Generate 1-5 complete blog posts from ONE topic using different strategic angles
    - User selects which angles to generate (How-To, Listicle, Comparison, Thought Leadership, Case Study)
    - All generated in one click
    
  3. Fields
    - blogTopic: The main topic to explore from multiple angles
    - businessDescription: Your business context (used across all angles)
    - productServiceName: Your product/service (used across all angles)
    - targetAudience: Target readers (used across all angles)
    - competitors: Optional - for comparison angle
    - realWorldScenario: Optional - for case study angle
    - selectedBlogAngles: Defaults to all 5 angles [0,1,2,3,4]
    
  4. Special Instructions
    - Explains the 5 different angles and how they work together
*/

INSERT INTO pmc_templates (
  user_id,
  template_name,
  template_type,
  is_public,
  category,
  description,
  language,
  word_count,
  custom_word_count,
  tone,
  preferred_writing_style,
  business_description,
  product_service_name,
  target_audience,
  project_description,
  key_message,
  special_instructions,
  selected_blog_angles,
  form_state_snapshot
)
VALUES (
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '12.) Blog Post – All Angles (5 Strategies)',
  'create',
  false,
  'Blog / Content Marketing',
  'Generate 1-5 complete blog posts from a single topic using different strategic angles. Select which approaches to use: How-To Guide, Framework/Listicle, Comparison, Thought Leadership, or Case Study.',
  'English',
  'Custom',
  1200,
  'Professional',
  'Educational, strategic, SEO-optimized',
  '[enter your business description - used across all angles]',
  '[enter product / service name]',
  '[enter your target audience]',
  'All Angles Blog Strategy: Multiple blog posts from one topic',
  'Each blog post tackles the same topic from a different strategic angle, providing diverse content for different audience segments and marketing channels.',
  'All Angles Blog Strategy Mode:

Generate 1-5 complete blog posts from ONE core topic. Each blog uses a different strategic framework:

1. HOW-TO GUIDE: Step-by-step educational breakdown
2. FRAMEWORK/LISTICLE: Key principles, tips, or components
3. COMPARISON: Different approaches, tools, or methods
4. THOUGHT LEADERSHIP: Expert opinion or contrarian insight  
5. CASE STUDY: Real-world scenario and results

Select which angles you want to generate below. Each will be a complete, standalone blog post optimized for its specific strategic approach.',
  ARRAY[0, 1, 2, 3, 4],
  jsonb_build_object(
    'generationMode', 'all-angles-blog',
    'blogTopic', '[enter your blog topic]',
    'competitors', '[optional: enter competitors for comparison angle]',
    'realWorldScenario', '[optional: describe scenario for case study angle]',
    'selectedBlogAngles', ARRAY[0, 1, 2, 3, 4]
  )
);