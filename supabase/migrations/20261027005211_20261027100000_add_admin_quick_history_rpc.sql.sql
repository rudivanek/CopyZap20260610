/*
# Admin: view another user's Quick history and open their runs

1. Purpose
- Lets an admin browse a user's Quick history and open one of their saved
  runs exactly like opening their own, without changing any existing RLS
  policy on pmc_saved_outputs.
- Both functions are SECURITY DEFINER and call is_app_admin() first; a
  non-admin caller gets an exception and no rows.

2. New functions
- admin_list_user_quick_results(p_user_id uuid) -> summary rows
  Same columns listQuickResults selects, for the user's rows tagged
  'quick-app', newest first, limit 100. Read-only.
- admin_load_quick_result(p_result_id uuid) -> full pmc_saved_outputs row
  So the admin can open a foreign run with all report/export data.
  Read-only; the admin never writes to the other user's row through it.

3. Security
- SECURITY DEFINER, search_path = 'public'.
- REVOKE EXECUTE FROM PUBLIC, anon; GRANT EXECUTE TO authenticated.
- No changes to RLS policies or grants on pmc_saved_outputs.
- is_app_admin() is the existing check (migration 20260210163509).
*/

CREATE OR REPLACE FUNCTION public.admin_list_user_quick_results(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  created_at timestamptz,
  goal_key text,
  goal_label text,
  winner_score numeric,
  original_score numeric,
  source_host text,
  session_id uuid
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
    SELECT
      o.id,
      o.title,
      o.created_at,
      o.output_data->'quick'->>'goalKey'                            AS goal_key,
      o.input_data->>'quickGoalLabel'                               AS goal_label,
      NULLIF(o.output_data->'quick'->>'winnerScore',   '')::numeric AS winner_score,
      NULLIF(o.output_data->'quick'->>'originalScore', '')::numeric AS original_score,
      o.output_data->'quick'->'source'->>'host'                     AS source_host,
      o.session_id
    FROM public.pmc_saved_outputs o
    WHERE o.user_id = p_user_id
      AND o.tags @> ARRAY['quick-app']::text[]
    ORDER BY o.created_at DESC
    LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_load_quick_result(p_result_id uuid)
RETURNS public.pmc_saved_outputs
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.pmc_saved_outputs%ROWTYPE;
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT * INTO v_row
    FROM public.pmc_saved_outputs o
    WHERE o.id = p_result_id
      AND o.tags @> ARRAY['quick-app']::text[]
    LIMIT 1;
  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_user_quick_results(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_user_quick_results(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_load_quick_result(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_load_quick_result(uuid) TO authenticated;
