/*
  # Create URL Analysis Cache Table

  1. New Tables
    - `pmc_url_analysis_cache`
      - `id` (uuid, primary key) - Unique identifier
      - `url` (text, unique, not null) - The analyzed URL
      - `title` (text) - Extracted page title
      - `description` (text) - Extracted meta description
      - `content` (text) - Cleaned page content
      - `extracted_data` (jsonb) - AI-extracted structured data (what, audience, tone, pain points)
      - `created_at` (timestamptz) - When the analysis was cached
      - `expires_at` (timestamptz) - Cache expiration (30 days)
      - `access_count` (integer) - How many times this cached result was used
      - `last_accessed_at` (timestamptz) - Last time this cache was accessed

  2. Indexes
    - Index on url for fast lookups
    - Index on expires_at for cleanup queries

  3. Security
    - Enable RLS on `pmc_url_analysis_cache` table
    - Allow authenticated users to read all cached analyses
    - Allow authenticated users to insert new analyses
    - Allow authenticated users to update access tracking

  4. Notes
    - Cache reduces API calls and improves response time
    - 30-day expiration keeps data fresh
    - Access tracking helps identify popular URLs
*/

CREATE TABLE IF NOT EXISTS pmc_url_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  title text,
  description text,
  content text,
  extracted_data jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  access_count integer DEFAULT 0,
  last_accessed_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_url_analysis_url ON pmc_url_analysis_cache(url);
CREATE INDEX IF NOT EXISTS idx_url_analysis_expires ON pmc_url_analysis_cache(expires_at);

-- Enable RLS
ALTER TABLE pmc_url_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all cached analyses
CREATE POLICY "Authenticated users can read URL analysis cache"
  ON pmc_url_analysis_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert new analyses
CREATE POLICY "Authenticated users can insert URL analysis"
  ON pmc_url_analysis_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update access tracking
CREATE POLICY "Authenticated users can update URL analysis access tracking"
  ON pmc_url_analysis_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
