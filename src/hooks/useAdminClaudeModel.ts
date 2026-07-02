/**
 * useAdminClaudeModel
 *
 * Admin-only hook for reading and writing the preferred Claude model.
 * Persists to localStorage under 'copyZap_adminClaudeModel'.
 * Drives comparativeScoring, report generation, and engine fallbacks.
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
        console.warn('[useAdminClaudeModel] Supabase unreachable — using cached value');
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
        .update({
          value: model,
          updated_at: new Date().toISOString(),
          updated_by: user?.email ?? 'unknown',
        })
        .eq('key', SETTING_KEY);

      if (error) {
        console.error('[useAdminClaudeModel] Supabase write failed:', error.message);
        const { toast } = await import('react-hot-toast');
        toast.error(`Failed to save model setting: ${error.message}`, { duration: 5000 });
      }
    } catch (err) {
      console.error('[useAdminClaudeModel] Failed to persist model to Supabase:', err);
    }
  }, []);

  return {
    claudeModel,
    setClaudeModel,
    isLoading,
    options: CLAUDE_JUDGE_MODEL_OPTIONS,
  };
}
