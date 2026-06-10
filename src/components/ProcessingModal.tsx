import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  message?: string;
  onCancel: () => void;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  message = 'Processing...',
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <Loader2 size={48} className="text-primary-600 dark:text-primary-400 animate-spin" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {message}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This may take a few moments. Please wait...
          </p>

          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessingModal;
