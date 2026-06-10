/*
  # Create PMC Extra Suggestions Table

  1. New Tables
    - `pmc_extra_suggestions`
      - `id` (uuid, primary key)
      - `category` (text) - Category grouping for organizing suggestions
      - `instruction_text` (text) - The suggestion text to insert
      - `tone_match` (text[]) - Array of tones this suggestion applies to (empty = all)
      - `language_match` (text[]) - Array of languages this suggestion applies to (empty = all)
      - `output_type_match` (text[]) - Array of output types this suggestion applies to (empty = all)
      - `active` (boolean) - Whether this suggestion is currently active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `pmc_extra_suggestions` table
    - Add policy for authenticated users to read active suggestions
    - Add policy for admins to manage suggestions (insert, update, delete)

  3. Notes
    - This table mirrors the structure of `special_instructions_suggestions`
    - Allows for additional custom suggestions to be managed separately
    - Can be used for A/B testing or premium suggestions
*/

-- Create the table
CREATE TABLE IF NOT EXISTS pmc_extra_suggestions (
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
ALTER TABLE pmc_extra_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read active suggestions
CREATE POLICY "Authenticated users can read active extra suggestions"
  ON pmc_extra_suggestions
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Policy: Admins can manage all suggestions
CREATE POLICY "Admins can manage extra suggestions"
  ON pmc_extra_suggestions
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_pmc_extra_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pmc_extra_suggestions_updated_at
  BEFORE UPDATE ON pmc_extra_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_pmc_extra_suggestions_updated_at();