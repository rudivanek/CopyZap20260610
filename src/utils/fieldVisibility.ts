import { FormMode } from '../context/ModeContext';

// Field visibility rules based on mode
export const isFieldVisible = (fieldName: string, mode: FormMode): boolean => {
  // Quick Mode - Only 10 essential fields (NO optional features)
  const quickModeFields = [
    'projectDescription',
    'productServiceName',
    'businessDescription',
    'originalCopy',
    'section',
    'targetAudience',
    'language',
    'tone',
    'wordCount',
    'customWordCount',
    'keyMessage',
    'callToAction',
    'specialInstructions'
  ];

  // Standard Mode - Quick + mid-level fields (15-20 fields total)
  const standardModeFields = [
    ...quickModeFields,
    'customerId',
    'brandVoiceId',
    'targetAudiencePainPoints',
    'competitorUrls',
    'preferredWritingStyle',
    'languageStyleConstraints',
    'brandValues',
    'keywords',
    'context',
    'excludedTerms',
    'outputStructure',
    'includeSectionTitles',
    // Optional features shown in Standard Mode
    'generateSeoMetadata',
    'generateScores',
    'prioritizeWordCount',
    'wordCountTolerancePercentage',
    'generateGeoScore',
    'forceElaborationsExamples',
    'enhanceForGEO',
    'addTldrSummary',
    'geoRegions',
    'numUrlSlugs',
    'numMetaDescriptions',
    'numH1Variants',
    'numH2Variants',
    'numH3Variants',
    'numOgTitles',
    'numOgDescriptions',
    'adhereToLittleWordCount',
    'littleWordCountTolerancePercentage'
  ];

  // Advanced Mode - All fields (everything visible)
  const advancedModeFields = [
    ...standardModeFields,
    'industryNiche',
    'readerFunnelStage',
    'competitorCopyText',
    'readerSophistication',
    'toneLevel',
    'desiredEmotion'
  ];

  if (mode === 'quick') {
    return quickModeFields.includes(fieldName);
  }

  if (mode === 'standard') {
    return standardModeFields.includes(fieldName);
  }

  if (mode === 'advanced') {
    return advancedModeFields.includes(fieldName);
  }

  return false;
};

// Check if a section has any visible fields
export const hasSectionVisibleFields = (
  sectionFields: string[],
  mode: FormMode
): boolean => {
  return sectionFields.some(field => isFieldVisible(field, mode));
};
