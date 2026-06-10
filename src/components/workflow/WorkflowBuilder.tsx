import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import { GripVertical, X, Plus, Wand2, Mic2, Sparkles, Settings } from 'lucide-react';
import type { WorkflowStep, WorkflowStepType, BrandVoice } from '../../types';
import { CATEGORIZED_VOICE_STYLES } from '../../constants';

interface WorkflowBuilderProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  brandVoices?: BrandVoice[];
  selectedCustomerId?: string;
  onConfigureAnalyzeStep?: () => void;
}

const StepTypeLibrary: { type: WorkflowStepType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: 'create_alternative_copy',
    label: 'Create Alternative Copy',
    icon: <Wand2 className="h-5 w-5" />,
    description: 'Generate an alternative version of the copy'
  },
  {
    type: 'apply_voice_style',
    label: 'Apply Voice Style',
    icon: <Mic2 className="h-5 w-5" />,
    description: 'Apply a brand voice style to the copy'
  }
];

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  steps,
  onChange,
  brandVoices = [],
  selectedCustomerId,
  onConfigureAnalyzeStep
}) => {
  const [localSteps, setLocalSteps] = useState<WorkflowStep[]>(steps);
  const validationDoneRef = React.useRef<string>('');

  useEffect(() => {
    // Validate and fix targets when loading from database
    const validatedSteps = validateAndFixTargets(steps);

    // Create a hash to detect if we've already validated these exact steps
    const stepsHash = JSON.stringify(steps);

    // Only update if steps changed AND we haven't validated this exact configuration
    if (stepsHash !== validationDoneRef.current) {
      validationDoneRef.current = stepsHash;
      setLocalSteps(validatedSteps);

      // If validation made changes, save immediately
      if (JSON.stringify(steps) !== JSON.stringify(validatedSteps)) {
        console.warn('⚠️ Auto-correcting invalid workflow targets');
        onChange(validatedSteps);
      }
    }
  }, [steps, onChange]);

  // Validate that all step targets are valid (exist in context at that point)
  const validateAndFixTargets = (stepsToValidate: WorkflowStep[]): WorkflowStep[] => {
    return stepsToValidate.map((step, index) => {
      // Skip validation for analyze_compare_copy (no target needed)
      if (step.type === 'analyze_compare_copy') {
        return step;
      }

      const validTargets = getTargetOptions(index, stepsToValidate);

      // If current target is invalid, pick a smart fallback
      if (!step.target || !validTargets.includes(step.target)) {
        // Prefer the most recent output (last item in validTargets), otherwise use 'original'
        const fallbackTarget = validTargets.length > 1 ? validTargets[validTargets.length - 1] : 'original';

        console.warn(
          `Step ${index + 1} has invalid target "${step.target}". ` +
          `Resetting to "${fallbackTarget}". Available targets: ${validTargets.join(', ')}`
        );

        return { ...step, target: fallbackTarget };
      }

      return step;
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localSteps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Ensure analyze_compare_copy steps always stay at the end
    const analyzeSteps = items.filter(step => step.type === 'analyze_compare_copy');
    const otherSteps = items.filter(step => step.type !== 'analyze_compare_copy');
    const reorderedItems = [...otherSteps, ...analyzeSteps];

    // Validate and fix targets after reordering
    const validatedItems = validateAndFixTargets(reorderedItems);

    setLocalSteps(validatedItems);
    onChange(validatedItems);
  };

  const addStep = (type: WorkflowStepType) => {
    const newStep: WorkflowStep = {
      id: uuidv4(),
      type,
      // Only set target for non-analysis steps
      ...(type !== 'analyze_compare_copy' && { target: 'original' }),
      ...(type === 'apply_voice_style' && { preset_voice_style: '', brand_voice_id: '', brand_voice_name: '' }),
      ...(type === 'analyze_compare_copy' && { analysisType: 'comprehensive', customInstructions: '' })
    } as WorkflowStep;

    const updatedSteps = [...localSteps, newStep];
    setLocalSteps(updatedSteps);
    onChange(updatedSteps);
  };

  const removeStep = (stepId: string) => {
    const updatedSteps = localSteps.filter(s => s.id !== stepId);

    // Validate and fix targets after removing a step
    const validatedSteps = validateAndFixTargets(updatedSteps);

    setLocalSteps(validatedSteps);
    onChange(validatedSteps);
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    const updatedSteps = localSteps.map(s =>
      s.id === stepId ? { ...s, ...updates } : s
    );
    setLocalSteps(updatedSteps);
    onChange(updatedSteps);
  };

  const getTargetOptions = (stepIndex: number, stepsArray: WorkflowStep[] = localSteps): string[] => {
    const options = ['original'];
    let altCount = 0;
    let voiceCount = 0;

    for (let i = 0; i < stepIndex; i++) {
      const step = stepsArray[i];
      if (step.type === 'create_alternative_copy') {
        altCount++;
        options.push(`alt_${altCount}`);
      } else if (step.type === 'apply_voice_style') {
        voiceCount++;
        options.push(`voice_${voiceCount}`);
      }
    }

    return options;
  };

  const getTargetLabel = (target: string, currentStepIndex?: number): string => {
    if (target === 'original') return 'Original Copy';

    // For numbered targets (alt_X or voice_X), show the step number
    if (target.startsWith('alt_') || target.startsWith('voice_')) {
      // Find which step this target corresponds to
      let stepNumber = 0;
      let altCount = 0;
      let voiceCount = 0;

      for (let i = 0; i < localSteps.length; i++) {
        const step = localSteps[i];
        stepNumber = i + 1;

        if (step.type === 'create_alternative_copy') {
          altCount++;
          if (target === `alt_${altCount}`) {
            return `Step ${stepNumber} Output`;
          }
        } else if (step.type === 'apply_voice_style') {
          voiceCount++;
          if (target === `voice_${voiceCount}`) {
            return `Step ${stepNumber} Output`;
          }
        }
      }
    }

    return target;
  };

  return (
    <div className="space-y-6">
      {/* Action Library */}
      <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
        <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Action Library</h3>
        <div className="grid grid-cols-2 gap-3">
          {StepTypeLibrary.map(({ type, label, icon, description }) => (
            <button
              key={type}
              onClick={() => addStep(type)}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">{icon}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
              </div>
              <Plus className="h-4 w-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 min-h-[300px]">
        <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Workflow Steps</h3>
        {localSteps.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-lg mb-2">No steps added yet</div>
            <div className="text-sm">Add actions from the library above to build your workflow</div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="workflow-steps">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {localSteps.map((step, index) => {
                    const isAnalyzeStep = step.type === 'analyze_compare_copy';
                    return (
                    <Draggable key={step.id} draggableId={step.id} index={index} isDragDisabled={isAnalyzeStep}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border rounded-lg p-4 ${
                            isAnalyzeStep
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                              : 'bg-gray-50 dark:bg-gray-700'
                          } ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Drag Handle - Hidden for analyze step */}
                            {!isAnalyzeStep ? (
                              <div {...provided.dragHandleProps} className="text-gray-400 mt-1 cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-5 w-5" />
                              </div>
                            ) : (
                              <div className="text-blue-500 dark:text-blue-400 mt-1">
                                <Sparkles className="h-5 w-5" />
                              </div>
                            )}

                            {/* Step Content */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Step {index + 1}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {StepTypeLibrary.find(t => t.type === step.type)?.label}
                                  </span>
                                  {isAnalyzeStep && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                                      Always Last
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeStep(step.id)}
                                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Step Configuration */}
                              <div className="space-y-2">
                                {/* Target Selection - NOT shown for analyze_compare_copy */}
                                {step.type !== 'analyze_compare_copy' && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Target Copy
                                    </label>
                                    <select
                                      value={step.target}
                                      onChange={(e) => updateStep(step.id, { target: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                      {getTargetOptions(index).map(option => (
                                        <option key={option} value={option}>
                                          {getTargetLabel(option)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {/* Voice Style Selection (for apply_voice_style step) */}
                                {step.type === 'apply_voice_style' && (
                                  <>
                                    {/* Preset Voice Style Dropdown */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Voice Style
                                      </label>
                                      <select
                                        value={step.preset_voice_style || ''}
                                        onChange={(e) => {
                                          updateStep(step.id, {
                                            preset_voice_style: e.target.value,
                                            // Clear brand voice if preset is selected
                                            ...(e.target.value && { brand_voice_id: '', brand_voice_name: '' })
                                          });
                                        }}
                                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      >
                                        <option value="">None</option>
                                        {CATEGORIZED_VOICE_STYLES.map((categoryGroup) => (
                                          <optgroup key={categoryGroup.category} label={categoryGroup.category}>
                                            {categoryGroup.options.map((voiceOption) => (
                                              <option key={voiceOption.value} value={voiceOption.value}>
                                                {voiceOption.label}
                                              </option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Brand Voice Dropdown (only shown when customer is selected) */}
                                    {selectedCustomerId && (
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Brand Voice
                                        </label>
                                        <select
                                          value={step.brand_voice_id || ''}
                                          onChange={(e) => {
                                            const selectedVoice = brandVoices.find(v => v.id === e.target.value);
                                            updateStep(step.id, {
                                              brand_voice_id: e.target.value,
                                              brand_voice_name: selectedVoice?.name || '',
                                              // Clear preset voice if brand voice is selected
                                              ...(e.target.value && { preset_voice_style: '' })
                                            });
                                          }}
                                          className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                          <option value="">None</option>
                                          {brandVoices.map(voice => (
                                            <option key={voice.id} value={voice.id}>
                                              {voice.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    {/* Validation Message */}
                                    {!step.preset_voice_style && !step.brand_voice_id && (
                                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        Please select either a Voice Style or Brand Voice
                                      </p>
                                    )}
                                  </>
                                )}

                                {/* Analysis Configuration (for analyze_compare_copy step) */}
                                {step.type === 'analyze_compare_copy' && (
                                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      Analyzes and compares all outputs using <strong>Comprehensive Analysis</strong>. Evaluates marketing effectiveness, clarity, SEO, emotional impact, and CTA effectiveness.
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                        Scoring context: {step.scoringContext?.useCaseLabel ?? 'Not set'}
                                      </span>
                                      {onConfigureAnalyzeStep && (
                                        <button
                                          type="button"
                                          onClick={onConfigureAnalyzeStep}
                                          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                                        >
                                          <Settings className="h-3 w-3" />
                                          Configure
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};
