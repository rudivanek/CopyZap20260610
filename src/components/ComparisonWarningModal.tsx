import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface ComparisonWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  outputCount: number;
  recommendedMax?: number;
}

const ComparisonWarningModal: React.FC<ComparisonWarningModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  outputCount,
  recommendedMax = 5
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Large Number of Outputs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            You have <strong className="text-gray-900 dark:text-white">{outputCount} outputs</strong> selected for comparison.
            This may exceed credit limits or result in slower processing.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            For best results, we recommend comparing <strong>{recommendedMax} or fewer outputs</strong> at a time.
          </p>
        </div>

        <div className="p-6 border-t border-gray-300 dark:border-gray-800 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Go Back
          </Button>
          <Button
            onClick={() => {
              onClose();
              onProceed();
            }}
            className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white"
          >
            Proceed Anyway
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonWarningModal;
