-- Migrate existing pmc_saved_outputs table to new schema (preserves data)
-- Run this in Supabase SQL Editor or via CLI

-- First, check if the table exists with old schema
DO $$
BEGIN
  -- If the old table exists with brief_description, migrate it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pmc_saved_outputs'
    AND column_name = 'brief_description'
  ) THEN
    -- Create temporary backup
    CREATE TEMP TABLE saved_outputs_backup AS
    SELECT * FROM pmc_saved_outputs;

    -- Drop old table
    DROP TABLE pmc_saved_outputs CASCADE;

    -- Create new table with correct schema
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

    -- Migrate data from backup
    -- Map old columns to new columns
    INSERT INTO pmc_saved_outputs (
      id,
      user_id,
      title,
      description,
      input_data,
      output_data,
      tags,
      created_at
    )
    SELECT
      id,
      user_id,
      COALESCE(brief_description, 'Untitled Output') as title,
      NULL as description,
      COALESCE(input_snapshot, '{}'::jsonb) as input_data,
      COALESCE(output_content, '{}'::jsonb) as output_data,
      ARRAY[]::text[] as tags,
      COALESCE(saved_at, now()) as created_at
    FROM saved_outputs_backup;

    RAISE NOTICE 'Successfully migrated existing saved outputs data';
  ELSE
    -- Table doesn't exist or doesn't have old schema, create fresh
    CREATE TABLE IF NOT EXISTS pmc_saved_outputs (
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

    RAISE NOTICE 'Created new pmc_saved_outputs table';
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE pmc_saved_outputs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own saved outputs" ON pmc_saved_outputs;
DROP POLICY IF EXISTS "Users can insert own saved outputs" ON pmc_saved_outputs;
DROP POLICY IF EXISTS "Users can update own saved outputs" ON pmc_saved_outputs;
DROP POLICY IF EXISTS "Users can delete own saved outputs" ON pmc_saved_outputs;

-- Create policies
CREATE POLICY "Users can view own saved outputs"
  ON pmc_saved_outputs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved outputs"
  ON pmc_saved_outputs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved outputs"
  ON pmc_saved_outputs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved outputs"
  ON pmc_saved_outputs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
DROP INDEX IF EXISTS idx_saved_outputs_user_id;
DROP INDEX IF EXISTS idx_saved_outputs_created_at;
DROP INDEX IF EXISTS idx_saved_outputs_tags;

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

-- Create trigger
DROP TRIGGER IF EXISTS update_saved_outputs_updated_at_trigger ON pmc_saved_outputs;
CREATE TRIGGER update_saved_outputs_updated_at_trigger
  BEFORE UPDATE ON pmc_saved_outputs
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_outputs_updated_at();
