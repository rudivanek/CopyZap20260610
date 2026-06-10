import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { ScoringContext } from '../types';

interface RegenerateAnalysisModalProps {
  isOpen: boolean;
  onConfirm: (context?: ScoringContext) => void;
  onCancel: () => void;
  outputCount: number;
}

/**
 * Modal that asks the user if they want to regenerate analysis when adding new outputs.
 * Scoring context now comes from formState.section — no manual selection needed here.
 */
export const RegenerateAnalysisModal: React.FC<RegenerateAnalysisModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  outputCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generate New Analysis?
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            You have <span className="font-semibold text-gray-900 dark:text-white">{outputCount} new output{outputCount !== 1 ? 's' : ''}</span> ready to be analyzed.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
            Would you like to generate a new comparison analysis with {outputCount === 1 ? 'this output' : 'these outputs'}?
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            No, Skip
          </button>
          <button
            onClick={() => onConfirm()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Yes, Generate
          </button>
        </div>
      </div>
    </div>
  );
};
