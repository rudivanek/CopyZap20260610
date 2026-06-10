import React, { createContext, useContext, useState, useRef } from 'react';
import { logAutoApply } from '../utils/debugAutoApply';

export type FormMode = 'quick' | 'standard' | 'advanced';

export type ForceAdvancedReason =
  | 'template_load'
  | 'wizard_apply'
  | 'wizard_generate'
  | 'session_load'
  | 'prefill_load';

type ModeContextType = {
  mode: FormMode; // Current UI mode
  preferredMode: FormMode; // User's persisted preference
  setMode: (mode: FormMode) => void;
  forceAdvanced: (reason: ForceAdvancedReason, details?: string) => void;
  restoreSavedOutputMode: (savedMode: FormMode) => void;
  lastForcedReason: { reason: ForceAdvancedReason; details?: string; previousMode: FormMode } | null;
  dismissForcedExplanation: () => void;
};

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize preferredMode from localStorage (user's personal preference)
  const [preferredMode, setPreferredMode] = useState<FormMode>(() => {
    const savedMode = localStorage.getItem('copyZap_formMode');
    if (savedMode === 'quick' || savedMode === 'standard' || savedMode === 'advanced') {
      return savedMode as FormMode;
    }
    return 'standard';
  });

  // Current UI mode (may differ temporarily from preferredMode)
  const [mode, setModeState] = useState<FormMode>(preferredMode);

  // Track the last forced Advanced reason (for showing explanation banner)
  const [lastForcedReason, setLastForcedReason] = useState<{ reason: ForceAdvancedReason; details?: string; previousMode: FormMode } | null>(null);

  // setMode: User intentionally changes mode via toggle - this is the ONLY way to change preferredMode
  const setMode = (newMode: FormMode) => {
    logAutoApply({
      ruleId: 'CM-AUTO-012',
      target: 'localStorage',
      before: preferredMode,
      after: newMode,
      source: 'user_mode_toggle',
      context: { storageKey: 'copyZap_formMode', intentional: true }
    });

    // Update both preferred mode (persist) and current mode (UI)
    localStorage.setItem('copyZap_formMode', newMode);
    setPreferredMode(newMode);
    setModeState(newMode);

    // Clear forced explanation when user manually changes mode
    setLastForcedReason(null);
  };

  // forceAdvanced: System temporarily forces Advanced mode for data safety (templates/wizard/sessions)
  // DOES NOT change preferredMode - only affects currentMode temporarily
  const forceAdvanced = (reason: ForceAdvancedReason, details?: string) => {
    if (mode === 'advanced') {
      // Already in Advanced, no need to force
      return;
    }

    logAutoApply({
      ruleId: 'CM-AUTO-015',
      target: 'mode',
      before: mode,
      after: 'advanced',
      source: 'force_advanced_temporary',
      context: { reason, details, previousMode: mode, preferredModeUnchanged: preferredMode }
    });

    // Store previous mode for "switch back" functionality (which will go back to preferredMode)
    setLastForcedReason({ reason, details, previousMode: preferredMode });

    // Switch currentMode to Advanced ONLY (do NOT persist to localStorage)
    setModeState('advanced');
  };

  // restoreSavedOutputMode: Restore the frozen mode from a saved output (not a safety trigger)
  const restoreSavedOutputMode = (savedMode: FormMode) => {
    logAutoApply({
      ruleId: 'CM-AUTO-016',
      target: 'mode',
      before: mode,
      after: savedMode,
      source: 'restore_saved_output_mode',
      context: { savedMode, preferredModeUnchanged: preferredMode }
    });

    // Set currentMode to the saved output's mode WITHOUT triggering forced explanation
    // This is a frozen artifact restoration, not a safety trigger
    setModeState(savedMode);
    setLastForcedReason(null); // No banner for saved output restoration
  };

  // dismissForcedExplanation: User dismisses the explanation banner
  const dismissForcedExplanation = () => {
    setLastForcedReason(null);
  };

  return (
    <ModeContext.Provider value={{
      mode,
      preferredMode,
      setMode,
      forceAdvanced,
      restoreSavedOutputMode,
      lastForcedReason,
      dismissForcedExplanation
    }}>
      {children}
    </ModeContext.Provider>
  );
};

// Custom hook to use the mode context
export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};
