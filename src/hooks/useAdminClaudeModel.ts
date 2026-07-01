/**
 * useAdminClaudeModel
 *
 * Admin-only hook for reading and writing the preferred Claude model.
 * Persists to localStorage under 'copyZap_adminClaudeModel'.
 * Drives comparativeScoring, report generation, and engine fallbacks.
 */

import { useState, useCallback } from 'react';
import { Model } from '../types';
import { CLAUDE_JUDGE_MODEL_OPTIONS, getAdminClaudeModel } from '../constants';

export function useAdminClaudeModel() {
  const [claudeModel, setClaudeModelState] = useState<Model>(getAdminClaudeModel);

  const setClaudeModel = useCallback((model: Model) => {
    try {
      localStorage.setItem('copyZap_adminClaudeModel', model);
    } catch { /* ignore */ }
    setClaudeModelState(model);
  }, []);

  return {
    claudeModel,
    setClaudeModel,
    options: CLAUDE_JUDGE_MODEL_OPTIONS,
  };
}
