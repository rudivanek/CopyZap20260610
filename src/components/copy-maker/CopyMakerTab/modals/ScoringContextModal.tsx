import React, { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';
import { Button } from '../../../ui/button';
import { ScoringContext, UseCaseKey } from '../../../../types';
import { loadFromStorage, saveToStorage, clearStorage, DEFAULT_USE_CASE_KEY, USE_CASE_OPTIONS } from '../../../../utils/scoringContextStorage';

interface ScoringContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ctx: ScoringContext) => void;
  initialContext?: ScoringContext;
  isChangeContext?: boolean;
}

const ScoringContextModal: React.FC<ScoringContextModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialContext,
  isChangeContext = false,
}) => {
  const [useCaseKey, setUseCaseKey] = useState<UseCaseKey>(DEFAULT_USE_CASE_KEY);
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const saved = loadFromStorage();
    const src = initialContext ?? saved;
    if (src) {
      setUseCaseKey(src.useCaseKey);
      if (src.useCaseKey === 'custom') {
        const predefined = USE_CASE_OPTIONS.find(o => o.key === src.useCaseKey);
        const isDerivedLabel = predefined && predefined.label === src.useCaseLabel;
        setCustomLabel(isDerivedLabel ? '' : src.useCaseLabel);
      } else {
        setCustomLabel('');
      }
    } else {
      setUseCaseKey(DEFAULT_USE_CASE_KEY);
      setCustomLabel('');
    }
  }, [isOpen, initialContext]);

  if (!isOpen) return null;

  const isCustom = useCaseKey === 'custom';
  const canConfirm = !isCustom || customLabel.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const optionLabel = USE_CASE_OPTIONS.find(o => o.key === useCaseKey)?.label ?? useCaseKey;
    const useCaseLabel = isCustom ? customLabel.trim() : optionLabel;
    const ctx: ScoringContext = { useCaseKey, useCaseLabel };
    saveToStorage(ctx);
    onConfirm(ctx);
  };

  const handleReset = () => {
    clearStorage();
    setUseCaseKey(DEFAULT_USE_CASE_KEY);
    setCustomLabel('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {isChangeContext ? 'Change Scoring Context' : 'Scoring Context'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              What is this copy for?
            </label>
            <select
              value={useCaseKey}
              onChange={e => { setUseCaseKey(e.target.value as UseCaseKey); setCustomLabel(''); }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              {USE_CASE_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            {isCustom && (
              <input
                type="text"
                placeholder="e.g., Funny, Luxury, Minimal…"
                value={customLabel}
                onChange={e => setCustomLabel(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                autoFocus
              />
            )}
          </div>

          {isChangeContext ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md px-3 py-2">
              Changing context requires a full re-score of all versions. You will confirm this in the next step.
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scoring context adjusts how dimensions are weighted. Your selection is saved and pre-filled next time.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between px-5 pb-5">
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-2"
          >
            Reset to default
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
            >
              {isChangeContext ? 'Set new context' : 'Analyze now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoringContextModal;
