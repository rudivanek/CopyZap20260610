/*
  # Create 8 Core Intents System

  1. Purpose
    - Expand intent system from 3 to 8 core decision intents
    - Create stable, descriptive intent identifiers
    - Enable intent selection across Copy Maker, Wizard, Templates, and post-actions
    - Support backwards compatibility with existing system

  2. New Tables
    - pmc_intents: Core intent definitions
      - id (text, primary key) - stable slug-like ID
      - label (text) - display name
      - description (text) - short explanation
      - sort_order (int) - display order
      - is_active (boolean) - enable/disable intents
      - created_at (timestamp)

  3. 8 Core Intents
    - positioning_first_impression: Hero/positioning copy
    - explanation_understanding: Clarification and education
    - persuasion_conversion: Decision and action-driving
    - commitment_trust: Risk reduction and confidence
    - short_form_attention: Scroll-stopping hooks
    - professional_update_authority: Professional, credible content
    - paid_promotion_compliance: Ad-safe, compliant language
    - evaluation_analysis: Critique, scoring, audits

  4. Security
    - Enable RLS on pmc_intents table
    - Public read access (all users can view intents)
    - Admin-only write access
*/

-- Create pmc_intents table
CREATE TABLE IF NOT EXISTS pmc_intents (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pmc_intents ENABLE ROW LEVEL SECURITY;

-- Public read access (all users can view intents)
CREATE POLICY "Anyone can view active intents"
  ON pmc_intents
  FOR SELECT
  USING (is_active = true);

-- Admin write access (using email check like other admin tables)
CREATE POLICY "Admin can manage intents"
  ON pmc_intents
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'rfv@datago.net');

-- Insert 8 core intents (upsert to avoid conflicts)
INSERT INTO pmc_intents (id, label, description, sort_order, is_active)
VALUES
  ('positioning_first_impression', 'Positioning / First Impression', 'Make the value obvious fast. Zero context. No hype.', 1, true),
  ('explanation_understanding', 'Explanation / Understanding', 'Clarify what it is and how it works. Informative, grounded.', 2, true),
  ('persuasion_conversion', 'Persuasion / Conversion', 'Help someone decide and take action. Specific, benefit-driven.', 3, true),
  ('commitment_trust', 'Commitment / Trust', 'Reduce risk and increase confidence. No invented guarantees.', 4, true),
  ('short_form_attention', 'Short-Form Attention', 'Scroll-stopping hooks. Tight, punchy, high signal.', 5, true),
  ('professional_update_authority', 'Professional Update / Authority', 'Credible, thoughtful, professional. No buzzwords.', 6, true),
  ('paid_promotion_compliance', 'Paid Promotion', 'Ad-safe, compliant language. No unverified claims.', 7, true),
  ('evaluation_analysis', 'Evaluation / Analysis', 'Critique, score, or audit. Factual, diagnostic.', 8, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_pmc_intents_sort_order ON pmc_intents(sort_order);
CREATE INDEX IF NOT EXISTS idx_pmc_intents_is_active ON pmc_intents(is_active);