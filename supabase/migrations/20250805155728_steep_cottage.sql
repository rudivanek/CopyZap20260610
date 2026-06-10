/*
  # Create beta_register table for beta user signups

  1. New Tables
    - `beta_register`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `created_at` (timestamp with timezone, default now)

  2. Security
    - Enable RLS on `beta_register` table
    - Add policy for public insert access (anyone can register)
    - Add policy for admin read access only
*/

CREATE TABLE IF NOT EXISTS beta_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE beta_register ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert beta registrations
CREATE POLICY "Allow public beta registration"
  ON beta_register
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admin can read beta registrations
CREATE POLICY "Admin can read beta registrations"
  ON beta_register
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'rfv@datago.net');

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_beta_register_email ON beta_register(email);
CREATE INDEX IF NOT EXISTS idx_beta_register_created_at ON beta_register(created_at);