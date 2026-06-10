import React, { useState, useEffect, useRef } from 'react';
import { FormState } from '../types';
import { LANGUAGES, TONES, WORD_COUNTS, OUTPUT_STRUCTURE_OPTIONS, INDUSTRY_NICHE_CATEGORIES, READER_FUNNEL_STAGES, PREFERRED_WRITING_STYLES, LANGUAGE_STYLE_CONSTRAINTS } from '../constants';
import { PlusCircle, X, Zap, Info as InfoIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInputField } from '../hooks/useInputField';
import DraggableStructuredInput from './ui/DraggableStructuredInput';
import TagInput from './ui/TagInput';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import SuggestionButton from './ui/SuggestionButton';
import ContentQualityIndicator from './ui/ContentQualityIndicator';
import { Tooltip } from './ui/Tooltip';
import CategoryTagsInput from './ui/CategoryTagsInput';
import TemplateIndicator from './ui/TemplateIndicator';
import { calculateTargetWordCount } from '../services/api/utils';
import { isFieldPopulated, isFieldUserModified, hasPopulatedCompetitorUrls, countFilledFieldsInSection } from '../utils/formUtils';
import SpecialInstructionsField from './ui/SpecialInstructionsField';
import { FormMode } from '../context/ModeContext';
import CollapsibleSection from './ui/CollapsibleSection';
import { isFieldVisible, hasSectionVisibleFields } from '../utils/fieldVisibility';
import { getInputClassName, getTextareaClassName } from '../utils/inputHighlight';

interface SharedInputsProps {
  formData: FormState;
 handleChange: (name: string, value: any) => void;
  handleToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentUser?: any;
  onGetSuggestion: (fieldType: string) => Promise<void>;
  isLoadingSuggestions: boolean;
  activeSuggestionField: string | null;
  mode: FormMode;
  setFormState: (formState: FormState) => void;
  isBusinessDescriptionEmpty?: boolean;
  expandedSections?: Record<string, boolean>;
  onToggleSection?: (key: string) => void;
}

