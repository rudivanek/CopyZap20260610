import { v4 as uuidv4 } from 'uuid';
import type {
  Workflow,
  WorkflowStep,
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  GeneratedContentItem,
  FormState,
  ScoringContext
} from '../types';
import { GeneratedContentItemType } from '../types';
import { generateAlternativeCopy } from './api/alternativeCopy';
import { restyleCopyWithPersona } from './api/voiceStyles';
import { extractWordCount } from './api/utils';

export class WorkflowExecutionEngine {
  private context: WorkflowExecutionContext = {};
  private generatedOutputs: GeneratedContentItem[] = [];
  private alternativeCount = 0;
  private voiceStyledCount = 0;
  private analysisConfig: { type?: string; instructions?: string; scoringContext?: ScoringContext } = {};
  private detectedWordCount: number | null = null;

  constructor(
    private workflow: Workflow,
    private originalContent: string,
    private formState: FormState,
    private currentUser?: any,
    private progressCallback?: (message: string, currentStep: number, totalSteps: number) => void
  ) {
    this.context['original'] = originalContent;

    // Detect word count from the original content
    this.detectedWordCount = extractWordCount(originalContent);
    console.log(`🔢 Workflow detected word count from content: ${this.detectedWordCount} words`);
  }

  async execute(): Promise<WorkflowExecutionResult> {
    try {
      const totalSteps = this.workflow.steps.length;

      for (let i = 0; i < this.workflow.steps.length; i++) {
        const step = this.workflow.steps[i];
        const stepNumber = i + 1;

        if (this.progressCallback) {
          this.progressCallback(
            `Step ${stepNumber} of ${totalSteps}: ${this.getStepDescription(step)}`,
            stepNumber,
            totalSteps
          );
        }

        await this.executeStep(step);
      }

      const shouldTriggerComparison = this.workflow.enable_analyze_compare ||
        this.workflow.steps.some(s => s.type === 'analyze_compare_copy');

      return {
        success: true,
        generatedOutputs: this.generatedOutputs,
        shouldTriggerComparison,
        analysisType: this.analysisConfig.type,
        customInstructions: this.analysisConfig.instructions,
        scoringContext: this.analysisConfig.scoringContext
      };
    } catch (error) {
      console.error('Workflow execution error:', error);
      return {
        success: false,
        generatedOutputs: this.generatedOutputs,
        error: error instanceof Error ? error.message : 'Workflow execution failed'
      };
    }
  }

  private async executeStep(step: WorkflowStep): Promise<void> {
    // analyze_compare_copy doesn't need a target - it works on all outputs
    if (step.type === 'analyze_compare_copy') {
      this.executeAnalyzeCompareCopy(step);
      return;
    }

    // For other step types, resolve and validate the target
    const targetContent = this.resolveTarget(step.target);

    if (!targetContent) {
      throw new Error(
        `Workflow step target "${step.target}" not found. ` +
        `This workflow may be misconfigured. Please edit and save it again.`
      );
    }

    switch (step.type) {
      case 'create_alternative_copy':
        await this.executeCreateAlternativeCopy(targetContent, step);
        break;
      case 'apply_voice_style':
        await this.executeApplyVoiceStyle(targetContent, step);
        break;
      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }
  }

  private async executeCreateAlternativeCopy(
    targetContent: string,
    step: WorkflowStep
  ): Promise<void> {
    this.alternativeCount++;
    const outputKey = `alt_${this.alternativeCount}`;

    // Create a modified formState that uses the detected word count
    const modifiedFormState = this.getFormStateWithDetectedWordCount();

    const alternativeCopy = await generateAlternativeCopy(
      modifiedFormState,
      targetContent,
      this.currentUser,
      modifiedFormState.sessionId,
      (msg) => {
        if (this.progressCallback) {
          this.progressCallback(msg, 0, this.workflow.steps.length);
        }
      }
    );

    const contentText = typeof alternativeCopy === 'string'
      ? alternativeCopy
      : alternativeCopy.content || JSON.stringify(alternativeCopy);

    this.context[outputKey] = contentText;

    const generatedItem: GeneratedContentItem = {
      id: uuidv4(),
      type: GeneratedContentItemType.Alternative,
      content: alternativeCopy,
      generatedAt: new Date().toISOString(),
      sourceDisplayName: `Alternative ${this.alternativeCount} (Workflow)`,
      workflowGenerated: true
    };

    this.generatedOutputs.push(generatedItem);
  }

  private async executeApplyVoiceStyle(
    targetContent: string,
    step: WorkflowStep
  ): Promise<void> {
    if (step.type !== 'apply_voice_style') {
      throw new Error('Invalid step type for apply voice style');
    }

    this.voiceStyledCount++;
    const outputKey = `voice_${this.voiceStyledCount}`;

    // Determine which voice to use: preset or brand voice
    const voiceIdentifier = step.preset_voice_style || step.brand_voice_id || '';
    const voiceDisplayName = step.brand_voice_name || step.preset_voice_style || 'Unknown';

    // Create a modified formState that uses the detected word count
    const modifiedFormState = this.getFormStateWithDetectedWordCount();

    const styledResult = await restyleCopyWithPersona(
      targetContent,
      voiceIdentifier,
      modifiedFormState.model,
      this.currentUser,
      modifiedFormState.language,
      modifiedFormState,
      this.detectedWordCount || undefined,
      modifiedFormState.sessionId,
      (msg) => {
        if (this.progressCallback) {
          this.progressCallback(msg, 0, this.workflow.steps.length);
        }
      }
    );

    const contentText = typeof styledResult.content === 'string'
      ? styledResult.content
      : styledResult.content.content || JSON.stringify(styledResult.content);

    this.context[outputKey] = contentText;

    const generatedItem: GeneratedContentItem = {
      id: uuidv4(),
      type: GeneratedContentItemType.RestyledAlternative,
      content: styledResult.content,
      generatedAt: new Date().toISOString(),
      sourceDisplayName: `${voiceDisplayName} Style (Workflow)`,
      workflowGenerated: true
    };

    this.generatedOutputs.push(generatedItem);
  }

  private executeAnalyzeCompareCopy(step: WorkflowStep): void {
    if (step.type !== 'analyze_compare_copy') {
      throw new Error('Invalid step type for analyze compare copy');
    }

    this.analysisConfig = {
      type: step.analysisType || 'comprehensive',
      instructions: step.customInstructions || '',
      scoringContext: step.scoringContext
    };
  }

  private resolveTarget(target: string): string | null {
    return this.context[target] || null;
  }

  private getStepDescription(step: WorkflowStep): string {
    switch (step.type) {
      case 'create_alternative_copy':
        return `Creating alternative copy from ${step.target}`;
      case 'apply_voice_style':
        const voiceName = step.brand_voice_name || step.preset_voice_style || 'voice';
        return `Applying ${voiceName} style to ${step.target}`;
      case 'analyze_compare_copy':
        return 'Preparing analysis configuration';
      default:
        return 'Unknown step';
    }
  }

  /**
   * Creates a modified formState that uses the detected word count from the content.
   * This ensures workflows respect the word count of the content being processed
   * rather than using the original form's word count settings.
   */
  private getFormStateWithDetectedWordCount(): FormState {
    // If we detected a word count, use it as a custom word count
    if (this.detectedWordCount !== null && this.detectedWordCount > 0) {
      return {
        ...this.formState,
        wordCount: 'Custom',
        customWordCount: this.detectedWordCount,
        prioritizeWordCount: true // Enable strict word count adherence
      };
    }

    // Otherwise, return the original formState
    return this.formState;
  }
}
