
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read all settings
CREATE POLICY "admin_select_app_settings" ON app_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_admins
      WHERE app_admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can insert settings
CREATE POLICY "admin_insert_app_settings" ON app_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_admins
      WHERE app_admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can update settings
CREATE POLICY "admin_update_app_settings" ON app_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_admins
      WHERE app_admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_admins
      WHERE app_admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can delete settings
CREATE POLICY "admin_delete_app_settings" ON app_settings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_admins
      WHERE app_admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Seed default value
INSERT INTO app_settings (key, value, updated_at, updated_by)
VALUES ('claude_model', 'claude-sonnet-4-6', NOW(), 'system')
ON CONFLICT (key) DO NOTHING;
