/**
 * useAdminClaudeModel
 *
 * Source of truth: Supabase app_settings table (key: 'claude_model').
 * All machines read from the same row — switching on one machine
 * is reflected everywhere on next load or refresh.
 *
 * localStorage ('copyZap_adminClaudeModel') is kept in sync as a fast
 * local cache so synchronous callers (getAdminClaudeModel) stay fresh
 * without an async call.
 *
 * RLS enforces admin-only writes at the database level — no UI bypass possible.
 */

import { useState, useCallback, useEffect } from 'react';
import { Model } from '../types';
import { CLAUDE_JUDGE_MODEL_OPTIONS, getAdminClaudeModel } from '../constants';
import { supabase } from '../services/supabaseClient';

const SETTING_KEY = 'claude_model';
const LS_KEY = 'copyZap_adminClaudeModel';

function isValidModel(value: string | null): value is 'claude-sonnet-4-6' | 'claude-sonnet-5' {
  return value === 'claude-sonnet-4-6' || value === 'claude-sonnet-5';
}

export function useAdminClaudeModel() {
  const [claudeModel, setClaudeModelState] = useState<Model>(getAdminClaudeModel());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', SETTING_KEY)
          .single();

        if (cancelled) return;

        if (!error && data && isValidModel(data.value)) {
          setClaudeModelState(data.value);
          try { localStorage.setItem(LS_KEY, data.value); } catch { /* ignore */ }
        }
      } catch {
        console.warn('[useAdminClaudeModel] Could not reach Supabase, using cached model');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchFromSupabase();
    return () => { cancelled = true; };
  }, []);

  const setClaudeModel = useCallback(async (model: Model) => {
    if (!isValidModel(model)) return;

    setClaudeModelState(model);
    try { localStorage.setItem(LS_KEY, model); } catch { /* ignore */ }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          {
            key: SETTING_KEY,
            value: model,
            updated_at: new Date().toISOString(),
            updated_by: user?.email ?? 'unknown',
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.error('[useAdminClaudeModel] Supabase write rejected:', error.message);
      }
    } catch (err) {
      console.error('[useAdminClaudeModel] Failed to persist model:', err);
    }
  }, []);

  return {
    claudeModel,
    setClaudeModel,
    isLoading,
    options: CLAUDE_JUDGE_MODEL_OPTIONS,
  };
}
