import React, { useState, useRef, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Tooltip } from './Tooltip';
import { User } from '../../types';

interface SuggestionButtonProps {
  fieldType: string; // Made more generic to allow additional field types
  businessDescription: string;
  onGetSuggestion: (fieldType: string, currentUser?: User) => Promise<void>;
  isLoading?: boolean;
  currentUser?: User;
  isDisabled?: boolean;
}

const SuggestionButton: React.FC<SuggestionButtonProps> = ({
  fieldType,
  businessDescription,
  onGetSuggestion,
  isLoading = false,
  currentUser,
  isDisabled = false
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(async () => {
    if (isDisabled) {
      setTooltipVisible(true);
      setTimeout(() => setTooltipVisible(false), 3000);
      return;
    }

    if (!businessDescription.trim()) {
      setTooltipVisible(true);
      setTimeout(() => setTooltipVisible(false), 3000);
      return;
    }

    try {
      await onGetSuggestion(fieldType, currentUser);
    } catch (error) {
      console.error('Error in SuggestionButton:', error);
      toast.error('Failed to get suggestions. Please check your API keys and internet connection.');
    }
  }, [isDisabled, businessDescription, fieldType, onGetSuggestion, currentUser]);

  // Map field types to display labels
  const getFieldLabel = () => {
    const fieldLabels: Record<string, string> = {
      keyMessage: 'Key Message', 
      brandValues: 'Brand Values',
      callToAction: 'Call to Action',
      desiredEmotion: 'Desired Emotion',
      keywords: 'Keywords',
      context: 'Context',
      industryNiche: 'Industry/Niche',
      readerFunnelStage: "Reader's Stage in Funnel",
      preferredWritingStyle: 'Preferred Writing Style',
      targetAudiencePainPoints: 'Target Audience Pain Points',
      competitorCopyText: 'Competitor Copy'
    };
    
    return fieldLabels[fieldType] || fieldType;
  };

  // Error tooltip for when required fields are empty
  const errorTooltip = (
    <div className="absolute z-10 w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs rounded-md p-3 mt-2 -left-32 top-full shadow-lg border border-gray-300 dark:border-gray-700 animate-fadeIn">
      <div className="absolute w-3 h-3 bg-white dark:bg-gray-900 transform rotate-45 -mt-1.5 left-1/2 -ml-1.5 border-t border-l border-gray-300 dark:border-gray-700"></div>
      Please fill in Project Description, Product/Service Name, and {businessDescription.includes('originalCopy') ? 'Original Copy' : 'Business Description'} first.
    </div>
  );

  return (
    <div className="relative">
      <Tooltip content={isDisabled ? "Fill in all required fields first (Project Description, Product/Service Name, and content)" : `Get AI suggestions for ${getFieldLabel()}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          className={`p-1 transition-colors ${
            isDisabled
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'
          }`}
          disabled={isLoading || isDisabled}
          aria-label={`Get suggestions for ${getFieldLabel()}`}
        >
          {isLoading ? (
            "Loading..."
          ) : (
            <Zap size={20} />
          )}
        </button>
      </Tooltip>

      {tooltipVisible && errorTooltip}
    </div>
  );
};

export default SuggestionButton;