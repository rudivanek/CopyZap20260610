/*
  # Total API cost of all users since a date (admin only)

  The Advanced Dashboard shows the API cost of all users in the current credit
  period. It used to read usage rows in the browser, which stops at 1,000 rows
  and undercounted (Oct 2026: $23.98 shown, $52.86 real). This sums in the
  database instead.

  Security: runs with the owner's rights so it can see every user's rows, and
  therefore checks the caller itself: it raises for anyone who is not an
  active app admin. Not callable without login.
*/

CREATE OR REPLACE FUNCTION public.admin_get_api_cost_since(p_since timestamptz)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN COALESCE(
    (SELECT SUM(cost_usd) FROM public.pmc_user_tokens_used WHERE created_at >= p_since),
    0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_api_cost_since(timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_api_cost_since(timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_get_api_cost_since(timestamptz) TO authenticated;
