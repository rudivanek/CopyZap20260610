-- Create a new migration to fix policies once and for all with a simplified approach

-- Create a more permissive policy for token usage tracking
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.pmc_user_tokens_usage;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.pmc_user_tokens_usage;

-- Create a very permissive policy for insert that doesn't check user email
CREATE POLICY "Enable insert for all authenticated users"
ON public.pmc_user_tokens_usage
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow any authenticated user to insert records

-- Create index for token usage date if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_tokens_usage_dates ON public.pmc_user_tokens_usage(usage_date);