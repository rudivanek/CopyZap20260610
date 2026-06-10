import React from 'react';
import { toast } from 'react-hot-toast';
import { Info as InfoIcon } from 'lucide-react';
import { Tooltip } from '../../../ui/Tooltip';
import { FormState } from '../../../../types';
import { GROUPED_PREFILLS } from '../../../../constants/prefills';

interface QuickStartPickerProps {
  formState: FormState;
  onApplyPrefill: (prefill: { id: string; label: string; data: Partial<FormState> }) => void;
}
 
const QuickStartPicker: React.FC<QuickStartPickerProps> = ({
  formState,
  onApplyPrefill
}) => {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <label htmlFor="quickStartSelection" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Load Quick Start Template
          </label>
          <Tooltip content="Choose from pre-configured templates for common content types like blog posts, ad copy, email content, landing pages, and more. Each template includes optimized settings for tone, word count, output structure, and targeting that work best for that specific content type. Perfect for getting started quickly with proven configurations.">
            <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <InfoIcon size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="mb-4">
        <select
          id="quickStartSelection"
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
          onChange={(e) => {
            if (e.target.value) {
              // Find the prefill across all groups
              let selectedPrefill = null;
              for (const group of GROUPED_PREFILLS) {
                const found = group.options.find(prefill => prefill.id === e.target.value);
                if (found) {
                  selectedPrefill = found;
                  break;
                }
              }
              
              if (selectedPrefill) {
                onApplyPrefill({
                  id: selectedPrefill.id,
                  label: selectedPrefill.label,
                  data: selectedPrefill.data
                });
                toast.success(`Applied "${selectedPrefill.label}" template`);
              }
            }
          }}
          value=""
        >
          <option value="">— Choose a Content Type —</option>
          {GROUPED_PREFILLS.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.options.map((prefill) => (
                <option key={prefill.id} value={prefill.id}>
                  {prefill.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
};

export default QuickStartPicker;