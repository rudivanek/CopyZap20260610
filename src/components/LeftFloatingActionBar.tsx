import React from 'react';
import { Save, CheckCircle2, BookmarkPlus } from 'lucide-react';

interface LeftFloatingActionBarProps {
  onSaveSession?: () => void;
  onSaveTemplate?: () => void;
  onEvaluateInputs?: () => void;
  isEvaluating?: boolean;
  hasContent?: boolean;
}

const LeftFloatingActionBar: React.FC<LeftFloatingActionBarProps> = ({
  onSaveSession,
  onSaveTemplate,
  onEvaluateInputs,
  isEvaluating = false,
  hasContent = false
}) => {
  return (
    <div className="fixed left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-40">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">

        {/* Evaluate Inputs Button */}
        {onEvaluateInputs && (
          <button
            onClick={onEvaluateInputs}
            disabled={isEvaluating}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Evaluate Inputs"
          >
            <CheckCircle2 size={14} className={`sm:w-[18px] sm:h-[18px] ${isEvaluating ? 'animate-pulse' : ''}`} />
          </button>
        )}

        {/* Save Session Button */}
        {onSaveSession && (
          <button
            onClick={onSaveSession}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Save Session"
          >
            <BookmarkPlus size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

        {/* Save as Template Button */}
        {onSaveTemplate && (
          <button
            onClick={onSaveTemplate}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Save as Template"
          >
            <Save size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

      </div>
    </div>
  );
};

export default LeftFloatingActionBar;
