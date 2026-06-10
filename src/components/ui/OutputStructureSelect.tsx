import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { cn } from '../../lib/utils';

interface OutputStructureSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const outputStructureOptions = [
  { value: 'none', label: 'No specific structure' },
  { value: 'structured', label: 'Structured (with clear subheadings)' },
  { value: 'paragraphs', label: 'Simple paragraphs' },
  { value: 'bullets', label: 'Bullet points' },
  { value: 'numbered', label: 'Numbered list' },
  { value: 'qaFormat', label: 'Q&A format' },
];

const OutputStructureSelect: React.FC<OutputStructureSelectProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger
          className="w-full flex items-center justify-between border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
        >
          <Select.Value placeholder="Select a structure format" />
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
              {outputStructureOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      
      {value === 'structured' && (
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900/50">
          <p className="font-medium mb-1">Will include:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Main headline</li>
            <li>Clear subheadings</li>
            <li>Organized body paragraphs</li>
            <li>Benefits/features section</li>
            <li>Final call to action</li>
          </ul>
        </div>
      )}
      
      {value === 'bullets' && (
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900/50">
          <p className="font-medium mb-1">Will format with:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Introduction paragraph</li>
            <li>Key points as bullet points</li>
            <li>Benefits as bullet points</li>
            <li>Closing paragraph with call to action</li>
          </ul>
        </div>
      )}
      
      {value === 'numbered' && (
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900/50">
          <p className="font-medium mb-1">Will format with:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Introduction paragraph</li>
            <li>Steps or key points in numbered format</li>
            <li>Closing paragraph with call to action</li>
          </ul>
        </div>
      )}
      
      {value === 'qaFormat' && (
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900/50">
          <p className="font-medium mb-1">Will format as:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Introduction</li>
            <li>Series of questions and answers</li>
            <li>Common questions related to the topic</li>
            <li>Final question leading to call to action</li>
          </ul>
        </div>
      )}
    </div>
  );
};

const SelectItem = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; value: string }
>(({ children, value, ...props }, ref) => {
  return (
    <Select.Item
      ref={ref}
      value={value}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 dark:focus:bg-gray-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      )}
      {...props}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
        <Check className="h-4 w-4" />
      </Select.ItemIndicator>
    </Select.Item>
  );
});

SelectItem.displayName = "SelectItem";

export default OutputStructureSelect;