import React, { useState } from 'react';
import { Tooltip } from './ui/Tooltip';
import { Zap, Layers, Settings, Info } from 'lucide-react';

export type FormMode = 'quick' | 'standard' | 'advanced';

interface FormModeToggleProps {
  mode: FormMode;
  onModeChange: (mode: FormMode) => void;
}

const FormModeToggle: React.FC<FormModeToggleProps> = ({ mode, onModeChange }) => {
  const [showLearnMore, setShowLearnMore] = useState(false);

  const getModeDescription = () => {
    switch (mode) {
      case 'quick':
        return 'Quick mode: shows fewer fields. Some fields may be hidden.';
      case 'standard':
        return 'Standard mode: balanced view. Some optional fields may be hidden.';
      case 'advanced':
        return 'Advanced mode: shows all fields.';
      default:
        return '';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-start gap-3">
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-1 flex">
          <Tooltip
            content="Best for beginners. Only essential fields."
            delayDuration={300}
          >
            <button
              onClick={() => onModeChange('quick')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'quick'
                  ? 'bg-gray-600 dark:bg-gray-300 text-white dark:text-gray-900 shadow'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-pressed={mode === 'quick'}
            >
              <Zap size={16} className="mr-1.5" />
              Quick
            </button>
          </Tooltip>

          <Tooltip
            content="Balanced. Most commonly used fields."
            delayDuration={300}
          >
            <button
              onClick={() => onModeChange('standard')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'standard'
                  ? 'bg-gray-600 dark:bg-gray-300 text-white dark:text-gray-900 shadow'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-pressed={mode === 'standard'}
            >
              <Layers size={16} className="mr-1.5" />
              Standard
            </button>
          </Tooltip>

          <Tooltip
            content="Full control. All fields visible."
            delayDuration={300}
          >
            <button
              onClick={() => onModeChange('advanced')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'advanced'
                  ? 'bg-gray-600 dark:bg-gray-300 text-white dark:text-gray-900 shadow'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-pressed={mode === 'advanced'}
            >
              <Settings size={16} className="mr-1.5" />
              Advanced
            </button>
          </Tooltip>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLearnMore(!showLearnMore)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setTimeout(() => setShowLearnMore(false), 200);
              }
            }}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
          >
            <Info size={14} />
            {getModeDescription()}
          </button>

          {showLearnMore && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                Understanding Modes
              </h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                <p>
                  <strong>What modes do:</strong> Modes control which fields you <em>see</em> in the form. They do not affect what is <em>saved</em>.
                </p>
                <p>
                  <strong>Hidden fields:</strong> When a field is hidden in Quick or Standard mode, it can still contain data. Switching to Advanced mode will reveal all fields.
                </p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li><strong>Quick:</strong> Shows ~13 essential fields</li>
                  <li><strong>Standard:</strong> Shows ~35 common fields</li>
                  <li><strong>Advanced:</strong> Shows all ~41 fields</li>
                </ul>
              </div>
              <button
                onClick={() => setShowLearnMore(false)}
                className="mt-3 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormModeToggle;
