/*
  # Insert Homepage Critique Template

  1. Purpose
    - Critically evaluates homepage copy for clarity, positioning, and conversion effectiveness
    - Assesses first-impression impact and value proposition strength
    - Analyzes message hierarchy, scannability, and audience alignment
    - Identifies conversion blockers and credibility gaps
    - Provides actionable improvement guidance

  2. Template Configuration
    - Template Name: "11.) Homepage Critique"
    - Type: improve
    - Public: true (accessible to all users)
    - Create Variants: false (single critique output)

  3. Template Logic
    - Evaluates first-impression clarity (above the fold)
    - Assesses value proposition strength and differentiation
    - Analyzes message hierarchy and scannability
    - Identifies conversion blockers and friction points
    - Reviews audience alignment and intent matching
    - Highlights trust signals and credibility gaps
    - Focuses on diagnosis rather than full rewrite

  4. Input Fields
    - business_description: Business context
    - product_service_name: Product or service featured on homepage
    - project_description: Purpose of the critique
    - original_copy: Homepage copy to critique
    - target_audience: Primary homepage audience
    - tone: "Objective, expert, constructive"
    - preferred_writing_style: "Analytical, clear, actionable"

  5. Output Structure
    - 6 structured sections:
      1. First Impression & Clarity (120 words) - What visitors understand immediately
      2. Value Proposition Evaluation (140 words) - Main promise and differentiation
      3. Message Hierarchy & Flow (120 words) - Structure and scannability
      4. Conversion & CTA Effectiveness (140 words) - Call to action analysis
      5. Trust & Credibility Signals (120 words) - Proof elements and validation
      6. Priority Recommendations (160 words) - High-impact improvements
    - Total word count: ~800 words

  6. Critique Approach
    - Focus on diagnosis and improvement guidance
    - Avoid rewriting the entire homepage
    - Provide specific, actionable advice with reasoning
    - Do NOT be generic or surface-level
    - Explain why recommendations matter
    - Prioritize improvements by impact

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
  '11.) Homepage Critique',
  'improve',
  'Website Copy',
  'Objective, expert, constructive',
  'English',
  'long',
  'Analytical, clear, actionable',
  'Critically evaluate the homepage copy to assess clarity, positioning, conversion effectiveness, and first-impression impact.

The critique must:

- Evaluate first-impression clarity (above the fold)
- Assess the strength of the value proposition
- Analyze message hierarchy and scannability
- Identify conversion blockers and friction points
- Review audience alignment and intent matching
- Highlight trust signals and credibility gaps
- Avoid rewriting the entire homepage
- Focus on diagnosis and improvement guidance

Do NOT:
- Produce full rewritten copy
- Be generic or surface-level
- Give advice without explaining why it matters

Provide specific, actionable recommendations with clear reasoning. Explain the impact of each issue on conversion and user experience. Prioritize improvements by potential impact on homepage effectiveness.',
  '[enter your business description]',
  '[enter product / service name]',
  'Critically evaluate the homepage copy to assess clarity, positioning, conversion effectiveness, and first-impression impact.',
  '[enter the primary audience of the homepage]',
  '[paste homepage copy or key homepage sections here]',
  ARRAY[
    jsonb_build_object(
      'section', 'First Impression & Clarity',
      'wordCount', 120,
      'description', 'Assessment of what visitors understand within the first few seconds.'
    ),
    jsonb_build_object(
      'section', 'Value Proposition Evaluation',
      'wordCount', 140,
      'description', 'Critique of the main promise, differentiation, and relevance.'
    ),
    jsonb_build_object(
      'section', 'Message Hierarchy & Flow',
      'wordCount', 120,
      'description', 'Review of content structure, sequencing, and scannability.'
    ),
    jsonb_build_object(
      'section', 'Conversion & CTA Effectiveness',
      'wordCount', 140,
      'description', 'Analysis of calls to action and conversion friction.'
    ),
    jsonb_build_object(
      'section', 'Trust & Credibility Signals',
      'wordCount', 120,
      'description', 'Evaluation of proof elements, social validation, and authority cues.'
    ),
    jsonb_build_object(
      'section', 'Priority Recommendations',
      'wordCount', 160,
      'description', 'Concrete, high-impact improvements ranked by importance.'
    )
  ]::jsonb[],
  true,
  true,
  'Homepage Critique',
  'Expert critique of homepage copy evaluating clarity, positioning, conversion effectiveness, and first-impression impact with actionable recommendations.',
  false,
  now()
);