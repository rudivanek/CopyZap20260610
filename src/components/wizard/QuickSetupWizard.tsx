import React, { useState, useEffect } from 'react';
import { X, Zap, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User, FormState } from '../../types';
import { generateTemplateJsonSuggestion } from '../../services/apiService';
import { useMode } from '../../context/ModeContext';
import { isFieldVisible } from '../../utils/fieldVisibility';
import { useSession } from '../../context/SessionContext';
import { applyOptimizationRestorePolicy } from '../../utils/optimizationRestorePolicy';
import WizardHeader from './WizardHeader';
import WizardFooter from './WizardFooter';
import WizardStep from './WizardStep';
import WizardSummary from './WizardSummary';
import QuickPolishMode, { QuickPolishConfig } from './QuickPolishMode';

import { Model } from '../../types';

interface QuickSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  selectedModel?: Model;
  onApplyToForm?: (templateData: Partial<FormState>) => void;
  onGenerate?: (wizardData?: Partial<FormState>) => void;
  sessionId?: string;
  initialMode?: 'create' | 'improve' | 'polish';
  initialStep?: number | null;
}

interface WizardState {
  currentStep: number;
  answers: {
    mode: 'create' | 'improve' | 'polish';
    projectDescription: string;
    whatAreYouCreating: string;
    targetAudience: string;
    painPoints: string;
    wordCount: 'Short: 50-100' | 'Medium: 100-200' | 'Long: 200-400' | 'Custom';
    customWordCount: number;
    tone: 'Professional' | 'Friendly' | 'Bold' | 'Minimalist' | 'Creative' | 'Persuasive';
    specialInstructions: string;
    enableSEO: boolean;
    enableGEO: boolean;
    outputStructure?: any;
    customerId?: string;
    brandVoiceId?: string;
    industryNiche?: string;
    readerFunnelStage?: string;
    competitorCopyText?: string;
    readerSophistication?: string;
  };
}

const STORAGE_KEY = 'pmc_wizard_state';

// Simple language detection based on character patterns
const detectLanguage = (text: string): string => {
  if (!text || text.trim().length === 0) return 'English';

  const sample = text.toLowerCase().slice(0, 500);

  // Spanish indicators
  const spanishPatterns = /\b(el|la|los|las|un|una|de|del|que|en|por|para|con|como|su|sus|muy|más|también|cuando|donde|esto|esta|estos|estas|porque|aunque|desde|hasta|sobre|pero|sino|entre|cual|cuales|quién|quiénes|ñ)\b/g;
  const spanishMatches = (sample.match(spanishPatterns) || []).length;

  // French indicators
  const frenchPatterns = /\b(le|la|les|un|une|des|de|du|et|ou|mais|donc|car|dans|pour|avec|sans|sur|sous|par|entre|chez|vers|jusque|depuis|pendant|comme|très|plus|aussi|à|où|ça|été|être|avoir|fait|faire|dit|dire|ê|é|è|ç)\b/g;
  const frenchMatches = (sample.match(frenchPatterns) || []).length;

  // German indicators
  const germanPatterns = /\b(der|die|das|den|dem|des|ein|eine|einen|einem|eines|und|oder|aber|ich|du|er|sie|es|wir|ihr|sie|ist|sind|war|waren|hat|haben|wird|werden|auf|in|mit|von|zu|für|über|unter|bei|nach|vor|zwischen|durch|ohne|ä|ö|ü|ß)\b/g;
  const germanMatches = (sample.match(germanPatterns) || []).length;

  // Portuguese indicators
  const portuguesePatterns = /\b(o|a|os|as|um|uma|de|da|do|das|dos|que|em|por|para|com|como|seu|sua|seus|suas|muito|mais|também|quando|onde|isto|esta|estes|estas|porque|embora|desde|até|sobre|mas|entre|qual|quais|quem|ã|õ|ê|á)\b/g;
  const portugueseMatches = (sample.match(portuguesePatterns) || []).length;

  // Italian indicators
  const italianPatterns = /\b(il|lo|la|i|gli|le|un|una|uno|di|da|del|della|dei|delle|che|in|per|con|come|suo|sua|suoi|sue|molto|più|anche|quando|dove|questo|questa|questi|queste|perché|benché|fino|sopra|sotto|ma|tra|fra|quale|quali|chi|è|à|ì|ò|ù)\b/g;
  const italianMatches = (sample.match(italianPatterns) || []).length;

  // Determine most likely language
  const scores = {
    Spanish: spanishMatches,
    French: frenchMatches,
    German: germanMatches,
    Portuguese: portugueseMatches,
    Italian: italianMatches,
  };

  const maxScore = Math.max(...Object.values(scores));

  // If we have a strong match (more than 5% of words), return that language
  const wordCount = sample.split(/\s+/).length;
  if (maxScore > wordCount * 0.05) {
    const detectedLang = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
    if (detectedLang) return detectedLang;
  }

  // Default to English
  return 'English';
};

