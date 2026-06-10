/*
  # Update pmc_copy_sessions table to support structured JSON output
  
  1. Changes
     - Alter `improved_copy` and `alternative_copy` columns to use JSONB data type
     - This allows storing structured copy output with sections and formatting
     
  2. Purpose
     - Support richer content structure with headlines, sections, and list items
     - Enable better rendering of generated content in the UI
     - Preserve formatting and structure information for improved user experience
*/

-- First create a backup of the data
CREATE TABLE IF NOT EXISTS pmc_copy_sessions_backup AS
SELECT * FROM pmc_copy_sessions;

-- Add temporary columns to store the converted data
ALTER TABLE pmc_copy_sessions
ADD COLUMN improved_copy_jsonb JSONB,
ADD COLUMN alternative_copy_jsonb JSONB;

-- Copy data from text columns to JSONB columns, attempting to parse as JSON first
UPDATE pmc_copy_sessions
SET 
  improved_copy_jsonb = 
    CASE 
      WHEN improved_copy ~ '^\\s*\\{.*\\}\\s*$' THEN -- Check if it looks like JSON
        (improved_copy)::JSONB 
      ELSE 
        jsonb_build_object('headline', 'Copy', 'sections', jsonb_build_array(jsonb_build_object('title', 'Content', 'content', improved_copy)))
    END,
  alternative_copy_jsonb = 
    CASE 
      WHEN alternative_copy IS NOT NULL AND alternative_copy ~ '^\\s*\\{.*\\}\\s*$' THEN -- Check if it looks like JSON
        (alternative_copy)::JSONB 
      WHEN alternative_copy IS NOT NULL THEN
        jsonb_build_object('headline', 'Alternative Copy', 'sections', jsonb_build_array(jsonb_build_object('title', 'Content', 'content', alternative_copy)))
      ELSE
        NULL
    END;

-- Drop the original columns
ALTER TABLE pmc_copy_sessions
DROP COLUMN improved_copy,
DROP COLUMN alternative_copy;

-- Rename the JSONB columns back to the original names
ALTER TABLE pmc_copy_sessions
RENAME COLUMN improved_copy_jsonb TO improved_copy;

ALTER TABLE pmc_copy_sessions
RENAME COLUMN alternative_copy_jsonb TO alternative_copy;

-- Add a comment to explain the column data structure
COMMENT ON COLUMN pmc_copy_sessions.improved_copy IS 'Structured copy output as JSONB with headline and sections';
COMMENT ON COLUMN pmc_copy_sessions.alternative_copy IS 'Alternative structured copy output as JSONB with headline and sections';