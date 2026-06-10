/*
  # Add pmc_version_scores table

  ## Purpose
  Persist absolute scores (computed by the 5-dimension rubric in comparativeScoring.ts)
  for individual GeneratedContentItem versions. This allows scores to survive page
  refreshes and session restores without re-running the LLM scoring call.

  ## New Tables
  - `pmc_version_scores`
    - `version_id` (text, PK) — matches GeneratedContentItem.id (client-generated UUID)
    - `user_id` (uuid, FK auth.users) — for RLS
    - `session_id` (uuid, nullable, FK pmc_copy_sessions) — for grouping
    - `absolute_score` (integer) — 0-100, sum of five breakdown dimensions
    - `score_breakdown` (jsonb) — { clarity, persuasiveness, audienceFit, specificity, ctaStrength }
    - `scored_at` (timestamptz) — when the score was computed
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled; users can only read/write their own records
  - No public access

  ## Notes
  - version_id is a client-generated UUID string (not a DB-generated ID)
  - Upsert pattern: insert or update on conflict(version_id)
*/

CREATE TABLE IF NOT EXISTS pmc_version_scores (
  version_id    text        PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    uuid        REFERENCES pmc_copy_sessions(id) ON DELETE SET NULL,
  absolute_score integer    NOT NULL CHECK (absolute_score >= 0 AND absolute_score <= 100),
  score_breakdown jsonb     NOT NULL DEFAULT '{}',
  scored_at     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pmc_version_scores_user_id_idx ON pmc_version_scores(user_id);
CREATE INDEX IF NOT EXISTS pmc_version_scores_session_id_idx ON pmc_version_scores(session_id) WHERE session_id IS NOT NULL;

ALTER TABLE pmc_version_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own version scores"
  ON pmc_version_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own version scores"
  ON pmc_version_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own version scores"
  ON pmc_version_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own version scores"
  ON pmc_version_scores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
