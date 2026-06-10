import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  onCancel?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Generating content...',
  onCancel
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-xl flex flex-col items-center">
        {/* Loading spinner with orange-to-coral gradient */}
        <svg className="w-16 h-16 mb-4 animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spinnerGradientOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" />
              <stop offset="100%" stopColor="#ffa07a" />
            </linearGradient>
          </defs>
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="url(#spinnerGradientOverlay)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="90, 150"
            strokeDashoffset="0"
          />
        </svg>

        {/* Loading message */}
        <div className="text-gray-800 dark:text-gray-200 text-lg font-medium text-center mb-4">
          {message}
        </div>

        {/* Cancel button (optional) */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;