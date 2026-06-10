/*
  # Add App Admins Allowlist System

  1. New Tables
    - `app_admins`
      - `email` (text, primary key) - Admin user email
      - `is_active` (boolean) - Whether admin access is currently active
      - `created_at` (timestamptz) - When admin was added

  2. Helper Functions
    - `is_app_admin()` - Returns true if current user is an active admin

  3. Security
    - Enable RLS on `app_admins` table
    - Only admins can view or modify the admin list

  4. Seed Data
    - Add rfv@datago.net as initial admin

  ## Purpose
  This migration centralizes admin access control into a database allowlist,
  replacing hardcoded email checks throughout the codebase. The is_app_admin()
  function becomes the single source of truth for admin status.
*/

-- Create app_admins table
CREATE TABLE IF NOT EXISTS public.app_admins (
  email text PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

-- Seed initial admin (idempotent)
INSERT INTO public.app_admins (email, is_active)
VALUES ('rfv@datago.net', true)
ON CONFLICT (email)
DO UPDATE SET is_active = EXCLUDED.is_active;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_admins
    WHERE email = (auth.jwt() ->> 'email')
      AND is_active = true
  );
$$;

-- RLS Policies for app_admins table
-- Only admins can view the admin list
CREATE POLICY "Admins can view admin list"
  ON public.app_admins
  FOR SELECT
  TO authenticated
  USING (public.is_app_admin());

-- Only admins can insert new admins
CREATE POLICY "Admins can add new admins"
  ON public.app_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());

-- Only admins can update admin records
CREATE POLICY "Admins can update admin records"
  ON public.app_admins
  FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Only admins can delete admin records
CREATE POLICY "Admins can delete admin records"
  ON public.app_admins
  FOR DELETE
  TO authenticated
  USING (public.is_app_admin());
