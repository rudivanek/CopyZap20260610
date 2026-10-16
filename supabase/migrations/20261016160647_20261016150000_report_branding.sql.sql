/*
# Report branding for paid accounts

Allows paying accounts (active bought credits or admins) to put their own logo,
company name, and footer line on Quick's report export, replacing all CopyZap
branding. The active brand is stored per user; an RPC returns it (or NULL) so the
export code can swap it in only when allowed.

1. New Tables
- `report_branding`
  - `user_id` (uuid, primary key, defaults to the authenticated user) — one brand per account
  - `company_name` (text, not null) — shown in the report header next to the logo
  - `footer_line` (text, nullable) — one line shown at the bottom of the report
  - `logo_path` (text, nullable) — storage path of the uploaded logo in the `report-logos` bucket
  - `updated_at` (timestamptz, defaults to now())

2. New Functions
- `report_branding_active()` — returns the caller's active brand row (with a
  signed storage URL for the logo) when the caller is allowed to brand reports,
  otherwise NULL. Allowed means: the user has an active bought-credit balance
  (`get_prepaid_balance` credits_remaining > 0) OR is an admin (`is_admin()`).
  SECURITY DEFINER so it can read admin status and sign the storage URL.

3. Security
- RLS enabled on `report_branding`. Owner-scoped CRUD: each authenticated user
  can only read/insert/update/delete their own brand row.
- New private storage bucket `report-logos`. Storage policies allow each
  authenticated user to read/write/delete only objects under the path
  `<user_id>/...` in that bucket.

4. Important notes
- One brand row per account (primary key on `user_id`).
- The `report_branding_active()` RPC is the only thing the frontend calls to
  decide whether branding applies and to fetch the brand. When it returns NULL,
  the export uses the default CopyZap branding.
- Logos are stored as private objects; the RPC returns a signed URL so the
  browser can load the image only for the owning user.
- `is_admin()` already exists in this project (checks the JWT app_metadata role).
  `get_prepaid_balance(uuid)` already exists and returns json with
  `credits_remaining`.
*/

CREATE TABLE IF NOT EXISTS report_branding (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  footer_line text,
  logo_path text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE report_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_report_branding" ON report_branding;
CREATE POLICY "select_own_report_branding" ON report_branding FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_report_branding" ON report_branding;
CREATE POLICY "insert_own_report_branding" ON report_branding FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_report_branding" ON report_branding;
CREATE POLICY "update_own_report_branding" ON report_branding FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_report_branding" ON report_branding;
CREATE POLICY "delete_own_report_branding" ON report_branding FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Returns the caller's active report brand, with a signed logo URL, when the
-- caller is allowed to brand reports (active bought credits or admin). NULL
-- otherwise. SECURITY DEFINER so it can read admin status and sign URLs.
CREATE OR REPLACE FUNCTION public.report_branding_active()
RETURNS TABLE (
  company_name text,
  footer_line text,
  logo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_balance json;
  v_remaining numeric;
  v_brand report_branding%ROWTYPE;
  v_logo_url text;
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  SELECT public.get_prepaid_balance(v_user) INTO v_balance;
  v_remaining := COALESCE((v_balance->>'credits_remaining')::numeric, 0);

  IF v_remaining <= 0 AND public.is_admin() IS DISTINCT FROM true THEN
    RETURN;
  END IF;

  SELECT * INTO v_brand FROM public.report_branding WHERE user_id = v_user;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_logo_url := NULL;
  IF v_brand.logo_path IS NOT NULL THEN
    SELECT signed_url INTO v_logo_url
    FROM storage.create_signed_url('report-logos', v_brand.logo_path, 3600);
  END IF;

  RETURN QUERY SELECT v_brand.company_name, v_brand.footer_line, v_logo_url;
END;
$$;

-- Private bucket for user-uploaded report logos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-logos', 'report-logos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "report_logos_read_own" ON storage.objects;
CREATE POLICY "report_logos_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'report-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "report_logos_insert_own" ON storage.objects;
CREATE POLICY "report_logos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'report-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "report_logos_update_own" ON storage.objects;
CREATE POLICY "report_logos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'report-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'report-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "report_logos_delete_own" ON storage.objects;
CREATE POLICY "report_logos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'report-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
