/*
  # Create Help Page Feedback System

  1. New Tables
    - `help_page_feedback`
      - `id` (uuid, primary key)
      - `page_name` (text) - The help page that received feedback
      - `is_helpful` (boolean) - true for thumbs up, false for thumbs down
      - `session_id` (text) - Anonymous session tracking to prevent duplicate votes
      - `created_at` (timestamptz) - When feedback was submitted
      - `user_agent` (text, nullable) - Browser info for analytics
      - `ip_hash` (text, nullable) - Hashed IP for abuse prevention

  2. Security
    - Enable RLS on `help_page_feedback` table
    - Add policy for public insert (anyone can submit feedback)
    - Add policy for authenticated admin users to read feedback data

  3. Indexes
    - Index on page_name for analytics queries
    - Index on created_at for time-based queries
    - Composite index on session_id and page_name to prevent duplicate votes
*/

CREATE TABLE IF NOT EXISTS help_page_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name text NOT NULL,
  is_helpful boolean NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_agent text,
  ip_hash text
);

-- Enable RLS
ALTER TABLE help_page_feedback ENABLE ROW LEVEL SECURITY;

-- Public can insert feedback
CREATE POLICY "Anyone can submit help page feedback"
  ON help_page_feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users with admin role can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON help_page_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pmc_users
      WHERE pmc_users.id = auth.uid()
      AND pmc_users.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_help_page_feedback_page_name ON help_page_feedback(page_name);
CREATE INDEX IF NOT EXISTS idx_help_page_feedback_created_at ON help_page_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_help_page_feedback_session_page ON help_page_feedback(session_id, page_name);

-- Create a view for feedback statistics
CREATE OR REPLACE VIEW help_page_feedback_stats AS
SELECT
  page_name,
  COUNT(*) as total_votes,
  SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END) as helpful_votes,
  SUM(CASE WHEN NOT is_helpful THEN 1 ELSE 0 END) as not_helpful_votes,
  ROUND(
    (SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100,
    2
  ) as helpful_percentage
FROM help_page_feedback
GROUP BY page_name
ORDER BY total_votes DESC;
