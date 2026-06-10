/*
  # Insert Website Copy Audit Template

  1. Purpose
    - Comprehensive audit of website copy for conversion effectiveness
    - Identifies strengths, issues, and optimization opportunities
    - Analyzes clarity, positioning, and messaging gaps
    - Provides actionable, prioritized recommendations
    - Focus on objective analysis rather than rewriting

  2. Template Configuration
    - Template Name: "11.) Website Copy Audit"
    - Type: improve
    - Public: true (accessible to all users)
    - Create Variants: false (single audit output)

  3. Template Logic
    - Senior conversion copy analyst perspective
    - Objective, analytical, specific assessment
    - Identifies concrete issues and opportunities
    - Avoids marketing or persuasive language
    - Does NOT rewrite the full copy
    - Provides actionable, justified recommendations

  4. Input Fields
    - business_description: Business context
    - product_service_name: Product or service (optional)
    - project_description: Audit purpose
    - original_copy: Website copy to audit
    - target_audience: Primary audience
    - tone: "Objective, analytical, professional"
    - preferred_writing_style: "Direct, specific, evidence-based"

  5. Output Structure
    - 6 structured sections:
      1. Overall Assessment (120 words) - Evaluation of copy's overall effectiveness
      2. Strengths (120 words) - Elements working well to preserve
      3. Key Issues Identified (160 words) - Specific problems with clarity, positioning, or conversion
      4. Conversion & Messaging Gaps (160 words) - Missing or weak elements affecting conversions
      5. Structure & Flow Review (120 words) - Hierarchy, sequencing, and readability
      6. Priority Recommendations (160 words) - Ranked high-impact improvements with rationale
    - Total word count: ~840 words

  6. Audit Approach
    - Be objective, analytical, and specific
    - Refer to the copy, not the user
    - Identify concrete issues and opportunities
    - Avoid marketing or persuasive language
    - Do NOT rewrite the full copy
    - Recommendations must be actionable and justified
    - Output ONLY the audit findings (no introductions or conclusions)

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
  'Objective, analytical, professional',
  'English',
  'long',
  'Direct, specific, evidence-based',
  'CRITICAL ROLE INSTRUCTION:

You are acting as a senior conversion copy analyst.

You must PRODUCE the audit directly.
You must NOT explain what you are doing.
You must NOT address the user.
You must NOT include introductions, conclusions, or calls to action.
You must NOT ask for more information.

Output ONLY the audit findings.

AUDIT RULES (STRICT):

- Be objective, analytical, and specific
- Refer to the copy, not the user
- Identify concrete issues and opportunities
- Avoid marketing or persuasive language
- Do NOT rewrite the full copy
- Recommendations must be actionable and justified
- Focus on diagnosis and evidence-based analysis
- Point to specific examples from the copy when identifying issues
- Explain the conversion impact of each issue
- Prioritize recommendations by potential ROI

Structure the audit to provide clear, actionable insights that enable immediate improvement decisions.',
  '[enter your business description]',
  '[enter product / service name]',
  'Audit website copy to identify strengths, issues, and opportunities for improved conversion and clarity.',
  '[enter target audience]',
  '[paste website copy to audit here]',
  ARRAY[
    jsonb_build_object(
      'section', 'Overall Assessment',
      'wordCount', 120,
      'description', 'Objective evaluation of the copy''s overall effectiveness.'
    ),
    jsonb_build_object(
      'section', 'Strengths',
      'wordCount', 120,
      'description', 'Elements that are working well and should be preserved.'
    ),
    jsonb_build_object(
      'section', 'Key Issues Identified',
      'wordCount', 160,
      'description', 'Specific clarity, positioning, or conversion problems.'
    ),
    jsonb_build_object(
      'section', 'Conversion & Messaging Gaps',
      'wordCount', 160,
      'description', 'Missing or weak elements affecting conversions.'
    ),
    jsonb_build_object(
      'section', 'Structure & Flow Review',
      'wordCount', 120,
      'description', 'Assessment of hierarchy, sequencing, and readability.'
    ),
    jsonb_build_object(
      'section', 'Priority Recommendations',
      'wordCount', 160,
      'description', 'Ranked, high-impact improvements with rationale.'
    )
  ]::jsonb[],
  true,
  true,
  'Website Copy Audit',
  'Comprehensive audit of website copy by a senior conversion analyst. Identifies strengths, issues, and actionable opportunities for improved conversion and clarity.',
  false,
  now()
);