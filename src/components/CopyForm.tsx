import React, { useState, useEffect, useRef } from 'react';
import { FormState, User, Model, AiEngine } from '../types';
import { MODELS } from '../constants';
import { migrateModelToEngine } from '../lib/llm/modelRegistry';
import { DEFAULT_FORM_STATE } from '../constants';
import { GROUPED_PREFILLS } from '../constants/prefills';
import { toast } from 'react-hot-toast';
import { isFieldPopulated, countFilledFieldsInSection } from '../utils/formUtils';
import { checkUserAccess } from '../services/supabaseClient';
import { getSuggestions } from '../services/apiService';
import { useInputField } from '../hooks/useInputField';
import PrefillSelector from './PrefillSelector';
import SharedInputs from './SharedInputs';
import FeatureToggles from './FeatureToggles';
import GenerateButton from './GenerateButton';
import ClearButton from './ClearButton';
import SuggestionModal from './SuggestionModal';
import LoadingSpinner from './ui/LoadingSpinner';
import { Tooltip } from './ui/Tooltip';
import TemplateIndicator from './ui/TemplateIndicator';
import RequiredFieldIndicator from './ui/RequiredFieldIndicator';
import AiEngineSelector from './ui/AiEngineSelector';
import { Download, Upload, User as UserIcon, Plus, Zap, Save, Lightbulb, ChevronDown } from 'lucide-react';
import { Info as InfoIcon } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import FormModeToggle from './FormModeToggle';
import CustomerSelector from './ui/CustomerSelector';
import BrandVoiceSelector from './ui/BrandVoiceSelector';
import AiModelValidationModal from './AiModelValidationModal';
import CollapsibleSection from './ui/CollapsibleSection';
import { validateApiKey, getAvailableModels, getModelLabel } from '../services/api/modelValidation';
import { useMode, FormMode } from '../context/ModeContext';
import { isFieldVisible } from '../utils/fieldVisibility';
import { sessionManager } from '../services/sessionService';
import { getInputClassName, getTextareaClassName } from '../utils/inputHighlight';
import WordCounter from './ui/WordCounter';
import DynamicGuidance from './copy-maker/guidance/DynamicGuidance';

interface CopyFormProps {
  currentUser?: User;
  formState: FormState;
  setFormState: (state: FormState) => void;
  onGenerate: () => void;
  onClearAll: () => void;
  loadedTemplateId: string | null;
  setLoadedTemplateId: (id: string | null) => void;
  loadedTemplateName: string;
  setLoadedTemplateName: (name: string) => void;
  onEvaluateInputs?: () => void;
  onSaveTemplate?: () => void;
  isPrefillEditingMode?: boolean;
  loadFormStateFromPrefill?: (prefill: any) => void;
  projectDescriptionRef?: React.RefObject<HTMLInputElement>;
  businessDescriptionRef?: React.RefObject<HTMLTextAreaElement>;
  originalCopyRef?: React.RefObject<HTMLTextAreaElement>;
  expandedSections?: Record<string, boolean>;
  onToggleSection?: (key: string) => void;
  onModeChange?: (mode: FormMode) => void;
  onAccessDenied?: () => void;
}

