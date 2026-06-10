/*
  # Token usage summary function
  
  1. New Functions
    - `get_token_usage_summary` - Calculates total tokens and cost for a user
  
  2. Purpose
    - Provides a server-side function to efficiently calculate token usage statistics
    - Reduces network traffic by performing aggregation on the server
    - Returns total tokens and cost for the specified user
*/

-- Create a function to get token usage summary for a user
CREATE OR REPLACE FUNCTION public.get_token_usage_summary(user_email_param TEXT)
RETURNS TABLE (
  total_tokens BIGINT,
  total_cost NUMERIC(12, 6)
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    COALESCE(SUM(token_usage), 0) as total_tokens,
    COALESCE(SUM(token_cost), 0.00) as total_cost
  FROM 
    pmc_user_tokens_usage
  WHERE 
    user_email = user_email_param;
$$;

-- Set appropriate permissions for the function
ALTER FUNCTION public.get_token_usage_summary(TEXT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_token_usage_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_token_usage_summary(TEXT) TO service_role;