/*
  # Update user_preferences table to use show_start_hub

  1. Changes
    - Add `show_start_hub` column (boolean, default true)
    - Migrate data from old `dismissed_start_hub` column
    - Drop old `dismissed_start_hub` and `dismissed_start_hub_at` columns

  2. Migration Logic
    - For existing users: `show_start_hub = NOT dismissed_start_hub`
    - For new users: `show_start_hub = true` (default)

  3. Notes
    - Preserves user preferences (users who dismissed it will have show_start_hub = false)
    - New users will see Start Hub by default
*/

-- Add the new column with default true
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS show_start_hub boolean DEFAULT true;

-- Migrate existing data: if user dismissed Start Hub, set show_start_hub to false
UPDATE user_preferences 
SET show_start_hub = NOT dismissed_start_hub 
WHERE dismissed_start_hub IS NOT NULL;

-- Drop the old columns
ALTER TABLE user_preferences 
DROP COLUMN IF EXISTS dismissed_start_hub,
DROP COLUMN IF EXISTS dismissed_start_hub_at;