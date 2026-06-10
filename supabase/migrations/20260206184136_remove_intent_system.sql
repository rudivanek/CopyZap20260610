/*
  # Remove Intent System

  1. Changes
    - Removes `default_intent_id` column from `pmc_templates` table
    - Drops `pmc_intents` table entirely
    
  2. Reason
    - Intent system was added to database but never implemented in frontend
    - Cleaning up unused database objects
    
  3. Data Safety
    - No user data is lost (only template metadata and reference table)
    - Templates remain fully functional without default_intent_id
*/

-- Remove default_intent_id column from templates
ALTER TABLE pmc_templates 
DROP COLUMN IF EXISTS default_intent_id;

-- Drop the intents table
DROP TABLE IF EXISTS pmc_intents CASCADE;