const CopyForm: React.FC<CopyFormProps> = ({
  currentUser,
  formState,
  setFormState,
  onGenerate,
  onClearAll,
  loadedTemplateId,
  setLoadedTemplateId,
  loadedTemplateName,
  setLoadedTemplateName,
  onEvaluateInputs,
  onAccessDenied,
  onSaveTemplate,
  isPrefillEditingMode = false,
  loadFormStateFromPrefill,
  projectDescriptionRef,
  businessDescriptionRef,
  originalCopyRef,
  expandedSections = {},
  onToggleSection,
  onModeChange,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('');
  const sectionComboRef = useRef<HTMLDivElement>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [currentSuggestionField, setCurrentSuggestionField] = useState<string>('');
  const [showModelValidationModal, setShowModelValidationModal] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [availableModelsData, setAvailableModelsData] = useState<any[]>([]);
  const [attemptedModel, setAttemptedModel] = useState<Model>(formState.model);

  // Section combobox options
  const SECTION_OPTIONS = [
    'Hero Section', 'Landing Page', 'Homepage', 'Benefits', 'Features',
    'Services', 'About', 'Testimonials', 'FAQ', 'Full Copy',
    'Blog Post', 'Email', 'Ad / Paid Social', 'Product Page', 'Case Study', 'Other',
  ];

  // Close section dropdown on outside click
  useEffect(() => {
    if (!sectionDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (sectionComboRef.current && !sectionComboRef.current.contains(e.target as Node)) {
        setSectionDropdownOpen(false);
        setSectionFilter('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sectionDropdownOpen]);

  // Get mode from context
  const { mode, setMode } = useMode();

  // Migrate legacy model to new aiEngine on component mount or when model changes
  useEffect(() => {
    if (!formState.aiEngine && formState.model) {
      const migratedEngine = migrateModelToEngine(formState.model);
      console.log(`🔄 Migrating legacy model "${formState.model}" to engine "${migratedEngine}"`);
      setFormState({ ...formState, aiEngine: migratedEngine });
    }
  }, [formState.model]);

  // Input field hooks
  const projectDescriptionField = useInputField({
    value: formState.projectDescription || '',
    onChange: (value) => handleChange('projectDescription', value)
  });

  const briefDescriptionField = useInputField({
    value: formState.briefDescription || '',
    onChange: (value) => handleChange('briefDescription', value)
  });

  const productServiceNameField = useInputField({
    value: formState.productServiceName || '',
    onChange: (value) => handleChange('productServiceName', value)
  });

  // Handle form input changes
  const handleChange = (name: string, value: any) => {
    console.log('🎯 CopyForm handleChange called:', { name, value });
    {
      console.log('🎯 Setting form state with:', { [name]: value });
      setFormState(prev => {
        // Remove field from placeholder highlighting when user edits it
        const updatedFieldsWithPlaceholders = prev.fieldsWithPlaceholders?.filter(
          fieldName => fieldName !== name
        );

        return {
          ...prev,
          [name]: value,
          ...(name === 'keywords' ? { keywordsExplicit: true } : {}),
          fieldsWithPlaceholders: updatedFieldsWithPlaceholders
        };
      });
    }
    console.log('🎯 Form state update completed');
  };

  // Wrapper for standard HTML elements that pass event objects
  const handleChangeEvent = async (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    console.log('🎯 CopyForm handleChangeEvent called:', { name: e.target.name, value: e.target.value });

    // Special handling for model selection
    if (e.target.name === 'model') {
      const selectedModel = e.target.value as Model;
      await handleModelChange(selectedModel);
    } else {
      handleChange(e.target.name, e.target.value);
    }
  };

  // Handle AI engine selection (new simplified selector)
  const handleAiEngineChange = (newEngine: AiEngine) => {
    console.log('🔍 AI Engine changed to:', newEngine);
    handleChange('aiEngine', newEngine);

    // Also update legacy model field for backward compatibility
    const legacyModel = newEngine === 'claude' ? 'claude-sonnet-4-5' : 'gpt-4o';
    handleChange('model', legacyModel);

    toast.success(`Using ${newEngine === 'claude' ? 'Claude' : 'OpenAI'}`);
  };

  // Handle model selection with validation (legacy - for old model dropdown if still used)
  const handleModelChange = async (newModel: Model) => {
    console.log('🔍 Validating model:', newModel);
    setAttemptedModel(newModel);

    const validation = await validateApiKey(newModel);

    if (validation.isValid) {
      console.log('✅ Model validation passed:', newModel);
      handleChange('model', newModel);

      // Update aiEngine based on model selection
      const migratedEngine = migrateModelToEngine(newModel);
      handleChange('aiEngine', migratedEngine);

      toast.success(`Using ${getModelLabel(newModel)}`);
    } else {
      console.log('❌ Model validation failed:', validation.error);
      setValidationError(validation.error || 'Model unavailable');

      const availableModels = await getAvailableModels();
      setAvailableModelsData(availableModels.availableModels);
      setShowModelValidationModal(true);
    }
  };

  // Handle checkbox toggles
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle getting suggestions
  const onGetSuggestion = async (fieldType: string) => {
    if (!currentUser) {
      toast.error('Please log in to get suggestions.');
      return;
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        if (onAccessDenied) {
          onAccessDenied();
        } else {
          toast.error(accessResult.message);
        }
        return;
      }
    } catch (error) {
      console.error('Error checking user access for suggestions:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    const textToAnalyze = formState.briefDescription || formState.businessDescription || formState.originalCopy || '';

    if (!textToAnalyze.trim()) {
      toast.error('Please enter the text first.');
      return;
    }

    // Open modal immediately with loading state
    setCurrentSuggestions([]);
    setCurrentSuggestionField(fieldType);
    setShowSuggestionModal(true);
    setIsLoadingSuggestions(true);
    setActiveSuggestionField(fieldType);

    try {
      // Use existing session if available (suggestions work without session tracking)
      const actualSessionId = formState.sessionId || null;

      const suggestions = await getSuggestions(
        textToAnalyze,
        fieldType,
        formState.model,
        formState.language,
        currentUser,
        undefined,
        actualSessionId,
        formState.projectDescription
      );

      if (suggestions && suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
      } else {
        toast.info('No suggestions available for this field.');
        setShowSuggestionModal(false);
      }
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      toast.error(`Failed to get suggestions: ${error.message}`);
      setShowSuggestionModal(false);
    } finally {
      setIsLoadingSuggestions(false);
      setActiveSuggestionField(null);
    }
  };

  // Handle suggestion insertion
  const handleInsertSuggestions = (suggestions: string[]) => {
    try {
      if (suggestions.length === 0) {
        setShowSuggestionModal(false);
        return;
      }

      // Ensure we have a valid field name
      if (!currentSuggestionField) {
        console.error('No current suggestion field set');
        setShowSuggestionModal(false);
        toast.error('Error: No field selected');
        return;
      }

      // Get the current field value
      const currentValue = formState[currentSuggestionField as keyof FormState] as string || '';

      // Split current value by commas to get existing items
      const existingItems = currentValue
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // Filter out suggestions that already exist in the field
      const newSuggestions = suggestions.filter(
        suggestion => !existingItems.some(
          existing => existing.toLowerCase() === suggestion.toLowerCase()
        )
      );

      // Combine existing items with new suggestions
      const allItems = [...existingItems, ...newSuggestions];
      const fieldValue = allItems.join(', ');

      handleChange(currentSuggestionField, fieldValue);

      // Close modal first
      setShowSuggestionModal(false);

      // Then show toast
      const addedCount = newSuggestions.length;
      if (addedCount > 0) {
        toast.success(`${addedCount} new suggestion(s) added to ${currentSuggestionField}`);
      } else {
        toast.info('All selected suggestions were already in the field');
      }
    } catch (error) {
      console.error('Error inserting suggestions:', error);
      setShowSuggestionModal(false);
      toast.error('Failed to insert suggestions');
    }
  };

  // Handle exporting form as JSON
  const handleExportForm = () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        tab: formState.tab,
        language: formState.language,
        tone: formState.tone,
        wordCount: formState.wordCount,
        customWordCount: formState.customWordCount,
        businessDescription: formState.businessDescription,
        originalCopy: formState.originalCopy,
        pageType: formState.pageType,
        section: formState.section,
        productServiceName: formState.productServiceName,
        briefDescription: formState.briefDescription,
        projectDescription: formState.projectDescription,
        excludedTerms: formState.excludedTerms,
        industryNiche: formState.industryNiche,
        targetAudience: formState.targetAudience,
        readerFunnelStage: formState.readerFunnelStage,
        competitorUrls: formState.competitorUrls,
        targetAudiencePainPoints: formState.targetAudiencePainPoints,
        competitorCopyText: formState.competitorCopyText,
        keyMessage: formState.keyMessage,
        callToAction: formState.callToAction,
        desiredEmotion: formState.desiredEmotion,
        brandValues: formState.brandValues,
        keywords: formState.keywords,
        context: formState.context,
        toneLevel: formState.toneLevel,
        preferredWritingStyle: formState.preferredWritingStyle,
        languageStyleConstraints: formState.languageStyleConstraints,
        outputStructure: formState.outputStructure,
        generateSeoMetadata: formState.generateSeoMetadata,
        generateScores: formState.generateScores,
        generateGeoScore: formState.generateGeoScore,
        prioritizeWordCount: formState.prioritizeWordCount,
        wordCountTolerancePercentage: formState.wordCountTolerancePercentage,
        adhereToLittleWordCount: formState.adhereToLittleWordCount,
        littleWordCountTolerancePercentage: formState.littleWordCountTolerancePercentage,
        forceElaborationsExamples: formState.forceElaborationsExamples,
        enhanceForGEO: formState.enhanceForGEO,
        addTldrSummary: formState.addTldrSummary,
        geoRegions: formState.geoRegions,
        numUrlSlugs: formState.numUrlSlugs,
        numMetaDescriptions: formState.numMetaDescriptions,
        numH1Variants: formState.numH1Variants,
        numH2Variants: formState.numH2Variants,
        numH3Variants: formState.numH3Variants,
        numOgTitles: formState.numOgTitles,
        numOgDescriptions: formState.numOgDescriptions,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.email || 'unknown'
      };
      
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const projectDesc = formState.projectDescription?.trim() || formState.briefDescription?.trim() || 'Untitled Project';
      const filename = `${projectDesc} & ${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Form exported as JSON!');
    } catch (error) {
      console.error('Error exporting form:', error);
      toast.error('Failed to export form');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle importing form from JSON
  const handleImportForm = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsImporting(true);
      
      try {
        const text = await file.text();
        const importedData = JSON.parse(text);
        
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Invalid JSON structure');
        }
        
        const newFormState: FormState = {
          ...DEFAULT_FORM_STATE,
          ...importedData,
          isLoading: false,
          isEvaluating: false,
          generationProgress: [],
          copyResult: DEFAULT_FORM_STATE.copyResult,
          promptEvaluation: undefined,
          sessionId: undefined
        };
        
        setFormState(newFormState);
        setLoadedTemplateId(null);
        setLoadedTemplateName('');
        
        toast.success(`Form imported from ${file.name}! Ready to generate new copy.`);
      } catch (error) {
        console.error('Error importing form:', error);
        toast.error('Failed to import form. Please check the JSON file format.');
      } finally {
        setIsImporting(false);
      }
    };
    
    input.click();
  };

  // Calculate filled field counts for each section
  // Section 1 includes: model, customerId, brandVoiceId, projectDescription, productServiceName, businessDescription/originalCopy, section, excludedTerms
  const section1Fields = ['model', 'customerId', 'brandVoiceId', 'projectDescription', 'productServiceName',
    formState.tab === 'improve' ? 'originalCopy' : 'businessDescription', 'section', 'excludedTerms'];
  const section1Count = countFilledFieldsInSection(formState, section1Fields);

  // Check if form is complete enough to generate
  const isFormComplete = () => {
    const hasProjectDescription = formState.projectDescription?.trim();
    const hasProductServiceName = formState.productServiceName?.trim();

    if (formState.tab === 'create') {
      const hasBusinessDescription = formState.businessDescription?.trim();
      return !!(hasProjectDescription && hasProductServiceName && hasBusinessDescription);
    } else {
      const hasOriginalCopy = formState.originalCopy?.trim();
      return !!(hasProjectDescription && hasProductServiceName && hasOriginalCopy);
    }
  };

  // Check if required fields are empty (for disabling suggestion buttons)
  const areRequiredFieldsEmpty = () => {
    const hasProjectDescription = formState.projectDescription?.trim();
    const hasProductServiceName = formState.productServiceName?.trim();

    if (formState.tab === 'create') {
      const hasBusinessDescription = formState.businessDescription?.trim();
      return !(hasProjectDescription && hasProductServiceName && hasBusinessDescription);
    } else {
      const hasOriginalCopy = formState.originalCopy?.trim();
      return !(hasProjectDescription && hasProductServiceName && hasOriginalCopy);
    }
  };

  // Handle content type button click
  const handleContentTypeClick = (prefillId: string) => {
    // Find the prefill across all groups
    let selectedPrefill = null;
    for (const group of GROUPED_PREFILLS) {
      const found = group.options.find(prefill => prefill.id === prefillId);
      if (found) {
        selectedPrefill = found;
        break;
      }
    }
    
    if (!selectedPrefill) return;

    // Use the existing prefill loading function if available
    if (loadFormStateFromPrefill) {
      loadFormStateFromPrefill({
        id: selectedPrefill.id,
        label: selectedPrefill.label,
        data: selectedPrefill.data
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Mode Toggle */}
      <FormModeToggle mode={mode} onModeChange={onModeChange ?? setMode} />

      {/* SECTION 1 — What You're Creating */}
      <CollapsibleSection
        title="What You're Creating"
        isExpanded={true}
        onToggle={() => onToggleSection?.('what-youre-creating')}
        filledCount={section1Count}
      >
        {/* AI Engine Selection */}
        <div className="mb-6">
          <AiEngineSelector
            value={formState.aiEngine || 'claude'}
            onChange={handleAiEngineChange}
          />
        </div>

          {/* Customer Selection - Hidden in Quick Mode */}
          {isFieldVisible('customerId', mode) && (
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <label htmlFor="customer" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Customer
              </label>
              <Tooltip content="Select a customer or client for this project. This helps you organize and track copy by customer. You can also add new customers on the fly.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
              <TemplateIndicator show={formState.templatePrefilledFields?.includes('customerId') || false} />
            </div>
            <CustomerSelector
              value={formState.customerId}
              onChange={(customerId, customerName) => {
                handleChange('customerId', customerId);
                handleChange('customerName', customerName);
                if (!customerId) {
                  handleChange('brandVoiceId', '');
                }
              }}
              currentUserId={currentUser?.id}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Optional: Helps organize projects by customer or client
            </p>
          </div>
          )}

          {/* Brand Voice Selector - Hidden in Quick Mode, only shown when customer is selected in Standard/Advanced */}
          {isFieldVisible('brandVoiceId', mode) && formState.customerId && (
            <div className="mb-6">
              <BrandVoiceSelector
                customerId={formState.customerId}
                value={formState.brandVoiceId}
                onChange={(brandVoiceId) => handleChange('brandVoiceId', brandVoiceId)}
              />
            </div>
          )}

          {/* Project Description */}
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <label htmlFor="projectDescription" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Project Description<RequiredFieldIndicator />
              </label>
              <Tooltip content="Internal field for your organization - not sent to AI. Helps you identify and manage projects in your dashboard. Use descriptive names like 'Homepage redesign Q1 2025' or 'Product launch email sequence' to easily find your work later.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
              <TemplateIndicator show={formState.templatePrefilledFields?.includes('projectDescription') || false} />
            </div>
            <input
              type="text"
              id="projectDescription"
              name="projectDescription"
              required
              className={getInputClassName('projectDescription', formState.fieldsWithPlaceholders, undefined, projectDescriptionField.inputValue)}
              placeholder="e.g., Homepage redesign, Product launch copy, Email campaign"
              value={projectDescriptionField.inputValue}
              onChange={projectDescriptionField.handleChange}
              onBlur={projectDescriptionField.handleBlur}
              ref={projectDescriptionRef}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Internal field for your organization - not sent to AI. Helps you identify and manage projects.
            </p>
          </div>

          {/* Product/Service Name */}
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <label htmlFor="productServiceName" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Product/Service Name<RequiredFieldIndicator />
              </label>
              <Tooltip content="Specify the exact name of what you're promoting to ensure accurate, branded content. This helps the AI reference your product/service correctly throughout the copy and maintain consistent branding and messaging.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
              <TemplateIndicator show={formState.templatePrefilledFields?.includes('productServiceName') || false} />
            </div>
            <input
              type="text"
              id="productServiceName"
              name="productServiceName"
              required
              className={getInputClassName('productServiceName', formState.fieldsWithPlaceholders, undefined, productServiceNameField.inputValue)}
              placeholder="Enter product or service name"
              value={productServiceNameField.inputValue}
              onChange={productServiceNameField.handleChange}
              onBlur={productServiceNameField.handleBlur}
            />
          </div>

          {/* Mode Selector */}
          <div className="mb-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="makeNewCopy"
                  name="copyMode"
                  checked={formState.tab !== 'improve'}
                  onChange={() => {
                    setFormState(prev => ({
                      ...prev,
                      tab: 'create'
                    }));
                  }}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-primary-500"
                />
                <Label htmlFor="makeNewCopy" className="text-sm font-normal text-gray-500 dark:text-gray-400 cursor-pointer">
                  Make new copy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="improveExisting"
                  name="copyMode"
                  checked={formState.tab === 'improve'}
                  onChange={() => {
                    setFormState(prev => ({
                      ...prev,
                      tab: 'improve'
                    }));
                  }}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-primary-500"
                />
                <Label htmlFor="improveExisting" className="text-sm font-normal text-gray-500 dark:text-gray-400 cursor-pointer">
                  Improve existing copy
                </Label>
              </div>
            </div>
          </div>

          {/* Conditional Content Field */}
          {formState.tab === 'improve' ? (
            // Original Copy field (for improving existing copy)
            <div className="mb-6">
              <div className="flex items-center mb-1">
                <label htmlFor="originalCopy" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Original Copy<RequiredFieldIndicator />
                </label>
                <Tooltip content="Paste your existing copy here to improve it. The AI will enhance, refine, and optimize your content while maintaining your core message.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <InfoIcon size={14} />
                  </button>
                </Tooltip>
                <TemplateIndicator show={formState.templatePrefilledFields?.includes('originalCopy') || false} />
              </div>
              <textarea
                id="originalCopy"
                name="originalCopy"
                rows={8}
                required
                className={getTextareaClassName('originalCopy', formState.fieldsWithPlaceholders, undefined, formState.originalCopy || '')}
                placeholder="Paste your existing copy here to improve it..."
                value={formState.originalCopy || ''}
                onChange={handleChangeEvent}
                ref={originalCopyRef}
              ></textarea>
              <div className="mt-1">
                <WordCounter text={formState.originalCopy || ''} />
              </div>
              {!formState.originalCopy?.trim() && (
                <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-300 dark:text-gray-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  You can also paste a URL — we'll pull the page copy in automatically.
                </p>
              )}
            </div>
          ) : (
            // Business Description field (for generating new copy)
            <div className="mb-6">
              <div className="flex items-center mb-1">
                <label htmlFor="businessDescription" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Business Description<RequiredFieldIndicator />
                </label>
                <Tooltip content="Describe your business, product, or service. The AI will use this as context to generate compelling marketing copy tailored to your offering.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <InfoIcon size={14} />
                  </button>
                </Tooltip>
                <TemplateIndicator show={formState.templatePrefilledFields?.includes('businessDescription') || false} />
              </div>
              <textarea
                id="businessDescription"
                name="businessDescription"
                rows={8}
                required
                className={getTextareaClassName('businessDescription', formState.fieldsWithPlaceholders, undefined, formState.businessDescription || '')}
                placeholder="Describe your business, product, or service..."
                value={formState.businessDescription || ''}
                onChange={handleChangeEvent}
                ref={businessDescriptionRef}
              ></textarea>
              <div className="mt-1">
                <WordCounter text={formState.businessDescription || ''} />
              </div>
            </div>
          )}

          {/* Section */}
          {isFieldVisible('section', mode) && (
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <label htmlFor="section" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Section
              </label>
              <Tooltip content="The specific section within a page type for focused guidance. Examples: Hero Section for attention-grabbing openings, Benefits for value propositions, Features for capabilities, FAQ for addressing objections.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
              <TemplateIndicator show={formState.templatePrefilledFields?.includes('section') || false} />
            </div>
            <div ref={sectionComboRef} className="relative">
              <div className="relative">
                <input
                  type="text"
                  id="section"
                  name="section"
                  autoComplete="off"
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 pr-8"
                  value={sectionDropdownOpen ? sectionFilter : (formState.section || '')}
                  onChange={(e) => {
                    setSectionFilter(e.target.value);
                    handleChange('section', e.target.value);
                  }}
                  onFocus={() => {
                    setSectionFilter(formState.section || '');
                    setSectionDropdownOpen(true);
                  }}
                  placeholder="e.g., Hero Section, Benefits, Features, FAQ..."
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    if (sectionDropdownOpen) {
                      setSectionDropdownOpen(false);
                      setSectionFilter('');
                    } else {
                      setSectionFilter(formState.section || '');
                      setSectionDropdownOpen(true);
                    }
                  }}
                  className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <ChevronDown size={14} className={`transition-transform duration-150 ${sectionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {sectionDropdownOpen && (() => {
                const query = sectionFilter.toLowerCase();
                const filtered = SECTION_OPTIONS.filter(o => o.toLowerCase().includes(query));
                if (filtered.length === 0) return null;
                return (
                  <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-y-auto py-1">
                    {filtered.map(option => {
                      const isSelected = (formState.section || '') === option;
                      return (
                        <li key={option}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleChange('section', option);
                              setSectionDropdownOpen(false);
                              setSectionFilter('');
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              isSelected
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {option}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          </div>
          )}

          {/* Exclude Specific Terms */}
          {isFieldVisible('excludedTerms', mode) && (
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <label htmlFor="excludedTerms" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Exclude specific terms from output
              </label>
              <Tooltip content="List words, phrases, competitor names, or any terms you don't want the AI to include in the generated copy. The AI will use alternative terminology or avoid these topics entirely while maintaining the message effectiveness.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
            </div>
            <textarea
              id="excludedTerms"
              name="excludedTerms"
              rows={2}
              className={getTextareaClassName('excludedTerms', formState.fieldsWithPlaceholders, undefined, formState.excludedTerms || '')}
              placeholder="e.g., competitor names, terms to avoid..."
              value={formState.excludedTerms || ''}
              onChange={handleChangeEvent}
            ></textarea>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            List words or brand names you don't want the AI to include in the generated copy, separated by commas
          </p>
        </div>
        )}
      </CollapsibleSection>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-800"></div>

      {/* Shared Inputs - Contains Sections 2, 3, 4 */}
      <SharedInputs
        formData={formState}
        handleChange={handleChange}
        handleToggle={handleToggle}
        currentUser={currentUser}
        onGetSuggestion={onGetSuggestion}
        isLoadingSuggestions={isLoadingSuggestions}
        activeSuggestionField={activeSuggestionField}
        mode={mode}
        setFormState={setFormState}
        areRequiredFieldsEmpty={areRequiredFieldsEmpty()}
        expandedSections={expandedSections}
        onToggleSection={onToggleSection}
      />

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-800"></div>

      {/* Feature Toggles */}
      <FeatureToggles
        formData={formState}
        handleToggle={handleToggle}
        handleChange={handleChange}
        mode={mode}
        expandedSections={expandedSections}
        onToggleSection={onToggleSection}
        currentUserId={currentUser?.id}
      />

      {/* Dynamic Hint */}
      {!isPrefillEditingMode && (() => {
        const outputCount = formState.copyResult?.generatedVersions?.length ?? 0;
        return (
          <DynamicGuidance
            outputCount={outputCount}
            tab={formState.tab === 'improve' ? 'improve' : 'create'}
            compareActive={mode === 'compare'}
            onGenerateAnother={outputCount === 1 ? onGenerate : undefined}
          />
        );
      })()}

      {/* Action Buttons */}
      {!isPrefillEditingMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <div className="relative">
            <GenerateButton
              onClick={onGenerate}
              isLoading={formState.isLoading}
              isDisabled={!isFormComplete()}
            />
            {!isFormComplete() && (
              <Tooltip content={formState.tab === 'create'
                ? "Fill in Project Description, Product/Service Name, and Business Description first"
                : "Fill in Project Description, Product/Service Name, and Original Copy first"}>
                <div className="absolute inset-0 cursor-not-allowed" />
              </Tooltip>
            )}
          </div>
          <ClearButton
            onClick={onClearAll}
            isDisabled={formState.isLoading}
          />
        </div>
      )}


      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <SuggestionModal
          fieldType={currentSuggestionField}
          suggestions={currentSuggestions}
          onClose={() => setShowSuggestionModal(false)}
          onInsert={handleInsertSuggestions}
          isLoading={isLoadingSuggestions}
        />
      )}

      {/* AI Model Validation Modal */}
      <AiModelValidationModal
        isOpen={showModelValidationModal}
        onClose={() => setShowModelValidationModal(false)}
        selectedModel={attemptedModel}
        selectedModelLabel={getModelLabel(attemptedModel)}
        availableModels={availableModelsData}
        onSelectModel={(model: Model) => {
          handleChange('model', model);
          toast.success(`Switched to ${getModelLabel(model)}`);
        }}
        errorMessage={validationError}
      />
    </div>
  );
};

export default CopyForm;