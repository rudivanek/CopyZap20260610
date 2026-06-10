import React from 'react';
import { AiEngine } from '../../types';
import { AI_ENGINES } from '../../constants';
import { ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { cn } from '../../lib/utils';

interface AiEngineSelectorProps {
  value: AiEngine;
  onChange: (engine: AiEngine) => void;
  disabled?: boolean;
}

/**
 * Simplified AI Engine selector - dropdown with Claude and OpenAI
 * DeepSeek is internal fallback only and never shown
 */
const AiEngineSelector: React.FC<AiEngineSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const selectedEngine = AI_ENGINES.find(e => e.value === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-normal text-gray-500 dark:text-gray-400">
        AI Engine
      </label>

      <Select.Root value={value} onValueChange={(val) => onChange(val as AiEngine)} disabled={disabled}>
        <Select.Trigger
          className={cn(
            "w-full flex items-center justify-between border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Select.Value>
            {selectedEngine ? selectedEngine.label : 'Select AI Engine'}
          </Select.Value>
          <Select.Icon>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="z-50 min-w-[200px] overflow-hidden bg-white dark:bg-gray-900 rounded-md shadow-md border border-gray-300 dark:border-gray-700"
            position="popper"
            sideOffset={5}
          >
            <Select.Viewport className="p-1">
              {AI_ENGINES.map((engine) => (
                <Select.Item
                  key={engine.value}
                  value={engine.value}
                  className={cn(
                    "relative flex items-center px-8 py-2 text-sm rounded cursor-pointer outline-none",
                    "text-gray-900 dark:text-gray-100",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "focus:bg-gray-100 dark:focus:bg-gray-800",
                    "data-[state=checked]:bg-gray-100 dark:data-[state=checked]:bg-gray-800"
                  )}
                >
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                  <Select.ItemText>
                    <div>
                      <div className="font-medium">
                        {engine.label}
                        {engine.value === 'claude' && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Recommended)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {engine.helperText}
                      </div>
                    </div>
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        If your selected engine is unavailable, CopyZap will automatically fall back to an
        alternative model to ensure reliability.
      </p>
    </div>
  );
};

export default AiEngineSelector;
