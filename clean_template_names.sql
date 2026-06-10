-- Clean Template Names Migration
-- Removes leading whitespace and numbering prefixes like " 11.) " from template names

UPDATE pmc_templates
SET template_name = REGEXP_REPLACE(template_name, '^\s*\d+\.\)\s*', '', 'g')
WHERE template_name ~ '^\s*\d+\.\)\s*';

-- Verify the changes
SELECT id, template_name FROM pmc_templates ORDER BY template_name LIMIT 20;
