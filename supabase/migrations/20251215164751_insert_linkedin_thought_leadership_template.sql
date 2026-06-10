/*
  # Insert LinkedIn Thought Leadership Post Template

  1. New Template
    - Name: "11.) LinkedIn Thought Leadership Post"
    - Type: create
    - Purpose: Pre-configured template for positioning as an authority with contrarian or bold perspectives
    - Available publicly for all users

  2. Features
    - 5-section structured output (Hook, Context, Contrarian View, Evidence, CTA)
    - Prefilled fields with placeholder text for easy customization
    - Professional, confident, authoritative tone
    - Custom LinkedIn word count logic (default: Medium 200–350 words)
    - First-person thought leadership perspective

  3. Output Structure
    - Hook (40 words): Bold opening that challenges assumptions
    - Context / Industry Insight (120 words): Current situation or common belief
    - Contrarian View or Key Insight (120 words): Your unique perspective or contrarian view
    - Supporting Evidence or Story (100 words): Data, story, or example backing your view
    - Call to Action or Conclusion (70 words): Invite discussion or reflection

  4. Custom Word Count Logic
    - Short: 100–150 words
    - Medium: 200–350 words (default)
    - Long: 400–700 words
*/

INSERT INTO public.pmc_templates (
  id,
  user_id,
  template_name,
  template_type,
  tone,
  language,
  word_count,
  business_description,
  product_service_name,
  project_description,
  key_message,
  target_audience,
  preferred_writing_style,
  output_structure,
  include_section_titles,
  is_public,
  public_name,
  public_description,
  created_at
) VALUES (
  gen_random_uuid(),
  '2ac648bd-fa9e-4323-92a5-2e02799dc514',
  '11.) LinkedIn Thought Leadership Post',
  'create',
  'Professional, confident, insightful, authoritative',
  'English',
  'Medium: 100-200',
  '[enter your business description]',
  '[enter product / service name]',
  'LinkedIn thought leadership post written to position [enter your name or role] from [enter your business name] as an authority in [enter industry or field]. The post should challenge conventional thinking or offer a strong perspective.',
  'My core belief or point of view is that [enter your main insight, opinion, or contrarian idea].',
  '[enter your target audience on LinkedIn]',
  'First-person, thought-provoking, clear, confident, expert tone',
  ARRAY[
    jsonb_build_object(
      'section', 'Hook',
      'wordCount', 40,
      'description', 'Bold opening statement or question that challenges assumptions in [industry or topic].'
    ),
    jsonb_build_object(
      'section', 'Context / Industry Insight',
      'wordCount', 120,
      'description', 'Explain the current situation, common belief, or problem in [your industry].'
    ),
    jsonb_build_object(
      'section', 'Contrarian View or Key Insight',
      'wordCount', 120,
      'description', 'Present your unique perspective or contrarian view that challenges the status quo.'
    ),
    jsonb_build_object(
      'section', 'Supporting Evidence or Story',
      'wordCount', 100,
      'description', 'Share data, a personal story, case study, or example that validates your viewpoint.'
    ),
    jsonb_build_object(
      'section', 'Call to Action or Conclusion',
      'wordCount', 70,
      'description', 'Invite discussion, ask for perspectives, or reinforce your key message.'
    )
  ]::jsonb[],
  true,
  true,
  'LinkedIn Thought Leadership Post',
  'Position yourself as an authority with bold perspectives that challenge conventional thinking in your industry',
  now()
);