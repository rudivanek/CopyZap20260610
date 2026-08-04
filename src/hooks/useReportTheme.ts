/**
 * useReportTheme Hook
 *
 * Loads the admin-customizable HTML report theme from the `report_theme_settings`
 * table, populates the module-level cache in supabaseClient (so the synchronous
 * export generator can read it without awaiting), and exposes a `saveTheme`
 * function for the admin editor.
 *
 * Falls back to DEFAULT_THEME_VARS from exportReportTheme.ts if no row exists
 * yet or the fetch errors.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, getReportTheme, saveReportTheme, setCachedReportTheme } from '../services/supabaseClient';
import { DEFAULT_THEME_VARS, type ThemeVars } from '../utils/exportReportTheme';

export interface UseReportThemeResult {
  themeVars: ThemeVars;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveTheme: (newVars: Partial<ThemeVars>) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useReportTheme(): UseReportThemeResult {
  const [themeVars, setThemeVars] = useState<ThemeVars>(DEFAULT_THEME_VARS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await getReportTheme();
    if (fetchError) {
      setError(fetchError.message || 'Failed to load theme');
      setThemeVars(DEFAULT_THEME_VARS);
      setCachedReportTheme(null);
    } else if (data) {
      setThemeVars(data);
    } else {
      setThemeVars(DEFAULT_THEME_VARS);
      setCachedReportTheme(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveTheme = useCallback(
    async (newVars: Partial<ThemeVars>) => {
      setIsSaving(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const msg = 'Not authenticated';
          setError(msg);
          return { success: false, error: msg };
        }
        const { data, error: saveError } = await saveReportTheme(user.id, newVars);
        if (saveError) {
          const msg = saveError.message || 'Failed to save theme';
          setError(msg);
          return { success: false, error: msg };
        }
        if (data) {
          setThemeVars(data);
        }
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return { themeVars, isLoading, isSaving, error, saveTheme, refresh: load };
}