const SharedInputs: React.FC<SharedInputsProps> = ({
  formData,
  handleChange,
  handleToggle,
  currentUser,
  onGetSuggestion,
  isLoadingSuggestions,
  activeSuggestionField,
  mode,
  setFormState,
  isBusinessDescriptionEmpty = false,
  expandedSections = {},
  onToggleSection
}) => {
  // Use input field hooks for competitor URLs
  const competitorUrl1Field = useInputField({
    value: formData.competitorUrls[0] || '',
    onChange: (value) => {
      const newUrls = [...formData.competitorUrls];
      newUrls[0] = value;
      handleChange('competitorUrls', newUrls);
    }
  });
  
  const competitorUrl2Field = useInputField({
    value: formData.competitorUrls[1] || '',
    onChange: (value) => {
      const newUrls = [...formData.competitorUrls];
      newUrls[1] = value;
      handleChange('competitorUrls', newUrls);
    }
  });
  
  const competitorUrl3Field = useInputField({
    value: formData.competitorUrls[2] || '',
    onChange: (value) => {
      const newUrls = [...formData.competitorUrls];
      newUrls[2] = value;
      handleChange('competitorUrls', newUrls);
    }
  });

  // Use input field hooks for new fields
  const competitorCopyTextField = useInputField({
    value: formData.competitorCopyText || '',
    onChange: (value) => handleChange('competitorCopyText', value)
  });

  const targetAudiencePainPointsField = useInputField({
    value: formData.targetAudiencePainPoints || '',
    onChange: (value) => handleChange('targetAudiencePainPoints', value)
  });

  // Use input field hook for location
  const locationField = useInputField({
    value: formData.location || '',
    onChange: (value) => handleChange('location', value)
  });

  // Use input field hook for geoRegions
  const geoRegionsField = useInputField({
    value: formData.geoRegions || '',
    onChange: (value) => handleChange('geoRegions', value)
  });

  // Moved fields from CreateCopyForm and ImproveCopyForm
  const targetAudienceField = useInputField({
    value: formData.targetAudience || '',
    onChange: (value) => handleChange('targetAudience', value)
  });
  
  const keyMessageField = useInputField({
    value: formData.keyMessage || '',
    onChange: (value) => handleChange('keyMessage', value)
  });
  
  const desiredEmotionField = useInputField({
    value: formData.desiredEmotion || '',
    onChange: (value) => handleChange({ target: { name: 'desiredEmotion', value } } as any)
  });
  
  const callToActionField = useInputField({
    value: formData.callToAction || '',
    onChange: (value) => handleChange('callToAction', value)
  });
  
  const brandValuesField = useInputField({
    value: formData.brandValues || '',
    onChange: (value) => handleChange({ target: { name: 'brandValues', value } } as any)
  });
  
  const keywordsField = useInputField({
    value: formData.keywords || '',
    onChange: (value) => handleChange('keywords', value)
  });
  
  const contextField = useInputField({
    value: formData.context || '',
    onChange: (value) => handleChange('context', value)
  });

  const specialInstructionsField = useInputField({
    value: formData.specialInstructions || '',
    onChange: (value) => handleChange('specialInstructions', value)
  });

  // Use the input field hook for the custom word count field
  const customWordCountField = useInputField({
    value: formData.customWordCount?.toString() || '',
    onChange: (value) => handleChange('customWordCount', value ? parseInt(value) : 150)
  });

  // Handler for output structure change
  const handleStructureChange = (values: any) => {
    console.log('🚀 handleStructureChange called with:', values);
   handleChange('outputStructure', values);
    console.log('🚀 handleChange called with outputStructure');
  };

  // Handle industry niche change
  const handleIndustryNicheChange = (value: string) => {
   handleChange('industryNiche', value);
  };

  // Handle reader funnel stage change
  const handleReaderFunnelStageChange = (value: string) => {
   handleChange('readerFunnelStage', value);
  };

  // Handle preferred writing style change
  const handlePreferredWritingStyleChange = (value: string) => {
   handleChange('preferredWritingStyle', value);
  };

  // Handle tone level change
  const handleToneLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange('toneLevel', parseInt(e.target.value));
  };

  // Handle language style constraints change
  const handleLanguageStyleConstraintChange = (constraint: string) => {
    const constraints = formData.languageStyleConstraints || [];
    const updatedConstraints = constraints.includes(constraint)
      ? constraints.filter(c => c !== constraint)
      : [...constraints, constraint];

    handleChange('languageStyleConstraints', updatedConstraints);
  };

  // Calculate the total word count from structure elements
  const totalStructureWordCount = React.useMemo(() => {
    if (!formData.outputStructure || formData.outputStructure.length === 0) {
      return 0;
    }
    
    return formData.outputStructure.reduce((sum, element) => {
      return sum + (element.wordCount || 0);
    }, 0);
  }, [formData.outputStructure]);
  
  // Calculate the effective target word count using the shared utility function
  const effectiveTargetWordCount = calculateTargetWordCount(formData).target;

  // Check if any field in the Copy Targeting section is populated
  const hasPopulatedCopyTargetingFields = () => {
    return isFieldPopulated(formData.industryNiche) ||
           isFieldPopulated(formData.targetAudience) ||
           isFieldPopulated(formData.readerFunnelStage) ||
           hasPopulatedCompetitorUrls(formData.competitorUrls) ||
           isFieldPopulated(formData.targetAudiencePainPoints) ||
           isFieldPopulated(formData.competitorCopyText);
  };

  // Check if any field in the Strategic Messaging section is populated
  const hasPopulatedStrategicMessagingFields = () => {
    return isFieldPopulated(formData.keyMessage) ||
           isFieldPopulated(formData.desiredEmotion) ||
           isFieldPopulated(formData.callToAction) ||
           isFieldPopulated(formData.brandValues) ||
           isFieldPopulated(formData.keywords) ||
           isFieldPopulated(formData.context) ||
           isFieldPopulated(formData.specialInstructions);
  };

  // Check if any field in the Tone & Style section is populated
  const hasPopulatedToneAndStyleFields = () => {
    return isFieldUserModified('language', formData.language) ||
           isFieldUserModified('tone', formData.tone) ||
           isFieldUserModified('wordCount', formData.wordCount) ||
           isFieldPopulated(formData.customWordCount) ||
           isFieldUserModified('toneLevel', formData.toneLevel) ||
           isFieldPopulated(formData.preferredWritingStyle) ||
           isFieldPopulated(formData.languageStyleConstraints) ||
           isFieldPopulated(formData.outputStructure);
  };

  // Define section fields for visibility checks
  const section2Fields = ['industryNiche', 'targetAudience', 'readerFunnelStage', 'competitorUrls', 'targetAudiencePainPoints', 'competitorCopyText'];
  const section3Fields = ['language', 'tone', 'wordCount', 'customWordCount', 'toneLevel', 'preferredWritingStyle', 'languageStyleConstraints', 'outputStructure', 'includeSectionTitles'];
  const section4Fields = ['keyMessage', 'desiredEmotion', 'callToAction', 'brandValues', 'keywords', 'context', 'specialInstructions'];

  // Calculate filled field counts for each section
  const section2Count = countFilledFieldsInSection(formData, section2Fields);
  const section3Count = countFilledFieldsInSection(formData, section3Fields);
  const section4Count = countFilledFieldsInSection(formData, section4Fields);

  return (
    <>
      {/* SECTION 2 — Audience & Targeting */}
      {hasSectionVisibleFields(section2Fields, mode) && (
      <CollapsibleSection
        title="Audience & Targeting"
        isExpanded={true}
        onToggle={() => onToggleSection?.('audience-targeting')}
        filledCount={section2Count}
      >
        {/* Industry/Niche - ADVANCED MODE ONLY */}
        {isFieldVisible('industryNiche', mode) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center mb-1">
              <label htmlFor="industryNiche" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Industry/Niche
              </label>
              <Tooltip content="Select your industry or add a custom one to ensure the AI uses appropriate terminology, industry-specific language, and relevant examples. This helps generate copy that resonates with your specific market and demonstrates industry expertise.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <TemplateIndicator show={formData.templatePrefilledFields?.includes('industryNiche') || false} />
            </div>
            <div className="flex items-center">
            <SuggestionButton
              fieldType="industryNiche"
              businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'industryNiche'}
              isDisabled={isBusinessDescriptionEmpty}
            />
            </div>
          </div>
          <CategoryTagsInput
            id="industryNiche"
            name="industryNiche"
            placeholder="Select industry/niche..."
            value={formData.industryNiche || ''}
            onChange={handleIndustryNicheChange}
            categories={INDUSTRY_NICHE_CATEGORIES}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select your industry or add a custom one to get more targeted copy
          </p>
        </div>
        )}

        {/* Target Audience */}
        {isFieldVisible('targetAudience', mode) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center mb-1">
              <label htmlFor="targetAudience" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Target Audience
              </label>
              <Tooltip content="Define your ideal readers with specific demographics, psychographics, and pain points. Include age ranges, job titles, company size, challenges they face, and what motivates them. The more specific this is, the more targeted and compelling your copy will be.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <TemplateIndicator show={formData.templatePrefilledFields?.includes('targetAudience') || false} />
            </div>
            <div className="flex items-center">
            <SuggestionButton
              fieldType="targetAudience"
              businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'targetAudience'}
              currentUser={currentUser}
              isDisabled={isBusinessDescriptionEmpty}
            />
            </div>
          </div>
          <textarea
            id="targetAudience"
            name="targetAudience"
            rows={3}
            className={getTextareaClassName('targetAudience', formData.fieldsWithPlaceholders, undefined, targetAudienceField.inputValue)}
            placeholder="Describe who this copy is targeting (age, interests, pain points, etc.)..."
            value={targetAudienceField.inputValue}
            onChange={targetAudienceField.handleChange}
            onBlur={targetAudienceField.handleBlur}
          ></textarea>
        </div>
        )}

        {/* Reader's Stage in Funnel - ADVANCED MODE ONLY */}
        {isFieldVisible('readerFunnelStage', mode) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center mb-1">
              <label htmlFor="readerFunnelStage" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Reader's Stage in Funnel
              </label>
              <Tooltip content="Where your audience is in their buyer's journey affects messaging approach and urgency. Awareness stage needs educational content, Consideration requires comparison and benefits, Decision needs urgency and clear CTAs, Retention focuses on value reinforcement.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <TemplateIndicator show={formData.templatePrefilledFields?.includes('readerFunnelStage') || false} />
            </div>
            <div className="flex items-center">
            <SuggestionButton
              fieldType="readerFunnelStage"
              businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'readerFunnelStage'}
              isDisabled={isBusinessDescriptionEmpty}
            />
            </div>
          </div>
          <TagInput
            id="readerFunnelStage"
            name="readerFunnelStage"
            placeholder="e.g., Awareness, Consideration, Decision..."
            value={formData.readerFunnelStage || ''}
            onChange={handleReaderFunnelStageChange}
          />
        </div>
        )}

        {/* Competitor URLs - STANDARD & ADVANCED */}
        {isFieldVisible('competitorUrls', mode) && (
        <div className="mb-6">
          <div className="flex items-center mb-1">
            <label className="block text-sm font-normal text-gray-500 dark:text-gray-400">
              Competitor URLs (Optional)
            </label>
            <Tooltip content="Up to 3 competitor website URLs for the AI to analyze for differentiation opportunities. The AI will consider their messaging approach and create copy that stands out while addressing similar audience needs.">
              <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                <InfoIcon className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
          <div className="space-y-2">
            <input
              id="competitorUrl1"
              type="url"
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor1.com"
              value={competitorUrl1Field.inputValue}
              onChange={competitorUrl1Field.handleChange}
              onBlur={competitorUrl1Field.handleBlur}
            />
            <input
              id="competitorUrl2"
              type="url"
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor2.com"
              value={competitorUrl2Field.inputValue}
              onChange={competitorUrl2Field.handleChange}
              onBlur={competitorUrl2Field.handleBlur}
            />
            <input
              id="competitorUrl3"
              type="url"
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor3.com"
              value={competitorUrl3Field.inputValue}
              onChange={competitorUrl3Field.handleChange}
              onBlur={competitorUrl3Field.handleBlur}
            />
          </div>
        </div>
        )}

        {/* Target Audience Pain Points - STANDARD & ADVANCED */}
        {isFieldVisible('targetAudiencePainPoints', mode) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center mb-1">
              <label htmlFor="targetAudiencePainPoints" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Target Audience Pain Points
              </label>
              <Tooltip content="Specific problems or challenges your audience faces that your solution addresses. This helps the AI create empathetic, problem-focused copy that connects emotionally and positions your solution as the answer to their struggles.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <TemplateIndicator show={formData.templatePrefilledFields?.includes('targetAudiencePainPoints') || false} />
            </div>
            <div className="flex items-center">
            <SuggestionButton
              fieldType="targetAudiencePainPoints"
              businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'targetAudiencePainPoints'}
              isDisabled={isBusinessDescriptionEmpty}
            />
            </div>
          </div>
          <textarea
            id="targetAudiencePainPoints"
            name="targetAudiencePainPoints"
            rows={4}
            className={getTextareaClassName('targetAudiencePainPoints', formData.fieldsWithPlaceholders, undefined, targetAudiencePainPointsField.inputValue)}
            placeholder="List any specific pain points or challenges that the target audience likely faces..."
            value={targetAudiencePainPointsField.inputValue}
            onChange={targetAudiencePainPointsField.handleChange}
            onBlur={targetAudiencePainPointsField.handleBlur}
          ></textarea>
        </div>
        )}

        {/* Competitor Copy (Text) - ADVANCED MODE ONLY */}
        {isFieldVisible('competitorCopyText', mode) && (
        <div className="mb-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center mb-1">
                <label htmlFor="competitorCopyText" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Competitor Copy (Text)
                </label>
                <Tooltip content="Paste competitor copy text that you want to outperform or differentiate from. The AI will analyze their approach and create superior copy that addresses the same audience needs but with better messaging, stronger benefits, and more compelling calls to action.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
                <TemplateIndicator show={formData.templatePrefilledFields?.includes('competitorCopyText') || false} />
              </div>
              <div className="flex items-center">
              <SuggestionButton
                fieldType="competitorCopyText"
                businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'competitorCopyText'}
                currentUser={currentUser}
                isDisabled={isBusinessDescriptionEmpty}
              />
              </div>
            </div>
            <textarea
              id="competitorCopyText"
              name="competitorCopyText"
              rows={4}
              className={getTextareaClassName('competitorCopyText', formData.fieldsWithPlaceholders, undefined, competitorCopyTextField.inputValue)}
              placeholder="Paste the copy you want to outperform..."
              value={competitorCopyTextField.inputValue}
              onChange={competitorCopyTextField.handleChange}
              onBlur={competitorCopyTextField.handleBlur}
            ></textarea>
          </div>
        </div>
        )}
      </CollapsibleSection>
      )}

      {/* Divider */}
      {hasSectionVisibleFields(section2Fields, mode) && hasSectionVisibleFields(section3Fields, mode) && (
        <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
      )}

      {/* SECTION 3 — Tone & Style */}
      {hasSectionVisibleFields(section3Fields, mode) && (
      <CollapsibleSection
        title="Tone & Style"
        isExpanded={true}
        onToggle={() => onToggleSection?.('tone-style')}
        filledCount={section3Count}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Language Dropdown */}
          {isFieldVisible('language', mode) && (
          <div>
            <div className="flex items-center mb-1">
              <label htmlFor="language" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Language
              </label>
              <Tooltip content="Choose from 6 supported languages for content generation. The AI will generate copy in the selected language with appropriate cultural nuances, idioms, and communication styles that resonate with native speakers.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            <select
              id="language"
              name="language"
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Tone Dropdown */}
          {isFieldVisible('tone', mode) && (
          <div>
            <div className="flex items-center mb-1">
              <label htmlFor="tone" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Tone
              </label>
              <Tooltip content="Overall writing style that influences vocabulary choice, sentence structure, and communication approach. Professional uses formal language, Friendly is approachable and warm, Bold is confident and direct, Minimalist is clean and essential.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            <select
              id="tone"
              name="tone"
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              value={formData.tone}
              onChange={(e) => handleChange('tone', e.target.value)}
            >
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Word Count Dropdown */}
          {isFieldVisible('wordCount', mode) && (
          <div>
            <div className="flex items-center mb-1">
              <label htmlFor="wordCount" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Target Word Count
              </label>
              <Tooltip content="Specify desired content length. Short (50-100) for headlines and CTAs, Medium (100-200) for product descriptions, Long (200-400) for detailed sections, Custom allows precise targeting. Affects content depth and detail level.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            <select
              id="wordCount"
              name="wordCount"
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              value={formData.wordCount}
              onChange={(e) => handleChange('wordCount', e.target.value)}
            >
              {WORD_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
          )}
        </div>

        {/* Custom Word Count */}
        {isFieldVisible('customWordCount', mode) && formData.wordCount === 'Custom' && (
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center mb-1">
                <label htmlFor="customWordCount" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Custom Word Count
                </label>
                <Tooltip content="Specify exact word count target (50-2000 words). The AI will generate content to match this length. Enable 'Strictly adhere to target word count' in Optional Features for precise adherence through multiple AI revisions if needed.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
              
              {/* Word count info display */}
              {mode !== 'quick' && totalStructureWordCount > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Structure total: {totalStructureWordCount} words
                  {formData.prioritizeWordCount && totalStructureWordCount !== parseInt(customWordCountField.inputValue) && (
                    <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                      {formData.prioritizeWordCount && totalStructureWordCount > parseInt(customWordCountField.inputValue)
                        ? ' (will use structure total)'
                        : formData.prioritizeWordCount ? ' (will use custom total)' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
            <input
              type="number"
              id="customWordCount"
              name="customWordCount"
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Enter word count"
              min="50"
              max="2000"
              value={customWordCountField.inputValue}
              onChange={customWordCountField.handleChange}
              onBlur={customWordCountField.handleBlur}
            />

            {mode !== 'quick' && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <InfoIcon className="w-3 h-3 inline-block mr-1" />
                {formData.prioritizeWordCount
                  ? "Strict word count mode is enabled. The AI will perform multiple refinements if needed to achieve this exact word count."
                  : "For better word count adherence, enable 'Strictly adhere to target word count' in the Optional Features section."}
              </div>
            )}

            {/* Show effective target word count if different from custom */}
            {mode !== 'quick' &&
             formData.prioritizeWordCount &&
             totalStructureWordCount > 0 &&
             totalStructureWordCount !== parseInt(customWordCountField.inputValue) && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md text-xs text-gray-800 dark:text-gray-200">
                <strong>Note:</strong> The effective target word count will be {effectiveTargetWordCount} words because you have both section word counts and a custom total with strict adherence enabled.
              </div>
            )}
          </div>
        )}

        {/* Word Count Priority Notice */}
        {!formData.wordCount.includes('Custom') &&
         mode !== 'quick' &&
         formData.prioritizeWordCount &&
         totalStructureWordCount > 0 && (
          <div className="mb-6 p-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md text-xs">
            <div className="font-medium text-gray-800 dark:text-gray-300">Target Word Count</div>
            <p className="text-gray-800 dark:text-gray-200 mt-1">
              With strict word count adherence enabled, the target will be {effectiveTargetWordCount} words based on your section structure.
            </p>
          </div>
        )}

        {/* Tone Level Slider - ADVANCED MODE ONLY */}
        {isFieldVisible('toneLevel', mode) && (
        <div className="mb-6">
            <div className="flex items-center mb-1">
              <label htmlFor="toneLevel" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Tone Level
              </label>
              <Tooltip content="Fine-tune formality from 0 (very formal/academic) to 100 (very casual/conversational). 0 = academic style, 25 = business formal, 50 = balanced professional, 75 = friendly business, 100 = casual conversation.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <span className="text-sm text-gray-600 dark:text-gray-400">{formData.toneLevel || 50}</span>
            </div>
            <input
              type="range"
              id="toneLevel"
              name="toneLevel"
              min="0"
              max="100"
              step="1"
              value={formData.toneLevel || 50}
              onChange={handleToneLevelChange}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Formal</span>
              <span>Casual</span>
            </div>
        </div>
        )}

        {/* Preferred Writing Style - STANDARD & ADVANCED */}
        {isFieldVisible('preferredWritingStyle', mode) && (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center mb-1">
                <label htmlFor="preferredWritingStyle" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Preferred Writing Style
                </label>
                <Tooltip content="Specific writing approach that guides information presentation. Persuasive focuses on conversion, Conversational is friendly and approachable, Informative is educational and factual, Storytelling uses narrative elements to engage emotions.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
              <div className="flex items-center">
              <SuggestionButton
                fieldType="preferredWritingStyle"
                businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'preferredWritingStyle'}
                isDisabled={isBusinessDescriptionEmpty}
              />
              </div>
            </div>
            <TagInput
              id="preferredWritingStyle"
              name="preferredWritingStyle"
              placeholder="e.g., Persuasive, Conversational, Informative, Storytelling..."
              value={formData.preferredWritingStyle || ''}
              onChange={handlePreferredWritingStyleChange}
            />
        </div>
        )}

        {/* Language Style Constraints - STANDARD & ADVANCED */}
        {isFieldVisible('languageStyleConstraints', mode) && (
        <div className="mb-6">
            <div className="flex items-center mb-1">
              <label htmlFor="languageStyleConstraints" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Language Style Constraints
              </label>
              <Tooltip content="Specific writing rules to follow for brand consistency and compliance. These constraints ensure the AI follows your organization's style guidelines and avoids language patterns that don't align with your brand voice.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LANGUAGE_STYLE_CONSTRAINTS.map((constraint) => (
                <div key={constraint} className="flex items-center space-x-2">
                  <Checkbox
                    id={`constraint-${constraint}`}
                    checked={(formData.languageStyleConstraints || []).includes(constraint)}
                    onCheckedChange={() => handleLanguageStyleConstraintChange(constraint)}
                  />
                  <Label 
                    htmlFor={`constraint-${constraint}`}
                    className="cursor-pointer"
                  >
                    {constraint}
                  </Label>
                </div>
              ))}
            </div>
        </div>
        )}

        {/* Output Structure - ADVANCED MODE ONLY */}
        {isFieldVisible('outputStructure', mode) && (
        <div className="mb-6">
            <div className="flex items-center mb-1">
              <label htmlFor="outputStructure" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Output Structure
              </label>
              <Tooltip content="Define exactly how your content should be organized with draggable elements and individual word count allocation. Select structure elements like Header 1, Problem, Solution, Benefits, then assign specific word counts to each. The AI will create content following this exact structure and word distribution.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            <DraggableStructuredInput
              value={formData.outputStructure || []}
              onChange={handleStructureChange}
              options={OUTPUT_STRUCTURE_OPTIONS}
              placeholder="Select one or more format options..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select how you want the generated content to be formatted. Drag to reorder.
            </p>
            
            {/* Show word count summary */}
            {totalStructureWordCount > 0 && (
              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Total allocated: <span className="font-bold">{totalStructureWordCount}</span> words
                </div>

                {/* Add warning if it differs significantly from custom count */}
                {formData.wordCount === 'Custom' &&
                 formData.customWordCount &&
                 Math.abs(totalStructureWordCount - formData.customWordCount) > formData.customWordCount * 0.1 && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    {formData.prioritizeWordCount
                      ? "Structure word counts will take priority with strict adherence enabled."
                      : "Differs from custom word count"}
                  </div>
                )}
              </div>
            )}

            {/* Include Section Titles Toggle - Only show when output structure is defined */}
            {formData.outputStructure && formData.outputStructure.length > 0 && (
              <div className="mt-3 flex items-center space-x-2">
                <Checkbox
                  id="includeSectionTitles"
                  checked={formData.includeSectionTitles !== false}
                  onCheckedChange={(checked) => handleChange('includeSectionTitles', checked)}
                />
                <Label
                  htmlFor="includeSectionTitles"
                  className="text-sm font-normal text-gray-500 dark:text-gray-400 cursor-pointer flex items-center"
                >
                  Include AI-generated section titles
                  <Tooltip content="When enabled, the AI will generate compelling, descriptive titles (like H1 or H2) for each section in your structured output. These titles will summarize the content and match your brand's tone.">
                    <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                      <InfoIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </Label>
              </div>
            )}
        </div>
        )}
      </CollapsibleSection>
      )}

      {/* Divider */}
      {hasSectionVisibleFields(section3Fields, mode) && hasSectionVisibleFields(section4Fields, mode) && (
        <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
      )}

      {/* SECTION 4 — Strategic Messaging */}
      {hasSectionVisibleFields(section4Fields, mode) && (
      <CollapsibleSection
        title="Strategic Messaging"
        isExpanded={true}
        onToggle={() => onToggleSection?.('strategic-messaging')}
        filledCount={section4Count}
      >
        {/* Key Message */}
        {isFieldVisible('keyMessage', mode) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center mb-1">
              <label htmlFor="keyMessage" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                Key Message
              </label>
              <Tooltip content="The main point or value proposition you want to communicate throughout the content. This becomes the central theme that ties all copy elements together and ensures consistent messaging across all sections and paragraphs.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                  <InfoIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <TemplateIndicator show={formData.templatePrefilledFields?.includes('keyMessage') || false} />
            </div>
            <div className="flex items-center">
            <SuggestionButton
              fieldType="keyMessage"
              businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'keyMessage'}
              isDisabled={isBusinessDescriptionEmpty}
            />
            </div>
          </div>
          <textarea
            id="keyMessage"
            name="keyMessage"
            rows={2}
            className={getTextareaClassName('keyMessage', formData.fieldsWithPlaceholders, undefined, keyMessageField.inputValue)}
            placeholder="What's the main message you want to convey?"
            value={keyMessageField.inputValue}
            onChange={keyMessageField.handleChange}
            onBlur={keyMessageField.handleBlur}
          ></textarea>
        </div>
        )}

        {/* Grid for smaller inputs - Moved from CreateCopyForm/ImproveCopyForm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Desired Emotion - ADVANCED MODE ONLY */}
          {isFieldVisible('desiredEmotion', mode) && (
          <div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center mb-1">
                  <label htmlFor="desiredEmotion" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                    Desired Emotion
                  </label>
                  <Tooltip content="The emotional response you want to evoke in your readers, influencing tone and approach. Trust builds credibility and safety, Excitement creates enthusiasm and urgency, Relief addresses pain resolution, Confidence instills belief in success.">
                    <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                      <InfoIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <TemplateIndicator show={formData.templatePrefilledFields?.includes('desiredEmotion') || false} />
                </div>
                <div className="flex items-center">
                <SuggestionButton
                  fieldType="desiredEmotion"
                  businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
                  onGetSuggestion={onGetSuggestion}
                  isLoading={isLoadingSuggestions && activeSuggestionField === 'desiredEmotion'}
                  isDisabled={isBusinessDescriptionEmpty}
                />
                </div>
              </div>
              <TagInput
                id="desiredEmotion"
                name="desiredEmotion"
                placeholder="e.g., Trust, Excitement, Relief..."
                value={desiredEmotionField.inputValue}
                onChange={desiredEmotionField.setInputValue}
              />
            </div>
          </div>
          )}

          {/* Call to Action */}
          {isFieldVisible('callToAction', mode) && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center mb-1">
                <label htmlFor="callToAction" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Call to Action
                </label>
                <Tooltip content="The specific action you want readers to take after reading your content. Be specific and action-oriented: 'Start your free trial' is better than 'Learn more'. This directly impacts conversion rates and reader engagement.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
                <TemplateIndicator show={formData.templatePrefilledFields?.includes('callToAction') || false} />
              </div>
              <div className="flex items-center">
              <SuggestionButton
                fieldType="callToAction"
                businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'callToAction'}
                isDisabled={isBusinessDescriptionEmpty}
              />
              </div>
            </div>
            <input
              type="text"
              id="callToAction"
              name="callToAction"
              className={getInputClassName('callToAction', formData.fieldsWithPlaceholders, undefined, callToActionField.inputValue)}
              placeholder="e.g., Sign up, Contact us, Learn more..."
              value={callToActionField.inputValue}
              onChange={callToActionField.handleChange}
              onBlur={callToActionField.handleBlur}
            />
          </div>
          )}
        </div>

        {/* Brand Values - STANDARD & ADVANCED */}
        {isFieldVisible('brandValues', mode) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
              <div className="flex items-center mb-1">
                <label htmlFor="brandValues" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Brand Values
                </label>
                <Tooltip content="Core values that represent your brand and should be reflected in messaging. These guide tone and messaging consistency across all copy. Examples: Innovation, Reliability, Transparency, Customer-first, Sustainability. Helps create authentic, aligned brand voice.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
                <TemplateIndicator show={formData.templatePrefilledFields?.includes('brandValues') || false} />
              </div>
              <div className="flex items-center">
              <SuggestionButton
                fieldType="brandValues"
                businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'brandValues'}
                isDisabled={isBusinessDescriptionEmpty}
              />
              </div>
            </div>
            <TagInput
              id="brandValues"
              name="brandValues"
              placeholder="e.g., Innovation, Reliability, Sustainability..."
              value={brandValuesField.inputValue}
              onChange={brandValuesField.setInputValue}
            />
        </div>
        )}

        {/* Keywords - STANDARD & ADVANCED */}
        {isFieldVisible('keywords', mode) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
              <div className="flex items-center mb-1">
                <label htmlFor="keywords" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Keywords
                </label>
                <Tooltip content="SEO keywords and key phrases that should be naturally integrated throughout the content. These help improve search engine visibility and ensure the copy includes terms your audience searches for.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
                <TemplateIndicator show={formData.templatePrefilledFields?.includes('keywords') || false} />
              </div>
              <div className="flex items-center">
              <SuggestionButton
                fieldType="keywords"
                businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'keywords'}
                isDisabled={isBusinessDescriptionEmpty}
              />
              </div>
            </div>
            <TagInput
              id="keywords"
              name="keywords"
              placeholder="e.g., professional, effective, custom, affordable..."
              value={keywordsField.inputValue}
              onChange={(value) => {
                keywordsField.setInputValue(value);
                handleChange('keywords', value);
              }}
            />
        </div>
        )}

        {/* Context - STANDARD & ADVANCED */}
        {isFieldVisible('context', mode) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
              <div className="flex items-center mb-1">
                <label htmlFor="context" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
                  Context
                </label>
                <Tooltip content="Additional situational information that helps the AI understand the broader context. Include details like campaign timing, market conditions, competitive landscape, or special circumstances that should influence the copy approach and messaging.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
                <TemplateIndicator show={formData.templatePrefilledFields?.includes('context') || false} />
              </div>
              <div className="flex items-center">
              <SuggestionButton
                fieldType="context"
                businessDescription={formData.briefDescription || formData.businessDescription || formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'context'}
                isDisabled={isBusinessDescriptionEmpty}
              />
              </div>
            </div>
            <textarea
              id="context"
              name="context"
              rows={3}
              className={getTextareaClassName('context', formData.fieldsWithPlaceholders, undefined, contextField.inputValue)}
              placeholder="Any additional context for this copy (e.g., campaign details, market conditions)..."
              value={contextField.inputValue}
              onChange={contextField.handleChange}
              onBlur={contextField.handleBlur}
            ></textarea>
        </div>
        )}

        {/* Special Instructions */}
        {isFieldVisible('specialInstructions', mode) && (
        <div className="mb-6">
            <SpecialInstructionsField
              tone={formData.tone}
              language={formData.language}
              outputType={formData.outputStructure}
              value={specialInstructionsField.inputValue}
              onChange={(value) => {
                specialInstructionsField.setInputValue(value);
                handleChange('specialInstructions', value);
              }}
              currentUser={currentUser}
              fieldsWithPlaceholders={formData.fieldsWithPlaceholders}
              aiDecideWordCount={formData.aiDecideWordCount || false}
              onEnableAiDecide={() => {
                if (formData.prioritizeWordCount) {
                  handleToggle({ target: { name: 'prioritizeWordCount', checked: false } } as React.ChangeEvent<HTMLInputElement>);
                }
                handleToggle({ target: { name: 'aiDecideWordCount', checked: true } } as React.ChangeEvent<HTMLInputElement>);
              }}
            />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            These instructions will be added to your prompt to fine-tune the AI's output
          </p>
        </div>
        )}
      </CollapsibleSection>
      )}
    </>
  );
};

export default SharedInputs;