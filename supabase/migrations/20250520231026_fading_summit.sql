/*
  # Create pmc_copy_sessions table
  
  1. New Tables
     - `pmc_copy_sessions`
       - `id` (uuid, primary key): unique identifier for the copy session
       - `user_id` (uuid, foreign key): references pmc_users.id
       - `input_data` (jsonb): stores all form inputs used to generate the copy
       - `improved_copy` (text): the generated improved copy
       - `alternative_copy` (text): alternative version of the copy
       - `created_at` (timestamp): when the session was created
  2. Security
     - Enable RLS on `pmc_copy_sessions` table
     - Add policy for authenticated users to read their own data
     - Add policy for authenticated users to insert their own data
     - Add policy for authenticated users to delete their own data
*/

CREATE TABLE IF NOT EXISTS pmc_copy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pmc_users(id) ON DELETE CASCADE,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  improved_copy TEXT NOT NULL,
  alternative_copy TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pmc_copy_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own copy sessions"
  ON pmc_copy_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own data
CREATE POLICY "Users can insert own copy sessions"
  ON pmc_copy_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own data
CREATE POLICY "Users can delete own copy sessions"
  ON pmc_copy_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_user_id ON pmc_copy_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_created_at ON pmc_copy_sessions(created_at);