import React from 'react';
import { Tooltip } from './ui/Tooltip';
import { Cpu, Sparkles, GitCompare } from 'lucide-react';

export type AiEngineMode = 'legacy' | 'enhanced' | 'both';

interface AiEngineModeToggleProps {
  aiEngineMode: AiEngineMode;
  onModeChange: (mode: AiEngineMode) => void;
}

const AiEngineModeToggle: React.FC<AiEngineModeToggleProps> = ({ aiEngineMode, onModeChange }) => {
  const options = [
    {
      value: 'legacy' as const,
      icon: Cpu,
      label: 'Legacy',
      tooltip: 'Current stable AI pipeline (default)',
      activeClass: 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
    },
    {
      value: 'enhanced' as const,
      icon: Sparkles,
      label: 'CopyZap+',
      tooltip: 'Enhanced AI pipeline with input expansion and editorial refinement (experimental)',
      activeClass: 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
    },
    {
      value: 'both' as const,
      icon: GitCompare,
      label: 'Both',
      tooltip: 'Run both pipelines and compare results side-by-side',
      activeClass: 'border-green-600 bg-green-50 dark:bg-green-900/20'
    }
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        AI Engine:
      </label>
      <div className="flex gap-3">
        {options.map(({ value, icon: Icon, label, tooltip, activeClass }) => (
          <Tooltip key={value} content={tooltip} delayDuration={300}>
            <label
              className={`
                relative flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 cursor-pointer
                transition-all duration-200
                ${aiEngineMode === value
                  ? `${activeClass} shadow-sm`
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
            >
              <input
                type="radio"
                name="aiEngineMode"
                value={value}
                checked={aiEngineMode === value}
                onChange={() => onModeChange(value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <Icon
                size={16}
                className={aiEngineMode === value
                  ? 'text-gray-800 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400'
                }
              />
              <span className={`text-sm font-medium ${
                aiEngineMode === value
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {label}
              </span>
            </label>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default AiEngineModeToggle;
