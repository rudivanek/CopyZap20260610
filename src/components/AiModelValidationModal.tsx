import React from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { Model } from '../types';

interface AvailableModel {
  model: Model;
  label: string;
  isAvailable: boolean;
}

interface AiModelValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: Model;
  selectedModelLabel: string;
  availableModels: AvailableModel[];
  onSelectModel: (model: Model) => void;
  errorMessage: string;
}

const AiModelValidationModal: React.FC<AiModelValidationModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  selectedModelLabel,
  availableModels,
  onSelectModel,
  errorMessage
}) => {
  if (!isOpen) return null;

  const workingModels = availableModels.filter(m => m.isAvailable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI Model Unavailable
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-red-600 dark:text-red-400 bg-white dark:bg-red-900/20 p-3 rounded-md">
              {errorMessage}
            </p>
          </div>

          {workingModels.length > 0 ? (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 font-medium">
                Available AI models:
              </p>
              <div className="space-y-2 mb-6">
                {workingModels.map((modelInfo) => (
                  <button
                    key={modelInfo.model}
                    onClick={() => {
                      onSelectModel(modelInfo.model);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {modelInfo.label}
                    </span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No AI models are currently available. Please check your API keys in the .env file.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiModelValidationModal;
