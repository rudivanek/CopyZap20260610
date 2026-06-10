/*
  # Create Template Prompt Suggestions Table

  1. New Tables
    - `pmc_template_prompt_suggestions`
      - `id` (uuid, primary key)
      - `category` (text) - Category grouping for organizing suggestions
      - `prompt_text` (text) - The suggestion text to insert
      - `active` (boolean) - Whether this suggestion is currently active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `pmc_template_prompt_suggestions` table
    - Add policy for authenticated users to read active suggestions
    - Add policy for admins to manage suggestions

  3. Notes
    - This table is for Natural Language Prompt Generator suggestions
    - Helps users quickly insert common prompt patterns
*/

-- Create the table
CREATE TABLE IF NOT EXISTS pmc_template_prompt_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  prompt_text text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pmc_template_prompt_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read active suggestions
CREATE POLICY "Authenticated users can read active template prompt suggestions"
  ON pmc_template_prompt_suggestions
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Policy: Admins can manage all suggestions
CREATE POLICY "Admins can manage template prompt suggestions"
  ON pmc_template_prompt_suggestions
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_pmc_template_prompt_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pmc_template_prompt_suggestions_updated_at
  BEFORE UPDATE ON pmc_template_prompt_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_pmc_template_prompt_suggestions_updated_at();

-- Insert sample data
INSERT INTO pmc_template_prompt_suggestions (category, prompt_text, active) VALUES
  ('Blog Posts', 'Create a blog post about [topic], 800 words, professional tone, include SEO metadata', true),
  ('Blog Posts', 'Write an engaging blog post for [audience], 500-600 words, conversational tone, add bullet points', true),
  ('Marketing Copy', 'Generate landing page copy for [product/service], 400 words, persuasive tone, include CTA', true),
  ('Marketing Copy', 'Create email marketing copy for [campaign], 250 words, friendly tone, target [audience]', true),
  ('Social Media', 'Write social media post for [platform], 150 words max, casual tone, include hashtags', true),
  ('Social Media', 'Create Twitter thread about [topic], 5 tweets, engaging tone, target [audience]', true),
  ('Product Descriptions', 'Write product description for [product], 200 words, highlight key features and benefits', true),
  ('Product Descriptions', 'Create compelling product copy for [category], 300 words, persuasive tone, include technical specs', true),
  ('Website Content', 'Generate homepage hero section copy, 100 words, professional tone, clear value proposition', true),
  ('Website Content', 'Create About Us page content, 500 words, authentic tone, include company values', true),
  ('SEO Content', 'Write SEO-optimized article about [keyword], 1000 words, include H2/H3 headers and meta description', true),
  ('SEO Content', 'Create FAQ section for [topic], 10 Q&A pairs, clear tone, optimize for featured snippets', true)
ON CONFLICT DO NOTHING;
