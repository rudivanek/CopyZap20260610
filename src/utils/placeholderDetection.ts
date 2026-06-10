import { FormState } from '../types';

const PLACEHOLDER_PATTERNS = [
  /\[[^\]]{3,}\]/g,
  /XXX/gi,
];

export function detectPlaceholders(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const hasMatch = PLACEHOLDER_PATTERNS.some(pattern => {
    const result = pattern.test(value);
    if (result) {
      console.log('🔍 Pattern matched:', pattern, 'in value:', value.substring(0, 100));
    }
    return result;
  });

  return hasMatch;
}

export function hasPlaceholdersInFormState(formState: Partial<FormState>): boolean {
  const fieldsToCheck = [
    formState.projectDescription,
    formState.targetAudience,
    formState.keywords,
    formState.keyMessage,
    formState.specialInstructions,
    formState.targetAudiencePainPoints,
    formState.businessDescription,
    formState.originalCopy,
    formState.briefDescription,
    formState.productServiceName,
    formState.industryNiche,
    formState.callToAction,
    formState.brandValues,
    formState.context,
    formState.desiredEmotion,
    formState.competitorCopyText,
    formState.excludedTerms,
    formState.preferredWritingStyle,
    formState.languageStyleConstraints?.join(' '),
    formState.sectionBreakdown,
    formState.location,
    formState.geoRegions,
    formState.originalCopyGuidance,
  ];

  return fieldsToCheck.some(field => field && detectPlaceholders(field));
}

export function getPlaceholderExamples(formState: Partial<FormState>): string[] {
  const examples: string[] = [];
  const fieldsWithLabels = [
    { value: formState.projectDescription, label: 'Project Description' },
    { value: formState.targetAudience, label: 'Target Audience' },
    { value: formState.keywords, label: 'Keywords' },
    { value: formState.keyMessage, label: 'Key Message' },
    { value: formState.specialInstructions, label: 'Special Instructions' },
    { value: formState.targetAudiencePainPoints, label: 'Target Audience Pain Points' },
    { value: formState.businessDescription, label: 'Business Description' },
    { value: formState.originalCopy, label: 'Original Copy' },
    { value: formState.briefDescription, label: 'Brief Description' },
    { value: formState.productServiceName, label: 'Product/Service Name' },
    { value: formState.industryNiche, label: 'Industry/Niche' },
    { value: formState.callToAction, label: 'Call to Action' },
    { value: formState.brandValues, label: 'Brand Values' },
    { value: formState.context, label: 'Context' },
    { value: formState.desiredEmotion, label: 'Desired Emotion' },
    { value: formState.competitorCopyText, label: 'Competitor Copy' },
    { value: formState.excludedTerms, label: 'Excluded Terms' },
    { value: formState.preferredWritingStyle, label: 'Preferred Writing Style' },
    { value: formState.languageStyleConstraints?.join(' '), label: 'Language Style Constraints' },
    { value: formState.sectionBreakdown, label: 'Section Breakdown' },
    { value: formState.location, label: 'Location' },
    { value: formState.geoRegions, label: 'GEO Regions' },
    { value: formState.originalCopyGuidance, label: 'Original Copy Guidance' },
  ];

  fieldsWithLabels.forEach(({ value, label }) => {
    if (value && detectPlaceholders(value)) {
      const matches = PLACEHOLDER_PATTERNS
        .map(pattern => {
          const match = value.match(pattern);
          return match ? match[0] : null;
        })
        .filter(Boolean);

      if (matches.length > 0) {
        examples.push(`${label}: "${matches[0]}"`);
      }
    }
  });

  return examples.slice(0, 3);
}

export function getFieldsWithPlaceholders(formState: Partial<FormState>): string[] {
  const fieldsToCheck = [
    { key: 'projectDescription', value: formState.projectDescription },
    { key: 'targetAudience', value: formState.targetAudience },
    { key: 'keywords', value: formState.keywords },
    { key: 'keyMessage', value: formState.keyMessage },
    { key: 'specialInstructions', value: formState.specialInstructions },
    { key: 'targetAudiencePainPoints', value: formState.targetAudiencePainPoints },
    { key: 'businessDescription', value: formState.businessDescription },
    { key: 'originalCopy', value: formState.originalCopy },
    { key: 'briefDescription', value: formState.briefDescription },
    { key: 'productServiceName', value: formState.productServiceName },
    { key: 'industryNiche', value: formState.industryNiche },
    { key: 'callToAction', value: formState.callToAction },
    { key: 'brandValues', value: formState.brandValues },
    { key: 'context', value: formState.context },
    { key: 'desiredEmotion', value: formState.desiredEmotion },
    { key: 'competitorCopyText', value: formState.competitorCopyText },
    { key: 'excludedTerms', value: formState.excludedTerms },
    { key: 'preferredWritingStyle', value: formState.preferredWritingStyle },
    { key: 'languageStyleConstraints', value: formState.languageStyleConstraints?.join(' ') },
    { key: 'sectionBreakdown', value: formState.sectionBreakdown },
    { key: 'location', value: formState.location },
    { key: 'geoRegions', value: formState.geoRegions },
    { key: 'originalCopyGuidance', value: formState.originalCopyGuidance },
  ];

  const fieldsWithPlaceholders: string[] = [];

  fieldsToCheck.forEach(({ key, value }) => {
    if (value && detectPlaceholders(value)) {
      fieldsWithPlaceholders.push(key);
    }
  });

  return fieldsWithPlaceholders;
}
