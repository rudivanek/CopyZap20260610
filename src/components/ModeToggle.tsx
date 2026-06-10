import React from 'react';
import { useMode } from '../context/ModeContext';
import { Tooltip } from './ui/Tooltip';
import { Zap, Sliders, Info as InfoIcon } from 'lucide-react';

const ModeToggle: React.FC = () => {
  const { isSmartMode, toggleMode } = useMode();

  return (
    <div className="flex items-center justify-start mb-4">
      <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-1 flex">
        <Tooltip
          content="Smart Mode shows essential fields only. AI handles advanced setup for you. Perfect for quick, easy copy generation."
          delayDuration={300}
        >
          <button
            onClick={() => !isSmartMode && toggleMode()}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isSmartMode
                ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-500 shadow'
                : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-pressed={isSmartMode}
          >
            <Zap size={16} className="mr-1.5" />
            Smart Mode
          </button>
        </Tooltip>

        <Tooltip
          content="Expert Mode gives you full control over every field and setting. Perfect for power users who want precise control."
          delayDuration={300}
        >
          <button
            onClick={() => isSmartMode && toggleMode()}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isSmartMode
                ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-500 shadow'
                : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-pressed={!isSmartMode}
          >
            <Sliders size={16} className="mr-1.5" />
            Expert Mode
          </button>
        </Tooltip>
      </div>

      {/* Banner below toggle */}
      {isSmartMode && (
        <div className="ml-4 text-xs text-gray-600 dark:text-gray-400 italic flex items-center">
          <InfoIcon size={12} className="mr-1" />
          Essential fields only. Switch to Expert Mode for full control.
        </div>
      )}
    </div>
  );
};

export default ModeToggle;