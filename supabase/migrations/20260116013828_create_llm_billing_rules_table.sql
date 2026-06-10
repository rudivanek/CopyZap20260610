/*
  # Create LLM Billing Rules Table

  ## Purpose
  Stores conversion rules for transforming estimated USD LLM costs into billable units/credits
  for monthly subscription usage tracking. Allows rule adjustments without code redeployment.

  ## Schema
  - id: UUID primary key
  - rule_name: Unique identifier (e.g., 'default', 'enterprise')
  - cost_multiplier: Safety buffer (e.g., 1.30 = 30% markup)
  - usd_per_unit: Internal cost per billable unit (e.g., 0.010000 = $0.01)
  - min_units_per_call: Minimum units charged per API call
  - rounding_mode: How to round calculated units ('ceil', 'floor', 'round')
  - is_active: Whether this rule is currently active
  - effective_from: When this rule version became effective
  - notes: Optional description
  - created_at, updated_at: Timestamps

  ## Security (RLS)
  - SELECT: All authenticated users can read rules
  - INSERT/UPDATE/DELETE: Only rfv@datago.net can modify

  ## Seed Data
  - One default rule with 30% cost buffer, $0.01 per unit, ceil rounding
  
  ## Idempotency
  - Safe to run multiple times
  - Uses IF NOT EXISTS and ON CONFLICT
*/

-- 1) Create the table
CREATE TABLE IF NOT EXISTS llm_billing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  cost_multiplier NUMERIC(10,4) NOT NULL,
  usd_per_unit NUMERIC(10,6) NOT NULL,
  min_units_per_call INTEGER NOT NULL DEFAULT 1,
  rounding_mode TEXT NOT NULL DEFAULT 'ceil',
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Create index for active rule lookups
CREATE INDEX IF NOT EXISTS idx_llm_billing_rules_active
ON llm_billing_rules (rule_name)
WHERE is_active = true;

-- 3) Create updated_at trigger function and trigger
CREATE OR REPLACE FUNCTION set_updated_at_llm_billing_rules()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_llm_billing_rules ON llm_billing_rules;

CREATE TRIGGER trg_set_updated_at_llm_billing_rules
BEFORE UPDATE ON llm_billing_rules
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_llm_billing_rules();

-- 4) Enable RLS and create policies
ALTER TABLE llm_billing_rules ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
DROP POLICY IF EXISTS "llm_billing_rules_read_authenticated" ON llm_billing_rules;
CREATE POLICY "llm_billing_rules_read_authenticated"
ON llm_billing_rules
FOR SELECT
TO authenticated
USING (true);

-- Write access only for rfv@datago.net (covers INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "llm_billing_rules_write_admin_email" ON llm_billing_rules;
CREATE POLICY "llm_billing_rules_write_admin_email"
ON llm_billing_rules
FOR ALL
TO authenticated
USING ((auth.jwt()->>'email') = 'rfv@datago.net')
WITH CHECK ((auth.jwt()->>'email') = 'rfv@datago.net');

-- 5) Seed default billing rule (idempotent)
INSERT INTO llm_billing_rules
(rule_name, cost_multiplier, usd_per_unit, min_units_per_call, rounding_mode, is_active, effective_from, notes)
VALUES
(
  'default',
  1.30,
  0.010000,
  1,
  'ceil',
  true,
  now(),
  'Default billing rule for converting estimated USD cost into billable units'
)
ON CONFLICT (rule_name) DO UPDATE SET
  cost_multiplier = EXCLUDED.cost_multiplier,
  usd_per_unit = EXCLUDED.usd_per_unit,
  min_units_per_call = EXCLUDED.min_units_per_call,
  rounding_mode = EXCLUDED.rounding_mode,
  is_active = EXCLUDED.is_active,
  effective_from = EXCLUDED.effective_from,
  notes = EXCLUDED.notes;
