INSERT INTO llm_billing_rules (rule_name, cost_multiplier, usd_per_unit, min_units_per_call, rounding_mode, is_active, notes)
VALUES ('client_report_narrative', 1.0000, 0.010000, 1, 'up', true,
        'Single AI call producing the Spanish client report narrative (executive summary, findings, head-to-head notes, version labels). Economy model; short-form structured output.')
ON CONFLICT (rule_name) DO UPDATE SET
  cost_multiplier = EXCLUDED.cost_multiplier,
  usd_per_unit = EXCLUDED.usd_per_unit,
  min_units_per_call = EXCLUDED.min_units_per_call,
  rounding_mode = EXCLUDED.rounding_mode,
  is_active = EXCLUDED.is_active,
  notes = EXCLUDED.notes,
  updated_at = now();
