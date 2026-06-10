/*
  # Cleanup Empty Copy Sessions  1. Purpose
    - Remove sessions that were created but never used
    - These are sessions with no meaningful data (empty input_data, no output_type, no brief_description)
  
  2. What it does
    - Deletes copy sessions that have:
      - Empty input_data object {}
      - NULL output_type
      - NULL brief_description
    - These sessions were created automatically when Copy Maker mounted but no actual work was done
  
  3. Safety
    - Only deletes sessions with ALL three conditions met
    - Preserves sessions that have any meaningful data
    - Does not affect tokens_used tracking (foreign key handles cascade)
*/

-- Delete empty sessions that have no meaningful data
DELETE FROM pmc_copy_sessions
WHERE 
  input_data = '{}'::jsonb
  AND output_type IS NULL
  AND brief_description IS NULL;