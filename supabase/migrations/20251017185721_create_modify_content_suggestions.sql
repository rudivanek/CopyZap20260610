/*
  # Create Modify Content Suggestions Table

  1. New Tables
    - `modify_content_suggestions`
      - `id` (uuid, primary key)
      - `category` (text) - Category grouping (e.g., "Tone Adjustments", "Length Changes")
      - `instruction_text` (text) - The suggestion text to insert
      - `tone_match` (text[]) - Array of tones this suggestion applies to (empty = all)
      - `language_match` (text[]) - Array of languages this suggestion applies to (empty = all)
      - `output_type_match` (text[]) - Array of output types this suggestion applies to (empty = all)
      - `active` (boolean) - Whether this suggestion is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `modify_content_suggestions` table
    - Add policy for authenticated users to read active suggestions
    - Add policy for admins to manage suggestions

  3. Sample Data
    - Insert default suggestions for content modification scenarios
*/

-- Create the table
CREATE TABLE IF NOT EXISTS modify_content_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  instruction_text text NOT NULL,
  tone_match text[] DEFAULT '{}',
  language_match text[] DEFAULT '{}',
  output_type_match text[] DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE modify_content_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read active suggestions
CREATE POLICY "Authenticated users can read active modify suggestions"
  ON modify_content_suggestions
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Policy: Admins can manage all suggestions
CREATE POLICY "Admins can manage modify suggestions"
  ON modify_content_suggestions
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- Insert default suggestions
INSERT INTO modify_content_suggestions (category, instruction_text, tone_match, language_match, output_type_match) VALUES
  -- Tone Adjustments
  ('Tone Adjustments', 'Make more professional and formal', '{}', '{}', '{}'),
  ('Tone Adjustments', 'Make more casual and friendly', '{}', '{}', '{}'),
  ('Tone Adjustments', 'Make more persuasive and compelling', '{}', '{}', '{}'),
  ('Tone Adjustments', 'Make more empathetic and understanding', '{}', '{}', '{}'),
  ('Tone Adjustments', 'Make more confident and authoritative', '{}', '{}', '{}'),
  ('Tone Adjustments', 'Add subtle humor', '{}', '{}', '{}'),
  
  -- Length Changes
  ('Length Changes', 'Make shorter and more concise', '{}', '{}', '{}'),
  ('Length Changes', 'Expand with more details and examples', '{}', '{}', '{}'),
  ('Length Changes', 'Reduce to half the length', '{}', '{}', '{}'),
  ('Length Changes', 'Double the length with elaboration', '{}', '{}', '{}'),
  
  -- Content Focus
  ('Content Focus', 'Focus more on benefits than features', '{}', '{}', '{}'),
  ('Content Focus', 'Add more specific examples', '{}', '{}', '{}'),
  ('Content Focus', 'Include statistics and data points', '{}', '{}', '{}'),
  ('Content Focus', 'Add customer testimonials or quotes', '{}', '{}', '{}'),
  ('Content Focus', 'Emphasize unique selling points', '{}', '{}', '{}'),
  ('Content Focus', 'Address common objections', '{}', '{}', '{}'),
  
  -- Clarity & Readability
  ('Clarity & Readability', 'Simplify language for broader audience', '{}', '{}', '{}'),
  ('Clarity & Readability', 'Use shorter sentences', '{}', '{}', '{}'),
  ('Clarity & Readability', 'Replace jargon with plain language', '{}', '{}', '{}'),
  ('Clarity & Readability', 'Add transition words for better flow', '{}', '{}', '{}'),
  ('Clarity & Readability', 'Break into smaller paragraphs', '{}', '{}', '{}'),
  
  -- Call to Action
  ('Call to Action', 'Strengthen the call to action', '{}', '{}', '{}'),
  ('Call to Action', 'Add urgency and scarcity', '{}', '{}', '{}'),
  ('Call to Action', 'Make CTA more specific', '{}', '{}', '{}'),
  ('Call to Action', 'Add multiple CTAs throughout', '{}', '{}', '{}'),
  
  -- Structure
  ('Structure', 'Add headings and subheadings', '{}', '{}', '{}'),
  ('Structure', 'Convert to bullet points', '{}', '{}', '{}'),
  ('Structure', 'Add a summary at the beginning', '{}', '{}', '{}'),
  ('Structure', 'Reorganize with problem-solution structure', '{}', '{}', '{}'),
  
  -- SEO & Keywords
  ('SEO & Keywords', 'Optimize for SEO with natural keyword integration', '{}', '{}', '{}'),
  ('SEO & Keywords', 'Add relevant long-tail keywords', '{}', '{}', '{}'),
  ('SEO & Keywords', 'Include semantic variations of key terms', '{}', '{}', '{}'),
  
  -- Emotional Appeal
  ('Emotional Appeal', 'Add more emotional appeal', '{}', '{}', '{}'),
  ('Emotional Appeal', 'Make more inspiring and motivational', '{}', '{}', '{}'),
  ('Emotional Appeal', 'Address pain points more directly', '{}', '{}', '{}'),
  ('Emotional Appeal', 'Create sense of belonging', '{}', '{}', '{}');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_modify_content_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER modify_content_suggestions_updated_at
  BEFORE UPDATE ON modify_content_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_modify_content_suggestions_updated_at();