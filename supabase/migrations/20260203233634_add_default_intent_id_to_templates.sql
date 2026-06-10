/*
  # Add Default Intent ID to Templates

  1. Changes
    - Adds `default_intent_id` column to `pmc_templates` table
    - This column stores the recommended intent for the template (optional)
    - No validation or enforcement - just metadata for UI convenience
    
  2. Purpose
    - When a user loads a template, the UI can auto-set intentId if not already set
    - Intent remains fully user-editable and overrideable
    - Intent guardrails continue to apply at generation time (no behavior change)
    
  3. Security
    - No RLS changes needed (inherits existing template policies)
*/

-- Add default_intent_id column to pmc_templates
ALTER TABLE pmc_templates 
ADD COLUMN IF NOT EXISTS default_intent_id text;

-- Add comment explaining the field
COMMENT ON COLUMN pmc_templates.default_intent_id IS 'Recommended intent ID for this template. User can override in Copy Form. Intent guardrails apply at generation time.';