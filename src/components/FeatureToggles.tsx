import React, { useState, useEffect } from 'react';
import { FormData } from '../types';
import { Tooltip } from './ui/Tooltip';
import { Info as InfoIcon, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useMemo } from 'react';
import { useInputField } from '../hooks/useInputField';
import { toast } from 'react-hot-toast';
import { countFilledFieldsInSection } from '../utils/formUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { FormMode } from '../context/ModeContext';
import CollapsibleSection from './ui/CollapsibleSection';
import { WorkflowSelector } from './ui/WorkflowSelector';

interface FeatureTogglesProps {
  formData: FormData;
  handleToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange: (name: string, value: any) => void;
  mode: FormMode;
  expandedSections?: Record<string, boolean>;
  onToggleSection?: (key: string) => void;
  currentUserId?: string;
}

const FeatureToggles: React.FC<FeatureTogglesProps> = ({
  formData,
  handleToggle,
  handleChange,
  mode,
  expandedSections = {},
  onToggleSection,
  currentUserId
}) => {
  // Initialize locationField using useInputField hook
  const locationField = useInputField({
    value: formData.location || '',
    onChange: (value: string) => {
      handleChange('location', value);
    }
  });

  // Wrapper for standard HTML elements that pass event objects
  const handleChangeEvent = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    handleChange(e.target.name, e.target.value);
  };

  // This component is always displayed regardless of form mode
  
  // Calculate if the current word count target is "little" (below 100 words)
  const isLittleWordCount = useMemo(() => {
    if (formData.wordCount === 'Custom') {
      return (formData.customWordCount || 0) < 100;
    }

    // Check preset ranges
    if (formData.wordCount.includes('Short')) {
      return true; // Short: 50-100 is considered little
    }

    return false; // Medium and Long are not considered little
  }, [formData.wordCount, formData.customWordCount]);

  // Track whether a workflow is being used
  // Show dropdown when workflowId is defined (even if empty string)
  const useWorkflow = formData.workflowId !== undefined;

  // Track if a specific workflow is selected (not just enabled)
  const workflowSelected = useWorkflow && formData.workflowId && formData.workflowId !== '';

  // Effect to disable Create Variants when a workflow is selected
  useEffect(() => {
    if (workflowSelected && formData.createVariants) {
      // Disable createVariants when using a workflow
      handleToggle({
        target: { name: 'createVariants', checked: false }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [workflowSelected]);


  // Define section 5 fields for counting
  const section5Fields = ['createVariants', 'aiDecideWordCount', 'prioritizeWordCount',
    'forceElaborationsExamples',
    'wordCountTolerancePercentage', 'numberOfVariants'];

  // Calculate filled field count for section 5
  const section5Count = countFilledFieldsInSection(formData, section5Fields);

  // Check if any field in the Optional Features section is populated
  return (
    <>
      <CollapsibleSection
        title="Optimization & Optional Features"
        isExpanded={true}
        onToggle={() => onToggleSection?.('optimization-optional')}
        filledCount={section5Count}
      >

      {/* Workflow Selector */}
      <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
        <WorkflowSelector
          useWorkflow={useWorkflow}
          workflowId={formData.workflowId}
          onUseWorkflowChange={(enabled) => {
            if (enabled) {
              // When enabling workflow, just clear the workflowId to allow selection
              handleChange('workflowId', '');
            } else {
              // When disabling workflow, clear the workflowId
              handleChange('workflowId', undefined);
            }
          }}
          onWorkflowChange={(workflowId) => {
            handleChange('workflowId', workflowId);
          }}
          userId={currentUserId}
        />
        {useWorkflow && formData.workflowId && formData.workflowId !== '' && (
          <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded text-xs text-purple-800 dark:text-purple-200">
            <p className="font-medium mb-1">Workflow is active:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>The workflow will execute multiple generation steps sequentially</li>
              <li>Each step produces a separate output card</li>
              <li>Create Variants is disabled (workflow creates variations automatically)</li>
              <li>You can still adjust all other optimization settings</li>
            </ul>
          </div>
        )}
      </div>

      {/* Basic Features - Always Visible in Both Modes */}
      <div className="space-y-3">

      {/* Create Variants Toggle */}
      <div className="flex items-start">
          <Checkbox
            id="createVariants"
            checked={formData.createVariants || false}
            disabled={workflowSelected}
            onCheckedChange={(checked) => {
              // Don't allow enabling if workflow is selected
              if (checked === true && workflowSelected) {
                toast('Create Variants is disabled when using a workflow. Workflows create multiple outputs automatically through their steps.', {
                  duration: 4000,
                  position: 'top-right',
                });
                return;
              }

              // When enabling createVariants, also set numberOfVariants to 3 if not already set
              if (checked === true && !formData.numberOfVariants) {
                handleChange('numberOfVariants', 3);
              }
              handleToggle({
                target: {
                  name: 'createVariants',
                  checked: checked === true
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <div className="ml-2 flex-1">
            <Label htmlFor="createVariants" className={`cursor-pointer flex items-center ${workflowSelected ? 'opacity-50' : ''}`}>
              <span className="text-sm">Create Variants {workflowSelected && '(disabled when using workflow)'}</span>
              <Tooltip content="Generate multiple variations of the copy in a single generation. Each variant will be unique while following the same parameters.">
                <span className="ml-1 inline-block text-gray-500">
                  <InfoIcon size={14} />
                </span>
              </Tooltip>
            </Label>

            {formData.createVariants && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="numberOfVariants" className="text-xs text-gray-600 dark:text-gray-400">
                    Number of variants:
                  </label>
                  <input
                    id="numberOfVariants"
                    name="numberOfVariants"
                    type="number"
                    min="1"
                    max="10"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.numberOfVariants || 3}
                    onChange={(e) => {
                      // Convert string to number
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value)) {
                        handleChange('numberOfVariants', value);
                      }
                    }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">variants</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Each variant will be labeled as "Generated copy 1", "Generated copy 2", etc.
                </p>
              </div>
            )}
          </div>
      </div>

      {/* Let AI Decide Word Count Toggle */}
      <div className="flex items-start">
          <Checkbox
            id="aiDecideWordCount"
            checked={formData.aiDecideWordCount || false}
            onCheckedChange={(checked) => {
              // When enabling "Let AI Decide", disable "Strict Word Count"
              if (checked === true && formData.prioritizeWordCount) {
                handleToggle({
                  target: {
                    name: 'prioritizeWordCount',
                    checked: false
                  }
                } as React.ChangeEvent<HTMLInputElement>);
              }
              handleToggle({
                target: {
                  name: 'aiDecideWordCount',
                  checked: checked === true
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <div className="ml-2 flex-1">
            <Label htmlFor="aiDecideWordCount" className="cursor-pointer flex items-center">
              <span className="text-sm">Let AI Decide Word Count</span>
              <Tooltip content="Removes all word count restrictions. AI generates content based purely on quality and completeness without any length constraints.">
                <span className="ml-1 inline-block text-gray-500">
                  <InfoIcon size={14} />
                </span>
              </Tooltip>
            </Label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              When enabled, AI will focus entirely on content quality without any word count limitations
            </p>
          </div>
      </div>

      {/* Strict Word Count Enforcement Toggle */}
      <div className="flex items-start">
          <Checkbox
            id="prioritizeWordCount"
            checked={formData.prioritizeWordCount || false}
            disabled={formData.aiDecideWordCount || false}
            onCheckedChange={(checked) => {
              // When enabling "Strict Word Count", disable "Let AI Decide"
              if (checked === true && formData.aiDecideWordCount) {
                handleToggle({
                  target: {
                    name: 'aiDecideWordCount',
                    checked: false
                  }
                } as React.ChangeEvent<HTMLInputElement>);
              }
              handleToggle({
                target: {
                  name: 'prioritizeWordCount',
                  checked: checked === true
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <div className="ml-2 flex-1">
            <Label htmlFor="prioritizeWordCount" className={`cursor-pointer flex items-center ${formData.aiDecideWordCount ? 'opacity-50' : ''}`}>
              <span className="text-sm">Strict Word Count Enforcement {formData.aiDecideWordCount && '(disabled)'}</span>
              <Tooltip content="When OFF (default): AI uses word count as guidance (±25% tolerance). Quality over exact count. When ON: AI revises multiple times to hit exact word count within ±2% tolerance.">
                <span className="ml-1 inline-block text-gray-500">
                  <InfoIcon size={14} />
                </span>
              </Tooltip>
            </Label>

            {/* Explanation of modes */}
            {!formData.aiDecideWordCount && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded text-xs">
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <div className="font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">
                    {formData.prioritizeWordCount ? 'ON:' : 'OFF:'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {formData.prioritizeWordCount
                      ? 'Strict mode - System will revise content multiple times to hit exact word count within ±2% tolerance.'
                      : 'Flexible mode - AI aims for target but prioritizes quality. Accepts 75-125% of target (±25% tolerance).'}
                  </div>
                </div>
              </div>
            </div>
            )}

      {/* Word Count Tolerance Percentage - Only show when prioritizeWordCount is enabled */}
      {formData.prioritizeWordCount && (
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            <label htmlFor="wordCountTolerancePercentage" className="text-xs text-gray-600 dark:text-gray-400">
              Strict Tolerance (+/-):
            </label>
            <input
              id="wordCountTolerancePercentage"
              name="wordCountTolerancePercentage"
              type="number"
              min="1"
              max="10"
              step="0.5"
              className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
              value={formData.wordCountTolerancePercentage || 2}
              onChange={handleChangeEvent}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            AI will revise content if it falls outside this tight tolerance range. Lower = more revision attempts.
          </p>
        </div>
      )}
      </div>
      </div>
      </div>

      {/* Additional Features - Visible in Standard/Advanced Mode */}
      <div className="space-y-3 mt-4">

      {/* Expand with examples and detail */}
      <div className="flex items-center">
          <Checkbox
            id="forceElaborationsExamples"
            checked={formData.forceElaborationsExamples || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'forceElaborationsExamples', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <Label htmlFor="forceElaborationsExamples" className="ml-2 cursor-pointer flex items-center">
            <span className="text-sm">Expand with examples and detail</span>
            <Tooltip content="Forces AI to provide detailed explanations, examples, and case studies to expand content">
              <span className="ml-1 text-gray-500 cursor-help">
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </Label>
      </div>

      <AnimatePresence>
        {formData.forceElaborationsExamples && formData.prioritizeWordCount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-2.5 py-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span className="text-xs leading-snug">
                Strict word count enforcement may limit elaboration. For best results, use one at a time.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </CollapsibleSection>
    </>
  );
};

export default FeatureToggles;