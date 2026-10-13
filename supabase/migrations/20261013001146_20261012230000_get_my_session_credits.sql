/*
  # Credits used per Quick result

  Quick shows how many credits a result used (on the result screen and in
  History). Every AI call and page fetch is recorded in pmc_user_tokens_used
  with the run's session_id, so a result's credits are the sum of
  billable_units for its session.

  A database sum is used instead of reading rows in the browser, because
  Supabase returns at most 1,000 rows per read and a History page of 100
  results has about 3,000 usage rows.

  Security: runs with the caller's rights (SECURITY INVOKER), and also filters
  on auth.uid(), so a user, and an admin too, only ever gets their own usage.
  Not callable without login.
*/

CREATE OR REPLACE FUNCTION public.get_my_session_credits(p_session_ids uuid[])
RETURNS TABLE (session_id uuid, credits integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT u.session_id, COALESCE(SUM(u.billable_units), 0)::integer AS credits
  FROM public.pmc_user_tokens_used u
  WHERE u.session_id = ANY (p_session_ids)
    AND u.user_id = auth.uid()
  GROUP BY u.session_id;
$$;

REVOKE ALL ON FUNCTION public.get_my_session_credits(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_session_credits(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_session_credits(uuid[]) TO authenticated;
