/*
  # Insert Website Copy Audit Template

  1. Purpose
    - Audits website copy to identify clarity, conversion, and messaging issues
    - Provides concrete improvement recommendations
    - Evaluates structure, flow, and audience fit
    - Focuses on diagnosis rather than full rewrite

  2. Template Configuration
    - Template Name: "11.) Website Copy Audit"
    - Type: improve
    - Public: true (accessible to all users)
    - Create Variants: false (single audit output)

  3. Template Logic
    - Evaluates clarity and message comprehension
    - Assesses value proposition strength
    - Identifies conversion blockers
    - Reviews structure and flow
    - Highlights missing or weak elements
    - Considers audience fit and intent
    - Provides actionable recommendations

  4. Input Fields
    - business_description: Business context
    - product_service_name: Product or service on the website
    - project_description: Purpose of the audit
    - original_copy: Website copy to audit
    - target_audience: Primary website audience
    - tone: "Objective, expert, constructive"
    - preferred_writing_style: "Analytical, clear, actionable"

  5. Output Structure
    - 6 structured sections:
      1. Overall Assessment (120 words) - High-level evaluation
      2. Strengths (120 words) - What works well
      3. Key Issues Identified (160 words) - Main problems
      4. Conversion & Messaging Gaps (160 words) - Specific gaps
      5. Structure & Flow Review (120 words) - Content hierarchy assessment
      6. Priority Recommendations (160 words) - Actionable steps
    - Total word count: ~840 words

  6. Audit Approach
    - Focus on diagnosis and recommendations
    - Avoid rewriting the full page
    - Provide specific, actionable advice
    - Do NOT be generic or vague
    - Include examples where relevant
    - Prioritize recommendations by impact

  7. Security
    - Public template accessible to all authenticated users
    - No special permissions required
*/

INSERT INTO public.pmc_templates (
  id,
  user_id,
  template_name,
  template_type,
  category,
  tone,
  language,
  word_count,
  preferred_writing_style,
  special_instructions,
  business_description,
  product_service_name,
  project_description,
  target_audience,
  original_copy,
  output_structure,
  include_section_titles,
  is_public,
  public_name,
  public_description,
  create_variants,
  created_at
) VALUES (
  gen_random_uuid(),
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) Website Copy Audit',
  'improve',
  'Website Copy',
  'Objective, expert, constructive',
  'English',
  'long',
  'Analytical, clear, actionable',
  'Audit the website copy to identify clarity, conversion, messaging, and structure issues, and provide concrete improvement recommendations.

The audit must:

- Evaluate clarity and message comprehension
- Assess value proposition strength
- Identify conversion blockers
- Review structure and flow
- Highlight missing or weak elements
- Consider audience fit and intent
- Avoid rewriting the full page
- Focus on diagnosis and recommendations

Do NOT:
- Produce full rewritten copy
- Be generic or high-level only
- Use vague advice without examples

Provide specific, actionable recommendations that the user can implement immediately. Prioritize issues by impact on conversion and user experience.',
  '[enter your business description]',
  '[enter product / service name]',
  'Audit the website copy to identify clarity, conversion, messaging, and structure issues, and provide concrete improvement recommendations.',
  '[enter the primary audience of the website]',
  '[paste website copy, page sections, or full page text here]',
  ARRAY[
    jsonb_build_object(
      'section', 'Overall Assessment',
      'wordCount', 120,
      'description', 'High-level evaluation of the website copy effectiveness.'
    ),
    jsonb_build_object(
      'section', 'Strengths',
      'wordCount', 120,
      'description', 'What the current copy does well.'
    ),
    jsonb_build_object(
      'section', 'Key Issues Identified',
      'wordCount', 160,
      'description', 'Main problems affecting clarity, conversion, or trust.'
    ),
    jsonb_build_object(
      'section', 'Conversion & Messaging Gaps',
      'wordCount', 160,
      'description', 'Specific gaps in value proposition, CTAs, or audience targeting.'
    ),
    jsonb_build_object(
      'section', 'Structure & Flow Review',
      'wordCount', 120,
      'description', 'Assessment of content hierarchy and logical flow.'
    ),
    jsonb_build_object(
      'section', 'Priority Recommendations',
      'wordCount', 160,
      'description', 'Actionable steps to improve the copy, ordered by impact.'
    )
  ]::jsonb[],
  true,
  true,
  'Website Copy Audit',
  'Comprehensive audit of website copy to identify clarity, conversion, and messaging issues with actionable recommendations.',
  false,
  now()
);