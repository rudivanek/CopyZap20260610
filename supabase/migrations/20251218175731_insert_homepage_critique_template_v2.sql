/*
  # Insert Homepage Critique Template (Enhanced Version)

  1. Purpose
    - Senior conversion analyst critique of homepage copy
    - Evaluates first-touch conversion effectiveness
    - Focuses on clarity, positioning, and intent matching
    - Provides actionable, ranked recommendations

  2. Template Configuration
    - Template Name: "11.) Homepage Critique"
    - Type: improve
    - Public: true (accessible to all users)
    - Create Variants: false (single critique output)

  3. Critical Role Instructions (Hard Lock)
    - Acts as senior conversion and positioning analyst
    - Produces critique directly without explanation
    - Does NOT address the user
    - Does NOT include introductions, conclusions, or CTAs
    - Does NOT ask for more information
    - Outputs ONLY critique findings

  4. Critique Rules (Strict)
    - Evaluate homepage as first-touch conversion asset
    - Focus on clarity, positioning, and intent matching
    - Refer to the copy, not the user
    - Be specific and concrete (no generic advice)
    - Avoid marketing, persuasive, or rhetorical language
    - Do NOT rewrite the homepage
    - Recommendations must explain WHY they matter

  5. Output Style Constraints
    - Prefer concise, declarative sentences
    - Avoid metaphorical, poetic, or speculative language
    - Each paragraph must introduce a NEW insight
    - Do NOT repeat the same issue across sections
    - Reference concrete page elements (hero headline, subheadline, CTA, section order)
    - Do NOT speculate about metrics unless directly implied by copy
    - Maintain analytical, report-style tone

  6. Recommendation Format Rules
    - Recommendations MUST be actionable
    - Use clear, separated actions (numbered or clearly segmented)
    - Each recommendation should map to a specific problem identified earlier
    - Avoid high-level strategy without operational direction

  7. Input Fields
    - original_copy: Homepage copy to critique
    - business_description: Business context
    - target_audience: Primary audience

  8. Output Structure
    - 6 structured sections totaling ~800 words:
      1. First Impression & Clarity (120 words)
      2. Value Proposition Assessment (140 words)
      3. Message Hierarchy & Flow (120 words)
      4. Conversion & CTA Effectiveness (140 words)
      5. Trust & Credibility Signals (120 words)
      6. Priority Recommendations (160 words)

  9. Security
    - Public template accessible to all authenticated users
*/

-- Remove existing template with same name if it exists
DELETE FROM public.pmc_templates 
WHERE template_name = '11.) Homepage Critique';

-- Insert the enhanced template
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
  'Objective, analytical, professional',
  'English',
  'long',
  'Direct, specific, evidence-based',
  'CRITICAL ROLE INSTRUCTION (HARD LOCK):

You are acting as a senior conversion and positioning analyst.

You must PRODUCE the critique directly.
You must NOT explain what you are doing.
You must NOT address the user.
You must NOT include introductions, conclusions, or calls to action.
You must NOT ask for more information.

Output ONLY the critique findings.

CRITIQUE RULES (STRICT):

- Evaluate the homepage as a first-touch conversion asset
- Focus on clarity, positioning, and intent matching
- Refer to the copy, not the user
- Be specific and concrete (no generic advice)
- Avoid marketing, persuasive, or rhetorical language
- Do NOT rewrite the homepage
- Recommendations must explain WHY they matter

OUTPUT STYLE CONSTRAINTS (VERY IMPORTANT):

- Prefer concise, declarative sentences
- Avoid metaphorical, poetic, or speculative language
- Each paragraph must introduce a NEW insight
- Do NOT repeat the same issue across sections
- Reference concrete page elements where possible (e.g. hero headline, subheadline, CTA, section order)
- Do NOT speculate about metrics (bounce rate, conversions) unless directly implied by copy
- Maintain an analytical, report-style tone

RECOMMENDATION FORMAT RULES:

- Recommendations MUST be actionable
- Use clear, separated actions (numbered or clearly segmented)
- Each recommendation should map to a specific problem identified earlier
- Avoid high-level strategy without operational direction

Structure the critique to provide actionable insights that enable immediate homepage optimization decisions.',
  '[enter your business description]',
  '[enter product / service name]',
  'Critique homepage copy to evaluate first impression, positioning, and conversion effectiveness.',
  '[enter target audience]',
  '[paste homepage copy to critique here]',
  ARRAY[
    jsonb_build_object(
      'section', 'First Impression & Clarity',
      'wordCount', 120,
      'description', 'What a new visitor understands within the first 5–10 seconds.'
    ),
    jsonb_build_object(
      'section', 'Value Proposition Assessment',
      'wordCount', 140,
      'description', 'Evaluation of the main promise, differentiation, and relevance.'
    ),
    jsonb_build_object(
      'section', 'Message Hierarchy & Flow',
      'wordCount', 120,
      'description', 'Assessment of structure, sequencing, and scannability.'
    ),
    jsonb_build_object(
      'section', 'Conversion & CTA Effectiveness',
      'wordCount', 140,
      'description', 'Analysis of calls to action, friction points, and intent alignment.'
    ),
    jsonb_build_object(
      'section', 'Trust & Credibility Signals',
      'wordCount', 120,
      'description', 'Evaluation of proof elements, authority, and reassurance.'
    ),
    jsonb_build_object(
      'section', 'Priority Recommendations',
      'wordCount', 160,
      'description', 'Ranked, high-impact improvements with clear justification.'
    )
  ]::jsonb[],
  true,
  true,
  'Homepage Critique',
  'Expert critique of homepage copy by a senior conversion analyst. Evaluates first impression, value proposition, conversion elements, and provides prioritized, actionable recommendations.',
  false,
  now()
);