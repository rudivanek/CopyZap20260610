import { useState, useCallback } from 'react';
import { FormState, Template, CopySession, SavedOutput, ContentQualityScore, GeneratedContentItem, GeneratedContentItemType } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';
import { createOutputStructure } from '../constants/prefills';
import { Prefill } from '../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { getFieldsWithPlaceholders } from '../utils/placeholderDetection';
import { applyOptimizationRestorePolicy } from '../utils/optimizationRestorePolicy';
import { repairDecisionLayerFields } from '../services/api/comprehensiveScoring';

export function useFormState() {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);

  /**
   * Load form state from a template
   */
  const loadFormStateFromTemplate = useCallback((template: Template) => {
    console.log('📋 Loading template - output_structure:', template.output_structure);
    setFormState(prevState => {
      // Create a new state object with the template data
      const rawState: Partial<FormState> = {
        tab: template.template_type as 'create' | 'improve',
        language: template.language,
        tone: template.tone,
        wordCount: template.word_count,
        customWordCount: template.custom_word_count || undefined,
        targetAudience: template.target_audience || undefined,
        keyMessage: template.key_message || undefined,
        desiredEmotion: template.desired_emotion || undefined,
        callToAction: template.call_to_action || undefined,
        brandValues: template.brand_values || undefined,
        keywords: template.keywords || undefined,
        context: template.context || undefined,
        // briefDescription intentionally NOT loaded from template - use projectDescription instead
        pageType: template.page_type || undefined,
        businessDescription: template.business_description || undefined,
        originalCopy: template.original_copy || undefined,
        projectDescription: template.project_description || undefined,
        competitorUrls: template.competitor_urls || ['', '', ''],
        section: template.section || undefined,
        outputStructure: !template.output_structure || (Array.isArray(template.output_structure) && template.output_structure.length === 0)
          ? [] // If null, undefined, or explicitly empty array, use empty array
          : (Array.isArray(template.output_structure) && template.output_structure.length > 0 && typeof template.output_structure[0] === 'object' && 'section' in template.output_structure[0]
              ? template.output_structure
                  .filter((item: any) => item && typeof item === 'object') // Filter out invalid items
                  .map((item: any) => {
                    const sectionStr = (typeof item.section === 'string' && item.section) ? item.section : '';
                    const safeValue = sectionStr ? sectionStr.toLowerCase().replace(/\s+/g, '') : `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    return {
                      id: `template-${safeValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      value: safeValue,
                      label: sectionStr || 'Untitled Section',
                      wordCount: item.wordCount || null,
                      description: item.description || undefined
                    };
                  })
              : createOutputStructure(template.output_structure)),

        // Customer and brand voice
        customerId: template.customerId || template.customer_id || undefined,
        brandVoiceId: template.brandVoiceId || template.brand_voice_id || undefined,

        // New fields
        productServiceName: template.product_service_name || undefined,
        industryNiche: template.industry_niche || undefined,
        toneLevel: template.tone_level || 50,
        readerFunnelStage: template.reader_funnel_stage || undefined,
        competitorCopyText: template.competitor_copy_text || undefined,
        targetAudiencePainPoints: template.target_audience_pain_points || undefined,
        preferredWritingStyle: template.preferred_writing_style || undefined,
        languageStyleConstraints: template.language_style_constraints || [],
        excludedTerms: template.excluded_terms || undefined,

        // Generation options (non-optimization)
        generateHeadlines: template.generateHeadlines || false,
        createVariants: template.createVariants || template.create_variants || false,
        numberOfVariants: template.numberOfVariants || template.number_of_variants || 2,
        selectedPersona: template.selectedPersona || undefined,
        numberOfHeadlines: template.numberOfHeadlines || 3,

        // Special instructions
        specialInstructions: template.special_instructions || undefined,

        // Section titles for structured output
        includeSectionTitles: template.includeSectionTitles !== undefined
          ? template.includeSectionTitles
          : (template.include_section_titles !== undefined ? template.include_section_titles : true),

        // NOTE: Optimization fields intentionally EXCLUDED here
        // They will be set to empty/off by the policy function
      };

      // Apply optimization restore policy - templates must NOT restore optimization fields
      const stateWithPolicy = applyOptimizationRestorePolicy('template', rawState);

      const newState: FormState = {
        ...prevState,
        ...stateWithPolicy,
        // Reset loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        copyResult: DEFAULT_FORM_STATE.copyResult,
        promptEvaluation: undefined,
        sessionId: undefined, // Reset session ID when loading template
        keywordsExplicit: !!(template.keywords?.trim())
      };

      // Detect fields with placeholders for visual highlighting
      const fieldsWithPlaceholders = getFieldsWithPlaceholders(newState);
      newState.fieldsWithPlaceholders = fieldsWithPlaceholders;

      return newState;
    });
  }, [setFormState]);

  /**
   * Load form state from a copy session
   */
  const loadFormStateFromSession = useCallback((session: CopySession) => {
    if (!session || !session.input_data) {
      return;
    }

    setFormState(prevState => {
      // Extract input data from the session
      const inputData = session.input_data;

      // Apply optimization restore policy - sessions RESTORE optimization fields
      const stateWithPolicy = applyOptimizationRestorePolicy('saved_session', inputData);

      // Normalize legacy model values — deepseek-chat was removed; remap to Claude
      const normalizedModel = stateWithPolicy.model === 'deepseek-chat' ? 'claude-sonnet-4-5' : stateWithPolicy.model;

      // Create a new state object with the session data
      const newState: FormState = {
        ...prevState,
        ...stateWithPolicy,
        model: normalizedModel,
        sessionId: session.id,
        customerId: session.customer_id || undefined,
        customerName: session.customer?.name || undefined,

        // Explicitly reset copyResult to ensure no outputs are shown
        copyResult: DEFAULT_FORM_STATE.copyResult,

        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        keywordsExplicit: !!(inputData.keywords?.trim())
      };

      // Copy Sessions now only restore inputs, not outputs
      // The copyResult will remain undefined (empty) when loading from a copy session

      return newState;
    });
  }, [setFormState]);

  /**
   * Load form state from a saved output
   */
  const loadFormStateFromSavedOutput = useCallback((savedOutput: SavedOutput) => {
    if (!savedOutput || !savedOutput.input_data || !savedOutput.output_data) {
      return;
    }

    setFormState(prevState => {
      // Extract input data and output content from the saved output
      const inputData = savedOutput.input_data;

      // Apply optimization restore policy - saved outputs RESTORE optimization fields
      const stateWithPolicy = applyOptimizationRestorePolicy('saved_output', inputData);

      // Normalize legacy model values — deepseek-chat was removed; remap to Claude
      const normalizedModel = stateWithPolicy.model === 'deepseek-chat' ? 'claude-sonnet-4-5' : stateWithPolicy.model;

      // Create a new state object with the saved output data
      const newState: FormState = {
        ...prevState,
        ...stateWithPolicy,
        model: normalizedModel,

        // Set the copyResult directly from the saved output's output_data.
        // Apply decision layer repair to ensure all fields are present on restored results.
        copyResult: (() => {
          const cr = savedOutput.output_data;
          if (cr?.comparisonResult) repairDecisionLayerFields(cr.comparisonResult);
          return cr;
        })(),

        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],

        // IMPORTANT: Do NOT reuse the old session ID from saved output
        // This ensures a new session is created when generating copy,
        // which properly tracks credit usage as a separate entry
        sessionId: undefined,
        loadedSessionName: undefined,
        keywordsExplicit: !!(inputData.keywords?.trim())
      };

      return newState;
    });
  }, [setFormState]);

  /**
   * Load form state from a prefill
   */
  const loadFormStateFromPrefill = useCallback((prefill: Prefill) => {
    setFormState(prevState => {
      // Apply optimization restore policy - prefills must NOT restore optimization fields
      const stateWithPolicy = applyOptimizationRestorePolicy('prefill', prefill.data);

      // Create a new state object with the prefill data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        // Apply all prefill data with policy applied
        ...stateWithPolicy,
        // Always preserve loading states and other runtime states
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        copyResult: DEFAULT_FORM_STATE.copyResult,
        promptEvaluation: undefined,
        keywordsExplicit: !!(prefill.data.keywords?.trim())
      };

      // Handle originalCopyGuidance from prefill
      if (prefill.data.originalCopyGuidance) {
        // Store the guidance in form state
        newState.originalCopyGuidance = prefill.data.originalCopyGuidance;

        // Populate the appropriate primary content field based on tab
        if (newState.tab === 'create') {
          newState.businessDescription = prefill.data.originalCopyGuidance;
        } else if (newState.tab === 'improve') {
          newState.originalCopy = prefill.data.originalCopyGuidance;
        }
      }

      return newState;
    });
  }, [setFormState]);

  // Function to update a quality score in the form state
  const handleScoreChange = useCallback((name: string, score: ContentQualityScore) => {
    setFormState(prevState => {
      // Create a copy of the previous state
      const newState = { ...prevState };
      
      // Update the score field based on the name
      switch (name) {
        case 'businessDescriptionScore':
          newState.businessDescriptionScore = score;
          break;
        case 'originalCopyScore':
          newState.originalCopyScore = score;
          break;
        default:
          console.warn(`Unknown score field: ${name}`);
      }
      
      return newState;
    });
  }, [setFormState]);

  return {
    formState,
    setFormState,
    loadFormStateFromTemplate,
    loadFormStateFromSession,
    loadFormStateFromSavedOutput,
    loadFormStateFromPrefill,
    handleScoreChange
  };
}