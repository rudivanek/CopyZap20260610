/*
  # Clean Template Names

  1. Changes
    - Remove leading whitespace and numbering prefixes from template_name column
    - Pattern removed: leading spaces + digits + ".) "
    - Example: " 11.) Google Ads" becomes "Google Ads"

  2. Process
    - Uses REGEXP_REPLACE to strip the pattern "^\s*\d+\.\)\s*"
    - Updates all rows in pmc_templates table
    - Only affects template_name field, all other columns remain unchanged

  3. Impact
    - Cleans up display of template names throughout the application
    - Does not affect template functionality or data integrity
    - Improves readability and consistency
*/

UPDATE pmc_templates
SET template_name = REGEXP_REPLACE(template_name, '^\s*\d+\.\)\s*', '', 'g')
WHERE template_name ~ '^\s*\d+\.\)\s*';
