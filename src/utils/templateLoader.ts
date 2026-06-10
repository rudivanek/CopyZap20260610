import { FormState } from '../types';
import { FormMode } from '../context/ModeContext';
import { isFieldVisible } from './fieldVisibility';
import { isFieldPopulated } from './formUtils';

/**
 * Count how many fields in the template data are populated
 */
export function countPopulatedFields(templateData: Partial<FormState>): number {
  const fieldsToCheck = [
    'projectDescription',
    'productServiceName',
    'businessDescription',
    'originalCopy',
    'section',
    'excludedTerms',
    'targetAudience',
    'industryNiche',
    'readerFunnelStage',
    'competitorUrls',
    'targetAudiencePainPoints',
    'competitorCopyText',
    'language',
    'tone',
    'wordCount',
    'customWordCount',
    'toneLevel',
    'preferredWritingStyle',
    'languageStyleConstraints',
    'outputStructure',
    'keyMessage',
    'desiredEmotion',
    'callToAction',
    'brandValues',
    'keywords',
    'context',
    'specialInstructions',
    'geoRegions'
  ];

  let count = 0;
  for (const field of fieldsToCheck) {
    const value = templateData[field as keyof FormState];
    if (isFieldPopulated(value)) {
      count++;
    }
  }

  return count;
}

/**
 * Find fields that are populated in template but hidden in current mode
 */
export function findHiddenPopulatedFields(
  templateData: Partial<FormState>,
  currentMode: FormMode
): string[] {
  const allFields = [
    'projectDescription',
    'productServiceName',
    'businessDescription',
    'originalCopy',
    'section',
    'excludedTerms',
    'targetAudience',
    'industryNiche',
    'readerFunnelStage',
    'competitorUrls',
    'targetAudiencePainPoints',
    'competitorCopyText',
    'language',
    'tone',
    'wordCount',
    'customWordCount',
    'toneLevel',
    'preferredWritingStyle',
    'languageStyleConstraints',
    'outputStructure',
    'includeSectionTitles',
    'keyMessage',
    'desiredEmotion',
    'callToAction',
    'brandValues',
    'keywords',
    'context',
    'specialInstructions',
    'geoRegions'
  ];

  const hiddenFields: string[] = [];

  for (const field of allFields) {
    const value = templateData[field as keyof FormState];
    const isPopulated = isFieldPopulated(value);
    const isVisible = isFieldVisible(field, currentMode);

    if (isPopulated && !isVisible) {
      hiddenFields.push(field);
    }
  }

  return hiddenFields;
}

/**
 * Determine the minimum mode needed to show all populated fields
 */
export function getRecommendedMode(hiddenFields: string[]): FormMode {
  // Check if any hidden field requires advanced mode
  const advancedOnlyFields = [
    'industryNiche',
    'readerFunnelStage',
    'competitorCopyText',
    'toneLevel',
    'outputStructure',
    'includeSectionTitles',
    'desiredEmotion'
  ];

  const needsAdvanced = hiddenFields.some(field => advancedOnlyFields.includes(field));
  if (needsAdvanced) return 'advanced';

  // Otherwise, standard mode is sufficient
  return 'standard';
}

/**
 * Get field names that should trigger section expansion
 */
export function getSectionsToExpand(templateData: Partial<FormState>): string[] {
  const sectionsToExpand: string[] = [];

  // Section 1: What You're Creating (always check projectDescription, productServiceName, etc.)
  const section1Fields = ['projectDescription', 'productServiceName', 'businessDescription', 'originalCopy', 'section', 'excludedTerms'];
  if (section1Fields.some(field => isFieldPopulated(templateData[field as keyof FormState]))) {
    sectionsToExpand.push('what-youre-creating');
  }

  // Section 2: Audience & Targeting
  const section2Fields = ['industryNiche', 'targetAudience', 'readerFunnelStage', 'competitorUrls', 'targetAudiencePainPoints', 'competitorCopyText'];
  if (section2Fields.some(field => isFieldPopulated(templateData[field as keyof FormState]))) {
    sectionsToExpand.push('audience-targeting');
  }

  // Section 3: Tone & Style
  const section3Fields = ['language', 'tone', 'wordCount', 'customWordCount', 'toneLevel', 'preferredWritingStyle', 'languageStyleConstraints', 'outputStructure', 'includeSectionTitles'];
  if (section3Fields.some(field => isFieldPopulated(templateData[field as keyof FormState]))) {
    sectionsToExpand.push('tone-style');
  }

  // Section 4: Strategic Messaging
  const section4Fields = ['keyMessage', 'desiredEmotion', 'callToAction', 'brandValues', 'keywords', 'context', 'specialInstructions'];
  if (section4Fields.some(field => isFieldPopulated(templateData[field as keyof FormState]))) {
    sectionsToExpand.push('strategic-messaging');
  }

  // Section 5: Optimization & Optional Features
  const section5Fields = ['generateSeoMetadata', 'generateScores', 'generateGeoScore', 'prioritizeWordCount', 'forceElaborationsExamples', 'enhanceForGEO', 'addTldrSummary', 'geoRegions'];
  if (section5Fields.some(field => isFieldPopulated(templateData[field as keyof FormState]))) {
    sectionsToExpand.push('optimization-optional');
  }

  return sectionsToExpand;
}
