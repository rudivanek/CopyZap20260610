/*
# Admin Quick history: include the brief piece

Adds `brief_piece` to the admin_list_user_quick_results return table so an
admin browsing another user's Quick history can see the first line of the
brief, the same way the user does in their own History.

- brief_piece is the first brief field's value ("What you need"), read from
  output_data->'quick'->'briefRecord'->'fields'->0->>'value'. It is null for
  runs that did not start from a brief.
- admin_load_quick_result is unchanged (it already returns the whole row,
  which includes the full briefRecord).
- Security posture is unchanged: SECURITY DEFINER, search_path = 'public',
  is_app_admin() guard, REVOKE FROM PUBLIC/anon, GRANT TO authenticated.
*/

DROP FUNCTION IF EXISTS public.admin_list_user_quick_results(uuid);

CREATE FUNCTION public.admin_list_user_quick_results(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  created_at timestamptz,
  goal_key text,
  goal_label text,
  winner_score numeric,
  original_score numeric,
  source_host text,
  brief_piece text,
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
      o.output_data->'quick'->'briefRecord'->'fields'->0->>'value'  AS brief_piece,
      o.session_id
    FROM public.pmc_saved_outputs o
    WHERE o.user_id = p_user_id
      AND o.tags @> ARRAY['quick-app']::text[]
    ORDER BY o.created_at DESC
    LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_user_quick_results(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_user_quick_results(uuid) TO authenticated;
