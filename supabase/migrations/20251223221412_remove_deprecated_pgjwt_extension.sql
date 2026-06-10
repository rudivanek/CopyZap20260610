/*
  # Remove Deprecated pgjwt Extension
  
  ## Overview
  The pgjwt extension is deprecated and not supported in newer versions of PostgreSQL.
  Supabase now uses the built-in auth.jwt() function instead of pgjwt functions.
  
  ## Changes
  - Drop the pgjwt extension from the extensions schema
  - This removes 6 functions: url_encode, url_decode, algorithm_sign, sign, verify, try_cast_double
  
  ## Safety
  - Verified that no custom functions or migrations use pgjwt functions
  - Supabase Auth uses its own built-in JWT handling (auth.jwt())
  - Our application does not depend on this extension
  
  ## Why This Is Needed
  - Required before upgrading to newer Postgres versions
  - The extension is marked as "Deprecated" by Supabase
  - Modern Postgres versions do not support this extension
*/

-- Drop the deprecated pgjwt extension
DROP EXTENSION IF EXISTS pgjwt CASCADE;