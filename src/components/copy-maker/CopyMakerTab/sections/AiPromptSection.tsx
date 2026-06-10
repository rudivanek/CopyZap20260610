import React from 'react';
import { Lightbulb, Info as InfoIcon, Sparkles } from 'lucide-react';
import { Tooltip } from '../../../ui/Tooltip';
import { User, TabType } from '../../../../types';

interface AiPromptSectionProps {
  onOpenTemplateSuggestion: () => void;
  currentUser?: User;
  tab: TabType;
  onTabChange: (tab: TabType) => void;
}

const AiPromptSection: React.FC<AiPromptSectionProps> = ({
  onOpenTemplateSuggestion,
  currentUser,
  tab,
  onTabChange
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-900/10 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Prompt with AI
          </label>
          <Tooltip content="Use natural language to generate complete form configurations. Describe what you want and AI will automatically populate all relevant form fields with appropriate settings, saving time and ensuring optimal configurations.">
            <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <InfoIcon size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenTemplateSuggestion}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsActive(false);
        }}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        className="w-full text-white font-medium rounded-lg py-2 px-4 transition-all inline-flex items-center justify-center shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isActive ? '#cc552a' : isHovered ? '#e5602f' : '#ff6b35',
          gap: '6px'
        }}
        disabled={!currentUser}
      >
        <Sparkles size={16} />
        <span>Quick Prompt Wizard</span>
      </button>
      <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-2">
        <Lightbulb size={11} className="shrink-0 text-gray-300 dark:text-gray-600" />
        Fastest way to get your first result.
      </p>
    </div>
  );
};

export default AiPromptSection;