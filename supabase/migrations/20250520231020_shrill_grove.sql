/*
  # Create pmc_users table
  
  1. New Tables
     - `pmc_users`
       - `id` (uuid, primary key): maps to auth.users.id
       - `name` (text): user's name
       - `email` (text): user's email address
       - `created_at` (timestamp): when the user was created
  2. Security
     - Enable RLS on `pmc_users` table
     - Add policy for authenticated users to read their own data
     - Add policy for authenticated users to insert their own data
*/

CREATE TABLE IF NOT EXISTS pmc_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pmc_users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON pmc_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to insert their own data
CREATE POLICY "Users can insert own data"
  ON pmc_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON pmc_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_pmc_users_email ON pmc_users(email);