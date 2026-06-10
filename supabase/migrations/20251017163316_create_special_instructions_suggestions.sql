/*
  # Create Special Instructions Suggestions Table

  1. New Tables
    - `special_instructions_suggestions`
      - `id` (uuid, primary key)
      - `category` (text) - Category grouping (e.g., "Tone & Style", "Formatting")
      - `instruction_text` (text) - The suggestion text to insert
      - `tone_match` (text[]) - Array of tones this suggestion applies to (empty = all)
      - `language_match` (text[]) - Array of languages this suggestion applies to (empty = all)
      - `output_type_match` (text[]) - Array of output types this suggestion applies to (empty = all)
      - `active` (boolean) - Whether this suggestion is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `special_instructions_suggestions` table
    - Add policy for authenticated users to read active suggestions
    - Add policy for admins to manage suggestions

  3. Sample Data
    - Insert default suggestions across multiple categories
*/

-- Create the table
CREATE TABLE IF NOT EXISTS special_instructions_suggestions (
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
ALTER TABLE special_instructions_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read active suggestions
CREATE POLICY "Authenticated users can read active suggestions"
  ON special_instructions_suggestions
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Policy: Admins can manage all suggestions (requires admin role in user metadata)
CREATE POLICY "Admins can manage suggestions"
  ON special_instructions_suggestions
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- Insert default suggestions
INSERT INTO special_instructions_suggestions (category, instruction_text, tone_match, language_match, output_type_match) VALUES
  -- Tone & Style
  ('Tone & Style', 'Add subtle humor without being silly', '{}', '{}', '{}'),
  ('Tone & Style', 'Sound confident but not arrogant', '{}', '{}', '{}'),
  ('Tone & Style', 'Use short, punchy sentences', '{}', '{}', '{}'),
  ('Tone & Style', 'Use rhetorical questions sparingly', '{}', '{}', '{}'),
  ('Tone & Style', 'Write in a conversational tone', '{}', '{}', '{}'),
  
  -- Formatting
  ('Formatting', 'Use bullet points for features', '{}', '{}', '{}'),
  ('Formatting', 'Start with a TL;DR summary', '{}', '{}', '{}'),
  ('Formatting', 'Bold all product names', '{}', '{}', '{}'),
  ('Formatting', 'Maximum 3 sentences per paragraph', '{}', '{}', '{}'),
  ('Formatting', 'Include a table of contents outline', '{}', '{}', '{}'),
  ('Formatting', 'Add section headers for each main point', '{}', '{}', '{}'),
  
  -- Content Rules
  ('Content Rules', 'Avoid mentioning competitors', '{}', '{}', '{}'),
  ('Content Rules', 'Include exactly 3 customer pain points', '{}', '{}', '{}'),
  ('Content Rules', 'Add a clear CTA at the end', '{}', '{}', '{}'),
  ('Content Rules', 'Start with a provocative question', '{}', '{}', '{}'),
  ('Content Rules', 'End every section with a mini-CTA', '{}', '{}', '{}'),
  ('Content Rules', 'Don''t use the word "innovative"', '{}', '{}', '{}'),
  
  -- Localization
  ('Localization', 'Use Mexican Spanish idioms naturally', '{}', '{Spanish}', '{}'),
  ('Localization', 'Use British spelling', '{}', '{English}', '{}'),
  ('Localization', 'Reference Querétaro landmarks', '{}', '{Spanish}', '{}'),
  ('Localization', 'Use Vienna slang and local expressions', '{}', '{German}', '{}'),
  ('Localization', 'Include British spelling throughout', '{}', '{English}', '{}'),
  ('Localization', 'Reference local landmarks in Berlin', '{}', '{German}', '{}'),
  
  -- Technical / Clarity
  ('Technical / Clarity', 'Use active voice exclusively', '{}', '{}', '{}'),
  ('Technical / Clarity', 'Target 8th-grade reading level', '{}', '{}', '{}'),
  ('Technical / Clarity', 'Keep under 200 words total', '{}', '{}', '{}'),
  ('Technical / Clarity', 'Write at 5th grade reading level', '{}', '{}', '{}'),
  ('Technical / Clarity', 'Avoid technical jargon', '{}', '{}', '{}'),
  ('Technical / Clarity', 'Define all acronyms on first use', '{}', '{}', '{}');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_special_instructions_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER special_instructions_suggestions_updated_at
  BEFORE UPDATE ON special_instructions_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_special_instructions_suggestions_updated_at();