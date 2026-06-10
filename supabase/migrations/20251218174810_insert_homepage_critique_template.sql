/*
  # Insert Homepage Critique Template

  1. Purpose
    - Specialized critique of homepage copy as a first-touch conversion asset
    - Evaluates clarity, positioning, and intent matching
    - Analyzes value proposition, message hierarchy, and conversion elements
    - Assesses trust signals and credibility indicators
    - Provides prioritized, justified recommendations

  2. Template Configuration
    - Template Name: "11.) Homepage Critique"
    - Type: improve
    - Public: true (accessible to all users)
    - Create Variants: false (single critique output)

  3. Template Logic
    - Senior conversion and positioning analyst perspective
    - Focus on first-touch experience (5-10 second impression)
    - Evaluates homepage as conversion asset
    - Specific, concrete analysis (no generic advice)
    - Avoids marketing or persuasive language
    - Does NOT rewrite the homepage
    - Explains WHY recommendations matter

  4. Input Fields
    - business_description: Business context
    - product_service_name: Product or service (optional)
    - project_description: Critique purpose
    - original_copy: Homepage copy to critique
    - target_audience: Primary audience
    - tone: "Objective, analytical, professional"
    - preferred_writing_style: "Direct, specific, evidence-based"

  5. Output Structure
    - 6 structured sections:
      1. First Impression & Clarity (120 words) - What new visitors understand in 5-10 seconds
      2. Value Proposition Assessment (140 words) - Main promise, differentiation, relevance
      3. Message Hierarchy & Flow (120 words) - Structure, sequencing, scannability
      4. Conversion & CTA Effectiveness (140 words) - CTAs, friction points, intent alignment
      5. Trust & Credibility Signals (120 words) - Proof elements, authority, reassurance
      6. Priority Recommendations (160 words) - Ranked high-impact improvements with justification
    - Total word count: ~800 words

  6. Critique Approach
    - Evaluate homepage as first-touch conversion asset
    - Focus on clarity, positioning, and intent matching
    - Refer to the copy, not the user
    - Be specific and concrete (no generic advice)
    - Avoid marketing or persuasive language
    - Do NOT rewrite the homepage
    - Recommendations must explain WHY they matter
    - Output ONLY the critique findings (no introductions or conclusions)

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
  'Objective, analytical, professional',
  'English',
  'long',
  'Direct, specific, evidence-based',
  'CRITICAL ROLE INSTRUCTION:

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
- Avoid marketing or persuasive language
- Do NOT rewrite the homepage
- Recommendations must explain WHY they matter
- Assess the 5-10 second first impression
- Identify specific friction points and clarity gaps
- Evaluate whether the value proposition is immediately clear
- Check if CTAs match visitor intent and awareness level
- Analyze trust signals and credibility elements
- Prioritize recommendations by conversion impact

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
      'description', 'Ranked, high-impact improvements with justification.'
    )
  ]::jsonb[],
  true,
  true,
  'Homepage Critique',
  'Expert critique of homepage copy by a senior conversion analyst. Evaluates first impression, value proposition, conversion elements, and provides prioritized recommendations.',
  false,
  now()
);