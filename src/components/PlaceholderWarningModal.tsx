import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface PlaceholderWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  examples: string[];
}

const PlaceholderWarningModal: React.FC<PlaceholderWarningModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  examples
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" size={24} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Placeholder Text Detected
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Your form contains bracketed placeholder text that should be replaced with your specific details:
          </p>

          {examples.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Examples found:
              </p>
              <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                {examples.map((example, index) => (
                  <li key={index} className="font-mono">• {example}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
            Replace bracketed placeholders like <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">[enter your issue]</span> or <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">[your product]</span> with your actual content before generating.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
            >
              Go Back and Edit
            </button>
            <button
              onClick={onContinue}
              className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              Generate Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderWarningModal;
