/*
  # Insert GEO / LLM Optimization Pass Template

  1. New Template
    - Template Name: "11.) GEO / LLM Optimization Pass"
    - Template Type: "improve"
    - Purpose: Optimize content for LLM comprehension, indexing, summarization, and citation
    - Public: Yes
    
  2. Key Features
    - Rewrites content to be more explicit and clear for AI assistants
    - Reduces ambiguity and vague references
    - Makes entities, roles, and concepts explicit
    - Extracts key concepts for LLM association
    
  3. Output Structure
    - LLM-Optimized Rewrite: Full rewritten version
    - Key Concepts Extracted: Main concepts and entities (80 words)
    
  4. Fields
    - Pre-filled with visible placeholders [enter...] for user guidance
    - Focuses on clarity, explicitness, and LLM-friendly formatting
    - Tone: Clear, authoritative, neutral
    - Style: Structured, factual, explicit, LLM-friendly
    - Word Count: AI Decide (lets AI determine optimal length)
*/

INSERT INTO public.pmc_templates (
  user_id,
  template_name,
  template_type,
  language,
  word_count,
  business_description,
  product_service_name,
  project_description,
  original_copy,
  key_message,
  target_audience,
  tone,
  preferred_writing_style,
  output_structure,
  is_public,
  create_variants,
  public_name,
  public_description,
  ai_decide_word_count
) VALUES (
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) GEO / LLM Optimization Pass',
  'improve',
  'English',
  'AI Decide',
  '[enter your business description]',
  '[enter product / service name]',
  'Rewrite the provided content so it is better understood, indexed, summarized, and cited by LLMs such as ChatGPT, Gemini, Claude, and other AI assistants.

--------------------------------------------------
GEO / LLM OPTIMIZATION LOGIC (CRITICAL)
--------------------------------------------------

The rewrite must:

- Improve clarity and factual explicitness
- Reduce ambiguity and vague references
- Make entities, roles, and concepts explicit
- Use short, declarative sentences where possible
- Favor definitions, explanations, and cause–effect clarity
- Avoid marketing fluff, hype, or persuasive language
- Be easy to summarize accurately by an LLM
- Be suitable for direct citation or paraphrasing by AI assistants

This is NOT traditional SEO.
This is optimization for AI comprehension and retrieval.

--------------------------------------------------
STRUCTURAL GUIDELINES
--------------------------------------------------

- Use clear headings where appropriate
- Prefer explanatory paragraphs over storytelling
- Surface key concepts early
- Avoid pronouns without clear antecedents
- Avoid implied knowledge — state facts explicitly',
  '[paste the original content to optimize for LLM indexing]',
  'The primary concept or expertise this content should communicate is [enter core idea].',
  '[enter the audience this content is meant to help]',
  'Clear, authoritative, neutral',
  'Structured, factual, explicit, LLM-friendly',
  ARRAY[
    '{"section": "LLM-Optimized Rewrite", "wordCount": 0, "description": "Full rewritten version of the original content optimized for AI indexing, summarization, and citation."}'::jsonb,
    '{"section": "Key Concepts Extracted", "wordCount": 80, "description": "Explicit list of the main concepts, entities, and ideas an LLM should associate with this content."}'::jsonb
  ],
  true,
  false,
  'GEO / LLM Optimization Pass',
  'Rewrite content to be better understood, indexed, and cited by AI assistants like ChatGPT, Gemini, and Claude. Optimizes for clarity, explicitness, and LLM comprehension.',
  true
)
RETURNING 
  id,
  template_name,
  template_type,
  language,
  word_count,
  ai_decide_word_count,
  is_public,
  create_variants,
  public_name,
  public_description,
  output_structure;
