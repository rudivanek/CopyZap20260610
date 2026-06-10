/*
  # Drop deprecated pmc_user_tokens_usage table

  1. Changes
    - Drops the old `pmc_user_tokens_usage` table which has been replaced by `pmc_user_tokens_used`
    - This table is no longer used by the application
    - All token tracking now uses the `pmc_user_tokens_used` table via the track-tokens edge function

  2. Notes
    - Historical data from this table (1,824 records) will be permanently deleted
    - The `saveTokenUsage()` function in supabaseClient.ts that referenced this table is deprecated and not called anywhere
*/

DROP TABLE IF EXISTS pmc_user_tokens_usage;
