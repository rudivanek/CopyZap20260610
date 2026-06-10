-- Fix pmc_saved_outputs table schema
-- Run this in Supabase SQL Editor or via CLI

-- Drop the old table if it exists (WARNING: This will delete all data in the old table)
DROP TABLE IF EXISTS pmc_saved_outputs CASCADE;

-- Create the new pmc_saved_outputs table with correct schema
CREATE TABLE pmc_saved_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  session_id uuid REFERENCES pmc_copy_sessions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pmc_saved_outputs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved outputs
CREATE POLICY "Users can view own saved outputs"
  ON pmc_saved_outputs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved outputs
CREATE POLICY "Users can insert own saved outputs"
  ON pmc_saved_outputs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved outputs
CREATE POLICY "Users can update own saved outputs"
  ON pmc_saved_outputs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved outputs
CREATE POLICY "Users can delete own saved outputs"
  ON pmc_saved_outputs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_saved_outputs_user_id ON pmc_saved_outputs(user_id);
CREATE INDEX idx_saved_outputs_created_at ON pmc_saved_outputs(created_at DESC);
CREATE INDEX idx_saved_outputs_tags ON pmc_saved_outputs USING GIN(tags);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_outputs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_saved_outputs_updated_at_trigger
  BEFORE UPDATE ON pmc_saved_outputs
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_outputs_updated_at();
