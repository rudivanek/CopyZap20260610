/*
  # Normalize Template Defaults to Reduce Intent Guardrail Violations - Part 2

  1. Purpose
    - Fix output_structure language that forces invented claims
    - Replace "Trust & Guarantees" with "Trust Signals"
    - Update section descriptions to avoid forcing hallucinated metrics

  2. Changes
    - Update output_structure arrays to use safer language
    - Remove placeholder brackets that might confuse generation

  3. Implementation Notes
    - output_structure is stored as jsonb[] array type
    - Must reconstruct array with updated elements
*/

-- =============================================================================
-- Fix Pricing Page output_structure: "Trust & Guarantees" -> "Trust Signals"
-- =============================================================================

UPDATE pmc_templates
SET output_structure = ARRAY[
  output_structure[1],
  output_structure[2],
  output_structure[3],
  output_structure[4],
  output_structure[5],
  output_structure[6],
  output_structure[7],
  jsonb_build_object(
    'section', 'Trust Signals',
    'wordCount', 80,
    'description', 'Risk reducers such as refund policies, support promises, or security assurances. Do not invent specific guarantees.'
  ),
  output_structure[9],
  output_structure[10]
]::jsonb[]
WHERE template_name = 'Pricing Page Copy'
  AND is_public = true
  AND output_structure[8]::jsonb->>'section' = 'Trust & Guarantees';

-- =============================================================================
-- Fix Landing Page output_structure: Update "Social Proof / Trust Signals"
-- =============================================================================

UPDATE pmc_templates
SET output_structure = ARRAY[
  output_structure[1],
  output_structure[2],
  output_structure[3],
  output_structure[4],
  output_structure[5],
  output_structure[6],
  output_structure[7],
  jsonb_build_object(
    'section', output_structure[8]::jsonb->>'section',
    'wordCount', (output_structure[8]::jsonb->>'wordCount')::int,
    'description', 'Testimonials, credentials, or credibility indicators. Use qualitative language if specific details are not provided.'
  ),
  output_structure[9],
  output_structure[10]
]::jsonb[]
WHERE template_name = 'Landing Page – Lead Generation'
  AND is_public = true
  AND output_structure[8]::jsonb->>'section' = 'Social Proof / Trust Signals';

-- =============================================================================
-- Fix Website Home Page output_structure: Remove placeholder brackets
-- =============================================================================

UPDATE pmc_templates
SET output_structure = ARRAY[
  jsonb_build_object(
    'section', output_structure[1]::jsonb->>'section',
    'wordCount', (output_structure[1]::jsonb->>'wordCount')::int,
    'description', 'Main brand promise in 6–10 words describing your core offering.'
  ),
  jsonb_build_object(
    'section', output_structure[2]::jsonb->>'section',
    'wordCount', (output_structure[2]::jsonb->>'wordCount')::int,
    'description', 'Explain what you do, for whom, and why it matters. Reference your main benefit.'
  ),
  jsonb_build_object(
    'section', output_structure[3]::jsonb->>'section',
    'wordCount', (output_structure[3]::jsonb->>'wordCount')::int,
    'description', 'Primary benefit for your target audience.'
  ),
  jsonb_build_object(
    'section', output_structure[4]::jsonb->>'section',
    'wordCount', (output_structure[4]::jsonb->>'wordCount')::int,
    'description', 'Differentiation, credibility, or expertise.'
  ),
  jsonb_build_object(
    'section', output_structure[5]::jsonb->>'section',
    'wordCount', (output_structure[5]::jsonb->>'wordCount')::int,
    'description', 'Expected outcome or result for the customer. Stay qualitative if specific metrics are not provided.'
  )
]::jsonb[]
WHERE template_name = 'Website Home Page – Hero + Value Proposition'
  AND is_public = true
  AND array_length(output_structure, 1) = 5;