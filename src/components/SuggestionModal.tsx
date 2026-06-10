import React, { memo, useState } from 'react';
import { X, ArrowRight, Check, Loader2 } from 'lucide-react';

interface SuggestionModalProps {
  fieldType: string;
  suggestions: string[];
  onClose: () => void;
  onInsert: (suggestions: string[]) => void;
  isLoading?: boolean;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({
  fieldType,
  suggestions,
  onClose,
  onInsert,
  isLoading = false
}) => {
  // State to track selected suggestions
  const [selected, setSelected] = useState<string[]>([]);

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

  // Handle checkbox change
  const handleCheckboxChange = (suggestion: string) => {
    setSelected(prev => 
      prev.includes(suggestion) 
        ? prev.filter(item => item !== suggestion) 
        : [...prev, suggestion]
    );
  };

  // Handle insert selected suggestions
  const handleInsertSelected = () => {
    if (selected.length > 0) {
      onInsert(selected);
      setSelected([]); // Reset selections after inserting
    }
  };

  // Select all suggestions
  const handleSelectAll = () => {
    if (selected.length === suggestions.length) {
      setSelected([]); // Deselect all if all are already selected
    } else {
      setSelected([...suggestions]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/70 z-50 flex items-center justify-center p-4 pb-20">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Suggested {fieldLabels[fieldType] || fieldType}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 size={48} className="text-primary-500 animate-spin mb-4" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Generating suggestions...</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This may take a few moments</p>
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center p-4">No suggestions available</p>
          ) : (
            <>
              {/* Select all checkbox */}
              <div className="flex items-center mb-4 pb-2 border-b border-gray-300 dark:border-gray-800">
                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary-500 focus:ring-primary-500"
                    checked={selected.length === suggestions.length && suggestions.length > 0}
                    onChange={handleSelectAll}
                  />
                  {selected.length === suggestions.length && suggestions.length > 0 
                    ? 'Deselect All' 
                    : 'Select All'}
                </label>
                <span className="ml-auto text-xs text-gray-500">
                  {selected.length} of {suggestions.length} selected
                </span>
              </div>
              
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="bg-gray-100 dark:bg-gray-800 rounded-md p-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`suggestion-${index}`}
                        checked={selected.includes(suggestion)}
                        onChange={() => handleCheckboxChange(suggestion)}
                        className="mr-3 h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-500 focus:ring-primary-500"
                      />
                      <label 
                        htmlFor={`suggestion-${index}`}
                        className="text-gray-700 dark:text-gray-200 cursor-pointer flex-grow"
                      >
                        {suggestion}
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-300 dark:border-gray-800 flex justify-between">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleInsertSelected}
            disabled={selected.length === 0 || isLoading}
            className={`flex items-center ${selected.length === 0 || isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-500' : 'bg-primary-600 hover:bg-primary-500 text-white'} px-4 py-2 rounded text-sm`}
          >
            <Check size={16} className="mr-1.5" />
            Insert Selected ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(SuggestionModal);