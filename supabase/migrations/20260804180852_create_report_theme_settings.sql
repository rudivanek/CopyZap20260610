/*
# Create report_theme_settings table

1. Purpose
   Stores a single, admin-editable JSON object (`theme_vars`) that customizes the
   visual design of CopyZap's HTML report exports (colors, fonts, weights, sizes).
   The export generator reads this row at export time and interpolates the values
   into the report's CSS `:root{}` block, so admins can rebrand every future
   export from inside the app — no code edit required.

2. New Tables
   - `public.report_theme_settings`
     - `id` (text, primary key, defaults to 'default') — single-row convention
     - `theme_vars` (jsonb, not null) — object of CSS custom property values
     - `updated_at` (timestamptz, default now())
     - `updated_by` (uuid, references auth.users(id)) — who last changed it

3. Security
   - Enable RLS on `report_theme_settings`.
   - SELECT is public (USING (true)) so the anon-key client used by the export
     generator (a synchronous, non-hook code path) can read the theme without
     requiring an authenticated session. The theme is presentation-only config,
     not user-private data, so world-readable is intentional.
   - INSERT and UPDATE are restricted to admins via the existing
     `public.is_app_admin()` SECURITY DEFINER function (added in migration
     20260210163509_add_app_admins_allowlist.sql). DELETE is intentionally not
     granted: the single row should always exist; "reset to defaults" is handled
     in app code by overwriting `theme_vars`, not by removing the row.

4. Idempotency
   - `CREATE TABLE IF NOT EXISTS`.
   - Policies are dropped before re-creation so re-running is safe even if the
     migration committed on a prior (timed-out) attempt.
*/

CREATE TABLE IF NOT EXISTS public.report_theme_settings (
  id text PRIMARY KEY DEFAULT 'default',
  theme_vars jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.report_theme_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including the anon-key export path) can read the theme.
DROP POLICY IF EXISTS "Anyone can read report theme settings" ON public.report_theme_settings;
CREATE POLICY "Anyone can read report theme settings"
  ON public.report_theme_settings FOR SELECT
  USING (true);

-- Only admins can create the single settings row.
DROP POLICY IF EXISTS "Admins can insert report theme settings" ON public.report_theme_settings;
CREATE POLICY "Admins can insert report theme settings"
  ON public.report_theme_settings FOR INSERT
  WITH CHECK (public.is_app_admin());

-- Only admins can update the settings row.
DROP POLICY IF EXISTS "Admins can update report theme settings" ON public.report_theme_settings;
CREATE POLICY "Admins can update report theme settings"
  ON public.report_theme_settings FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