const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedModel,
  onApplyToForm,
  onGenerate,
  sessionId,
  initialMode,
  initialStep
}) => {
  const { mode, setMode, forceAdvanced } = useMode();
  const { ensureActiveSession } = useSession();

  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    answers: {
      mode: 'create',
      projectDescription: '',
      whatAreYouCreating: '',
      targetAudience: '',
      painPoints: '',
      wordCount: 'Medium: 100-200',
      customWordCount: 300,
      tone: 'Friendly',
      specialInstructions: '',
      enableSEO: false,
      enableGEO: false,
      customerId: undefined,
      brandVoiceId: undefined,
      industryNiche: undefined,
      readerFunnelStage: undefined,
      competitorCopyText: undefined,
      readerSophistication: undefined
    }
  });

  const [previewData, setPreviewData] = useState<Partial<FormState> | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<Partial<FormState> | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [polishConfig, setPolishConfig] = useState<QuickPolishConfig | null>(null);
  const [showHiddenFieldWarning, setShowHiddenFieldWarning] = useState(false);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [pendingApplyData, setPendingApplyData] = useState<Partial<FormState> | null>(null);
  const [pendingFullData, setPendingFullData] = useState<Partial<FormState> | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Wizard no longer auto-switches mode

  // Clear wizard state when opening (always start fresh)
  useEffect(() => {
    if (isOpen) {
      const mode = initialMode || 'create';
      setWizardState({
        currentStep: initialStep || 1,
        answers: {
          mode: mode,
          projectDescription: '',
          whatAreYouCreating: '',
          targetAudience: '',
          painPoints: '',
          wordCount: 'Medium: 100-200',
          customWordCount: 300,
          tone: 'Friendly',
          specialInstructions: '',
          // Auto-enable SEO and GEO for 'improve' mode (always on, no user controls)
          enableSEO: mode === 'improve' ? true : false,
          enableGEO: mode === 'improve' ? true : false,
          customerId: undefined,
          brandVoiceId: undefined,
          industryNiche: undefined,
          readerFunnelStage: undefined,
          competitorCopyText: undefined,
          readerSophistication: undefined
        }
      });
      setShowSummary(false);
      setGeneratedData(null);
      setPreviewData(null);
      setPolishConfig(null);
    }
  }, [isOpen, initialMode, initialStep]);


  // Clear state when closing
  const handleClose = () => {

    localStorage.removeItem(STORAGE_KEY);
    setWizardState({
      currentStep: 1,
      answers: {
        mode: 'create',
        projectDescription: '',
        whatAreYouCreating: '',
        targetAudience: '',
        painPoints: '',
        wordCount: 'Medium: 100-200',
        customWordCount: 300,
        tone: 'Friendly',
        specialInstructions: '',
        enableSEO: false,
        enableGEO: false,
        customerId: undefined,
        brandVoiceId: undefined,
        industryNiche: undefined,
        readerFunnelStage: undefined,
        competitorCopyText: undefined,
        readerSophistication: undefined
      }
    });
    setShowSummary(false);
    setGeneratedData(null);
    setPreviewData(null);
    onClose();
  };

  const updateAnswer = (key: keyof WizardState['answers'], value: any) => {
    setWizardState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [key]: value
      }
    }));
  };

  const goToStep = (step: number) => {
    setWizardState(prev => ({ ...prev, currentStep: step }));
  };

  const nextStep = () => {
    // Validation before moving to next step
    if (wizardState.currentStep === 1) {
      // Skip validation for polish mode as it shows QuickPolishMode component
      if (wizardState.answers.mode === 'polish') {
        return;
      }
      // Skip step 2 for improve mode - it's now a single-step flow
      if (wizardState.answers.mode === 'improve') {
        return;
      }
      if (!wizardState.answers.projectDescription.trim()) {
        toast.error('Please enter a project description');
        return;
      }
      if (!wizardState.answers.whatAreYouCreating.trim()) {
        toast.error('Please describe what you want to create');
        return;
      }
      if (!wizardState.answers.targetAudience.trim()) {
        toast.error('Please describe your target audience');
        return;
      }
      // Move to step 2 (only for create mode)
      goToStep(wizardState.currentStep + 1);
    }
  };

  const prevStep = () => {
    if (wizardState.currentStep > 1) {
      goToStep(wizardState.currentStep - 1);
    }
  };

  // Filter generated data to only include fields visible in current mode
  const filterVisibleFields = (data: Partial<FormState>): { filtered: Partial<FormState>, hiddenPopulated: string[] } => {
    const filtered: Partial<FormState> = {};
    const hiddenPopulated: string[] = [];

    Object.keys(data).forEach((key) => {
      const fieldName = key as keyof FormState;
      const value = data[fieldName];

      // Skip undefined, null, empty strings, empty arrays
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return;
      }

      // Skip runtime fields and always-allowed fields
      const alwaysAllowedFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields', 'tab', 'model', 'sessionId'];
      if (alwaysAllowedFields.includes(key)) {
        filtered[fieldName] = value;
        return;
      }

      // Check visibility
      if (isFieldVisible(key, mode)) {
        filtered[fieldName] = value;
      } else {
        hiddenPopulated.push(key);
      }
    });

    return { filtered, hiddenPopulated };
  };

  const handleApplyFromStep2 = async () => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    setIsGenerating(true);

    try {
      const workingSessionId = sessionId || await ensureActiveSession(
        currentUser.id,
        'copy_maker',
        wizardState.answers.projectDescription || wizardState.answers.whatAreYouCreating || undefined,
        wizardState.answers.customerId || undefined
      );

      // Build natural language instruction from wizard answers
      const instruction = buildInstruction();

      // Call the existing AI template generation function
      const jsonSuggestion = await generateTemplateJsonSuggestion(
        instruction,
        currentUser,
        selectedModel as any,
        workingSessionId
      );

      // Override with explicit values from wizard to ensure they're respected
      const overriddenData = {
        ...jsonSuggestion,
        // Ensure model is set (default to deepseek-chat if not provided)
        model: jsonSuggestion.model || selectedModel,
        // Set tab based on mode
        tab: wizardState.answers.mode,
        // Wizard checkbox values
        generateSeoMetadata: wizardState.answers.enableSEO,
        prioritizeWordCount: false, // Allow flexible word count from wizard
        // Wizard answer values
        targetAudience: wizardState.answers.targetAudience || jsonSuggestion.targetAudience,
        targetAudiencePainPoints: wizardState.answers.painPoints || jsonSuggestion.targetAudiencePainPoints,
        tone: wizardState.answers.tone || jsonSuggestion.tone,
        wordCount: wizardState.answers.wordCount !== 'Custom' ? wizardState.answers.wordCount : jsonSuggestion.wordCount,
        customWordCount: wizardState.answers.wordCount === 'Custom' ? wizardState.answers.customWordCount : jsonSuggestion.customWordCount,
        specialInstructions: (wizardState.answers.specialInstructions && wizardState.answers.specialInstructions.trim())
          ? wizardState.answers.specialInstructions
          : jsonSuggestion.specialInstructions || '',
        outputStructure: (wizardState.answers.outputStructure && Array.isArray(wizardState.answers.outputStructure) && wizardState.answers.outputStructure.length > 0)
          ? wizardState.answers.outputStructure
          : wizardState.answers.mode === 'improve'
            ? []
            : jsonSuggestion.outputStructure || [],
        // Customer and Brand Voice from wizard
        customerId: wizardState.answers.customerId || undefined,
        brandVoiceId: wizardState.answers.brandVoiceId || undefined,
        // Advanced fields from wizard - Only for 'create' mode, not 'improve' (inferred from content)
        ...(wizardState.answers.mode === 'create' ? {
          industryNiche: wizardState.answers.industryNiche || jsonSuggestion.industryNiche || undefined,
          readerFunnelStage: wizardState.answers.readerFunnelStage || jsonSuggestion.readerFunnelStage || undefined,
          readerSophistication: wizardState.answers.readerSophistication || jsonSuggestion.readerSophistication || undefined
        } : {}),
        competitorCopyText: wizardState.answers.competitorCopyText || jsonSuggestion.competitorCopyText || undefined
      };

      // Ensure both required fields are populated
      const ensuredData = { ...overriddenData };

      // Use wizard's projectDescription first
      if (wizardState.answers.projectDescription?.trim()) {
        ensuredData.projectDescription = wizardState.answers.projectDescription;
      }

      if (!ensuredData.projectDescription?.trim() && ensuredData.productServiceName?.trim()) {
        ensuredData.projectDescription = ensuredData.productServiceName;
      }

      if (!ensuredData.productServiceName?.trim() && ensuredData.projectDescription?.trim()) {
        ensuredData.productServiceName = ensuredData.projectDescription;
      }

      if (!ensuredData.projectDescription?.trim()) {
        ensuredData.projectDescription = wizardState.answers.whatAreYouCreating;
      }
      if (!ensuredData.productServiceName?.trim()) {
        ensuredData.productServiceName = wizardState.answers.whatAreYouCreating;
      }

      // Populate the correct field based on mode
      if (wizardState.answers.mode === 'create') {
        ensuredData.businessDescription = wizardState.answers.whatAreYouCreating;
      } else {
        ensuredData.originalCopy = wizardState.answers.whatAreYouCreating;
      }

      // Track which fields are being populated
      const prefilledFields = Object.keys(ensuredData).filter(key => {
        const runtimeFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields'];
        return !runtimeFields.includes(key) && ensuredData[key as keyof FormState] !== undefined && ensuredData[key as keyof FormState] !== '';
      });

      // Apply optimization restore policy - wizard must NOT restore optimization fields
      const dataWithPolicy = applyOptimizationRestorePolicy('wizard', ensuredData);

      // Add tracking and clear results
      const fullData = {
        ...dataWithPolicy,
        sessionId: workingSessionId, // Include session ID for token tracking
        templatePrefilledFields: prefilledFields,
        copyResult: { generatedVersions: [] },
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
        // NOTE: generateSeoMetadata and other optimization fields are now cleared by policy
      };

      // Force Advanced mode before applying (so all fields are visible)
      if (mode !== 'advanced') {
        forceAdvanced('wizard_apply');
      }

      // Apply all data (no filtering needed since we're in Advanced mode)
      if (onApplyToForm) {
        onApplyToForm(fullData);
      }

      toast.success('Configuration applied! Review and edit before generating.');
      handleClose();
    } catch (error: any) {
      console.error('Error generating configuration:', error);
      toast.error(`Failed to generate configuration: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAndGenerateFromStep2 = async () => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    setIsGenerating(true);

    try {
      const workingSessionId = sessionId || await ensureActiveSession(
        currentUser.id,
        'copy_maker',
        wizardState.answers.projectDescription || wizardState.answers.whatAreYouCreating || undefined,
        wizardState.answers.customerId || undefined
      );

      // Build natural language instruction from wizard answers
      const instruction = buildInstruction();

      // Call the existing AI template generation function
      const jsonSuggestion = await generateTemplateJsonSuggestion(
        instruction,
        currentUser,
        selectedModel as any,
        workingSessionId
      );

      // Override with explicit values from wizard to ensure they're respected
      const overriddenData = {
        ...jsonSuggestion,
        // Ensure model is set (default to deepseek-chat if not provided)
        model: jsonSuggestion.model || selectedModel,
        // Set tab based on mode
        tab: wizardState.answers.mode,
        // Wizard checkbox values
        generateSeoMetadata: wizardState.answers.enableSEO,
        prioritizeWordCount: false, // Allow flexible word count from wizard
        // Wizard answer values
        targetAudience: wizardState.answers.targetAudience || jsonSuggestion.targetAudience,
        targetAudiencePainPoints: wizardState.answers.painPoints || jsonSuggestion.targetAudiencePainPoints,
        tone: wizardState.answers.tone || jsonSuggestion.tone,
        wordCount: wizardState.answers.wordCount !== 'Custom' ? wizardState.answers.wordCount : jsonSuggestion.wordCount,
        customWordCount: wizardState.answers.wordCount === 'Custom' ? wizardState.answers.customWordCount : jsonSuggestion.customWordCount,
        specialInstructions: (wizardState.answers.specialInstructions && wizardState.answers.specialInstructions.trim())
          ? wizardState.answers.specialInstructions
          : jsonSuggestion.specialInstructions || '',
        outputStructure: (wizardState.answers.outputStructure && Array.isArray(wizardState.answers.outputStructure) && wizardState.answers.outputStructure.length > 0)
          ? wizardState.answers.outputStructure
          : wizardState.answers.mode === 'improve'
            ? []
            : jsonSuggestion.outputStructure || [],
        // Customer and Brand Voice from wizard
        customerId: wizardState.answers.customerId || undefined,
        brandVoiceId: wizardState.answers.brandVoiceId || undefined,
        // Advanced fields from wizard - Only for 'create' mode, not 'improve' (inferred from content)
        ...(wizardState.answers.mode === 'create' ? {
          industryNiche: wizardState.answers.industryNiche || jsonSuggestion.industryNiche || undefined,
          readerFunnelStage: wizardState.answers.readerFunnelStage || jsonSuggestion.readerFunnelStage || undefined,
          readerSophistication: wizardState.answers.readerSophistication || jsonSuggestion.readerSophistication || undefined
        } : {}),
        competitorCopyText: wizardState.answers.competitorCopyText || jsonSuggestion.competitorCopyText || undefined
      };

      // Ensure both required fields are populated
      const ensuredData = { ...overriddenData };

      // Use wizard's projectDescription first
      if (wizardState.answers.projectDescription?.trim()) {
        ensuredData.projectDescription = wizardState.answers.projectDescription;
      }

      if (!ensuredData.projectDescription?.trim() && ensuredData.productServiceName?.trim()) {
        ensuredData.projectDescription = ensuredData.productServiceName;
      }

      if (!ensuredData.productServiceName?.trim() && ensuredData.projectDescription?.trim()) {
        ensuredData.productServiceName = ensuredData.projectDescription;
      }

      if (!ensuredData.projectDescription?.trim()) {
        ensuredData.projectDescription = wizardState.answers.whatAreYouCreating;
      }
      if (!ensuredData.productServiceName?.trim()) {
        ensuredData.productServiceName = wizardState.answers.whatAreYouCreating;
      }

      // Populate the correct field based on mode
      if (wizardState.answers.mode === 'create') {
        ensuredData.businessDescription = wizardState.answers.whatAreYouCreating;
      } else {
        ensuredData.originalCopy = wizardState.answers.whatAreYouCreating;
      }

      // Apply optimization restore policy - wizard must NOT restore optimization fields
      const dataWithPolicy = applyOptimizationRestorePolicy('wizard', ensuredData);

      // Track which fields are being populated
      const prefilledFields = Object.keys(dataWithPolicy).filter(key => {
        const runtimeFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields'];
        return !runtimeFields.includes(key) && dataWithPolicy[key as keyof FormState] !== undefined && dataWithPolicy[key as keyof FormState] !== '';
      });

      // Add tracking and clear results
      const fullData = {
        ...dataWithPolicy,
        sessionId: workingSessionId, // Include session ID for token tracking
        templatePrefilledFields: prefilledFields,
        copyResult: { generatedVersions: [] },
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
        // NOTE: generateSeoMetadata and other optimization fields are now cleared by policy
      };

      // Force Advanced mode before generating (so all fields are visible)
      if (mode !== 'advanced') {
        forceAdvanced('wizard_generate');
      }

      // Close wizard
      handleClose(true);

      // Pass all data directly to onGenerate (no filtering needed since we're in Advanced mode)
      if (onGenerate) {
        onGenerate(fullData);
      }

      toast.success('Generating copy with your configuration...');
    } catch (error: any) {
      console.error('Error generating configuration:', error);
      toast.error(`Failed to generate configuration: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildInstruction = (): string => {
    const { answers } = wizardState;
    let instruction = answers.whatAreYouCreating;

    // Add target audience
    if (answers.targetAudience) {
      instruction += `, targeting ${answers.targetAudience}`;
    }

    // Add pain points
    if (answers.painPoints) {
      instruction += `, addressing pain points: ${answers.painPoints}`;
    }

    // Let AI decide tone and word count based on content type
    instruction += '. Use a friendly, professional tone. Decide the appropriate word count based on the content type and purpose.';

    // Add special instructions
    if (answers.specialInstructions) {
      instruction += ` ${answers.specialInstructions}`;
    }

    // Add feature flags with explicit enable/disable instructions
    if (answers.enableSEO) {
      instruction += '. Include SEO optimization with metadata. Set generateSeoMetadata to true.';
    } else {
      instruction += '. Do NOT include SEO optimization. Set generateSeoMetadata to false.';
    }

    if (answers.enableGEO) {
      instruction += '. Enable GEO optimization for AI search engines.';
    } else {
      instruction += '. Do NOT enable GEO optimization.';
    }

    // Add explicit instruction to populate both required fields
    instruction += '. IMPORTANT: Always populate both projectDescription and productServiceName fields based on the context provided.'

    return instruction;
  };


  const handleApplyOnly = () => {
    if (!onApplyToForm) return;

    try {
      if (!generatedData) {
        toast.error('No configuration data available. Please complete the wizard first.');
        return;
      }

      // Ensure both required fields are populated for validation
      const ensuredData = { ...generatedData };

      // Use wizard's projectDescription first
      if (wizardState.answers.projectDescription?.trim()) {
        ensuredData.projectDescription = wizardState.answers.projectDescription;
      }

      // If projectDescription is missing but productServiceName exists, use it
      if (!ensuredData.projectDescription?.trim() && ensuredData.productServiceName?.trim()) {
        ensuredData.projectDescription = ensuredData.productServiceName;
      }

      // If productServiceName is missing but projectDescription exists, use it
      if (!ensuredData.productServiceName?.trim() && ensuredData.projectDescription?.trim()) {
        ensuredData.productServiceName = ensuredData.projectDescription;
      }

      // If both are still missing, use the wizard's "what are you creating" answer
      if (!ensuredData.projectDescription?.trim()) {
        ensuredData.projectDescription = wizardState.answers.whatAreYouCreating;
      }
      if (!ensuredData.productServiceName?.trim()) {
        ensuredData.productServiceName = wizardState.answers.whatAreYouCreating;
      }

      // Populate the correct field based on mode
      if (wizardState.answers.mode === 'create') {
        ensuredData.businessDescription = wizardState.answers.whatAreYouCreating;
      } else {
        ensuredData.originalCopy = wizardState.answers.whatAreYouCreating;
      }

      // Track which fields are being populated
      const prefilledFields = Object.keys(ensuredData).filter(key => {
        const runtimeFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields'];
        return !runtimeFields.includes(key) && ensuredData[key as keyof FormState] !== undefined && ensuredData[key as keyof FormState] !== '';
      });

      // Add tracking and clear results
      const dataWithTracking = {
        ...ensuredData,
        templatePrefilledFields: prefilledFields,
        copyResult: { generatedVersions: [] },
        promptEvaluation: null,
        generationProgress: [],
        isLoading: false,
        isEvaluating: false,
        // Ensure wizard checkbox values override everything
        generateSeoMetadata: wizardState.answers.enableSEO,
        prioritizeWordCount: false // Allow flexible word count from wizard
      };

      // Force Advanced mode before applying (so all fields are visible)
      if (mode !== 'advanced') {
        forceAdvanced('wizard_apply');
      }

      // Apply the configuration
      onApplyToForm(dataWithTracking);

      // Close wizard
      handleClose(true);

      // Show success message
      toast.success('Configuration applied! Review and edit before generating.');
    } catch (error) {
      console.error('Error applying configuration:', error);
      toast.error('Failed to apply configuration to form');
    }
  };

  const handleApplyAndGenerate = () => {
    if (!onApplyToForm || !onGenerate) return;

    try {
      if (!generatedData) {
        toast.error('No configuration data available. Please complete the wizard first.');
        return;
      }

      // Ensure both required fields are populated for validation
      const ensuredData = { ...generatedData };

      // Use wizard's projectDescription first
      if (wizardState.answers.projectDescription?.trim()) {
        ensuredData.projectDescription = wizardState.answers.projectDescription;
      }

      // If projectDescription is missing but productServiceName exists, use it
      if (!ensuredData.projectDescription?.trim() && ensuredData.productServiceName?.trim()) {
        ensuredData.projectDescription = ensuredData.productServiceName;
      }

      // If productServiceName is missing but projectDescription exists, use it
      if (!ensuredData.productServiceName?.trim() && ensuredData.projectDescription?.trim()) {
        ensuredData.productServiceName = ensuredData.projectDescription;
      }

      // If both are still missing, use the wizard's "what are you creating" answer
      if (!ensuredData.projectDescription?.trim()) {
        ensuredData.projectDescription = wizardState.answers.whatAreYouCreating;
      }
      if (!ensuredData.productServiceName?.trim()) {
        ensuredData.productServiceName = wizardState.answers.whatAreYouCreating;
      }

      // Populate the correct field based on mode
      if (wizardState.answers.mode === 'create') {
        ensuredData.businessDescription = wizardState.answers.whatAreYouCreating;
      } else {
        ensuredData.originalCopy = wizardState.answers.whatAreYouCreating;
      }

      // Track which fields are being populated
      const prefilledFields = Object.keys(ensuredData).filter(key => {
        const runtimeFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields'];
        return !runtimeFields.includes(key) && ensuredData[key as keyof FormState] !== undefined && ensuredData[key as keyof FormState] !== '';
      });

      // Add tracking and clear results
      const dataWithTracking = {
        ...ensuredData,
        templatePrefilledFields: prefilledFields,
        copyResult: { generatedVersions: [] },
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };

      // Apply wizard checkboxes
      const finalData = {
        ...dataWithTracking,
        // Ensure wizard checkbox values override everything
        generateSeoMetadata: wizardState.answers.enableSEO,
        prioritizeWordCount: false // Allow flexible word count from wizard
      };

      // Force Advanced mode before generating (so all fields are visible)
      if (mode !== 'advanced') {
        forceAdvanced('wizard_generate');
      }

      // Close wizard
      handleClose(true);

      // Pass the data directly to onGenerate instead of relying on state updates
      onGenerate(finalData);
      toast.success('Generating copy with your configuration...');
    } catch (error) {
      console.error('Error applying configuration:', error);
      toast.error('Failed to apply configuration to form');
    }
  };

  const handleStartOver = () => {
    setShowSummary(false);
    setGeneratedData(null);
    updateAnswer('mode', 'create');
    goToStep(1);
  };


  const handleQuickPolishGenerate = async (config: QuickPolishConfig) => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    setIsGenerating(true);
    setPolishConfig(config);

    try {
      // Auto-detect language from input text
      const detectedLanguage = detectLanguage(config.originalCopy);

      // Build special instruction based on improvement type
      let specialInstructions = '';

      // Check if custom instructions mention language/translation
      const hasLanguageInstruction = config.customInstructions &&
        /\b(translate|in\s+(english|spanish|french|german|italian|portuguese|chinese|japanese|korean|russian|arabic)|to\s+(english|spanish|french|german|italian|portuguese|chinese|japanese|korean|russian|arabic))\b/i.test(config.customInstructions);

      switch (config.improvementType) {
        case 'shorten':
          specialInstructions = `Rewrite this copy to be approximately ${config.targetLength} words. Keep the core message but make it more concise and impactful.`;
          break;
        case 'expand':
          specialInstructions = `Expand this copy to approximately ${config.targetLength} words. Add more detail, examples, and explanation while maintaining the original message.`;
          break;
        case 'tone':
          specialInstructions = `Rewrite this copy in a ${config.targetTone} tone. Maintain the same information but adjust the writing style and voice.`;
          break;
        case 'clarity':
          specialInstructions = 'Improve the clarity of this copy. Simplify complex sentences, use clearer language, and improve overall readability.';
          break;
        case 'persuasive':
          specialInstructions = 'Make this copy more persuasive. Add urgency, strengthen the call-to-action, and emphasize benefits more clearly.';
          break;
        case 'grammar':
          specialInstructions = 'Fix grammar and improve flow. Correct any errors, improve sentence structure, and polish the overall writing quality.';
          break;
        case 'custom':
          specialInstructions = config.customInstructions || '';
          break;
      }

      // Append custom instructions if provided (for non-custom types)
      if (config.improvementType !== 'custom' && config.customInstructions) {
        specialInstructions += ` Additional instructions: ${config.customInstructions}`;
      }

      // Only add "same language" constraint if user hasn't specified a language change
      if (!hasLanguageInstruction) {
        specialInstructions += ' IMPORTANT: Output must be in the same language as the input.';
      }

      // Create a meaningful project description for Quick Polish
      const improvementLabel = config.improvementType === 'custom'
        ? 'Custom Polish'
        : config.improvementType.charAt(0).toUpperCase() + config.improvementType.slice(1);
      const projectDesc = `Quick Polish - ${improvementLabel}`;

      // Create minimal FormState for Quick Polish
      const polishFormState: Partial<FormState> = {
        model: selectedModel,
        tab: 'improve',
        originalCopy: config.originalCopy,
        specialInstructions,
        tone: config.targetTone || 'Friendly',
        wordCount: config.targetLength ? 'Custom' : 'Medium: 100-200',
        customWordCount: config.targetLength,
        language: detectedLanguage,
        projectDescription: projectDesc,
        productServiceName: projectDesc,
        generateSeoMetadata: false,
        templatePrefilledFields: ['originalCopy', 'specialInstructions', 'tone', 'wordCount'],
        copyResult: { generatedVersions: [] },
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };

      // Close wizard and apply + generate
      handleClose(true);

      if (onGenerate) {
        onGenerate(polishFormState);
      }

      toast.success('Generating improved copy...');
    } catch (error: any) {
      console.error('Error with Quick Polish:', error);
      toast.error(`Failed to generate: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate progress - 2 steps total
  const progress = showSummary ? 100 : (wizardState.currentStep / 2) * 100;

  // Helper functions for step metadata
  const getStepTitle = (step: number): string => {
    const titles: Record<number, string> = {
      1: "Tell us about your project",
      2: "Quick preferences"
    };
    return titles[step] || "";
  };

  const getStepSubtitle = (step: number): string => {
    const subtitles: Record<number, string> = {
      1: "What are you creating, who is it for, and what problems does it solve?",
      2: "Set your tone, length, and optional features."
    };
    return subtitles[step] || "";
  };

  const canContinueToNextStep = (): boolean => {
    const { currentStep, answers } = wizardState;

    switch (currentStep) {
      case 1:
        // For polish mode, no validation needed as it switches to QuickPolishMode
        if (answers.mode === 'polish') return false;
        return !!answers.projectDescription.trim() &&
               !!answers.whatAreYouCreating.trim() &&
               answers.whatAreYouCreating.length >= 20 &&
               !!answers.targetAudience.trim();
      case 2: return !!answers.tone && !!answers.wordCount;
      default: return false;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 z-50 flex flex-col"
    >
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 z-[60] flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <svg className="w-16 h-16 mb-4 mx-auto animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="spinnerGradientQuickWiz" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff6b35" />
                  <stop offset="100%" stopColor="#ffa07a" />
                </linearGradient>
              </defs>
              <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientQuickWiz)" strokeWidth="4" strokeLinecap="round" strokeDasharray="90, 150" />
            </svg>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">Generating...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please wait while we create your setup</p>
            <button
              onClick={() => {
                setIsGenerating(false);
                toast.error('Generation cancelled');
              }}
              className="mt-6 px-6 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-2 border-red-300 dark:border-red-700 rounded-full hover:bg-gray-100 dark:hover:bg-red-900/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Simple Header for Improve and Create Modes */}
      {!showSummary && (wizardState.answers.mode === 'improve' || wizardState.answers.mode === 'create') && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {/* Top bar with Quick Setup and Exit Wizard */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#DD6B20]" />
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">Quick Setup</span>
              </div>
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Exit Wizard <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title section */}
          <div className="px-6 py-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Tell us about your project
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  Step 1 of 2
                </span>
              </div>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
                What are you creating, who is it for, and what problems does it solve?
              </p>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#DD6B20] transition-all duration-300 rounded-full"
                  style={{ width: '50%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-8">
          <AnimatePresence mode="wait">
            {wizardState.answers.mode === 'polish' ? (
              <QuickPolishMode
                onGenerate={handleQuickPolishGenerate}
                isGenerating={isGenerating}
                onClose={handleClose}
              />
            ) : !showSummary ? (
              <WizardStep
                key={wizardState.currentStep}
                step={wizardState.currentStep}
                answers={wizardState.answers}
                updateAnswer={updateAnswer}
                onNext={nextStep}
                onPrev={prevStep}
                isGenerating={isGenerating}
                onApplyFromStep2={(wizardState.currentStep === 1 && (wizardState.answers.mode === 'improve' || wizardState.answers.mode === 'create')) ? handleApplyFromStep2 : undefined}
                onApplyAndGenerateFromStep2={wizardState.currentStep === 2 ? handleApplyAndGenerateFromStep2 : undefined}
                currentUser={currentUser}
                selectedModel={selectedModel}
              />
            ) : (
              <WizardSummary
                key="summary"
                generatedData={generatedData}
                wizardAnswers={wizardState.answers}
                currentUser={currentUser}
                selectedModel={selectedModel}
                onApply={handleApplyAndGenerate}
                onApplyOnly={handleApplyOnly}
                onStartOver={handleStartOver}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer removed for all single-step modes (improve and create) */}

      {/* Back Button for Quick Polish */}
      {wizardState.answers.mode === 'polish' && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => updateAnswer('mode', 'create')}
              disabled={isGenerating}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors disabled:opacity-50"
            >
              ← Back to Mode Selection
            </button>
          </div>
        </div>
      )}

      {/* Hidden Field Warning Modal */}
      {showHiddenFieldWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Some fields won't be applied
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  You're in <strong>{mode === 'quick' ? 'Quick' : mode === 'standard' ? 'Standard' : 'Advanced'}</strong> mode. <strong>{hiddenFields.length}</strong> field{hiddenFields.length !== 1 ? 's' : ''} will not be applied to the form.
                </p>
              </div>
            </div>

            <details className="bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <summary className="cursor-pointer p-3 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                Show hidden fields ({hiddenFields.length})
              </summary>
              <div className="p-3 pt-2 flex flex-wrap gap-1.5">
                {hiddenFields.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </details>

            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="dontShowAgain" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                Don't show this again for {mode === 'quick' ? 'Quick' : mode === 'standard' ? 'Standard' : 'Advanced'} mode
              </label>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  // Save preference if checked
                  if (dontShowAgain) {
                    const warningKey = `CZ_WIZARD_HIDE_FIELD_WARNING_${mode}`;
                    localStorage.setItem(warningKey, 'true');
                  }

                  // Switch to Advanced mode and apply all fields
                  if (pendingFullData && onApplyToForm) {
                    setMode('advanced');
                    onApplyToForm(pendingFullData);
                    toast.success('Switched to Advanced mode. All fields applied!');
                  }

                  setShowHiddenFieldWarning(false);
                  setHiddenFields([]);
                  setPendingApplyData(null);
                  setPendingFullData(null);
                  setDontShowAgain(false);
                  handleClose();
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
              >
                Switch to Advanced and apply all fields (recommended)
              </button>
              <button
                onClick={() => {
                  // Save preference if checked
                  if (dontShowAgain) {
                    const warningKey = `CZ_WIZARD_HIDE_FIELD_WARNING_${mode}`;
                    localStorage.setItem(warningKey, 'true');
                  }

                  // Apply only visible fields
                  if (pendingApplyData && onApplyToForm) {
                    onApplyToForm(pendingApplyData);
                    toast.success(`Configuration applied (${hiddenFields.length} hidden field${hiddenFields.length !== 1 ? 's' : ''} excluded)`);
                  }

                  setShowHiddenFieldWarning(false);
                  setHiddenFields([]);
                  setPendingApplyData(null);
                  setPendingFullData(null);
                  setDontShowAgain(false);
                  handleClose();
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Apply only visible fields
              </button>
              <button
                onClick={() => {
                  setShowHiddenFieldWarning(false);
                  setHiddenFields([]);
                  setPendingApplyData(null);
                  setPendingFullData(null);
                  setDontShowAgain(false);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default QuickSetupWizard;
