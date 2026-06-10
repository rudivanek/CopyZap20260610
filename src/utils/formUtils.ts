/**
 * Utility functions for form field validation and display logic
 */
import { DEFAULT_FORM_STATE } from '../constants';
import { FormState } from '../types';

/**
 * Determines if a field value is populated (contains meaningful data)
 */
export function isFieldPopulated(value: any): boolean {
  // Handle null, undefined
  if (value === null || value === undefined) return false;
  
  // Handle strings
  if (typeof value === 'string') return value.trim().length > 0;
  
  // Handle numbers - 0 is considered empty for most cases
  if (typeof value === 'number') return value !== 0;
  
  // Handle booleans - only true is considered populated
  if (typeof value === 'boolean') return value === true;
  
  // Handle arrays
  if (Array.isArray(value)) {
    // Empty array is not populated
    if (value.length === 0) return false;
    
    // For string arrays, check if any string is non-empty
    if (value.every(item => typeof item === 'string')) {
      return value.some(item => item.trim().length > 0);
    }
    
    // For other arrays, any non-empty array is populated
    return true;
  }
  
  // Handle objects
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return false;
    
    // Recursively check if any property is populated
    return keys.some(key => isFieldPopulated(value[key]));
  }
  
  return false;
}

/**
 * Determines if a field has been modified from its default value
 */
export function isFieldUserModified(fieldName: keyof FormState, currentValue: any): boolean {
  const defaultValue = DEFAULT_FORM_STATE[fieldName];
  return !deepEqual(currentValue, defaultValue);
}

/**
 * Deep equality check for comparing values
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim() === b.trim();
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && deepEqual(a[key], b[key])
    );
  }
  
  return false;
}

/**
 * Check if competitor URLs array has any populated values
 */
export function hasPopulatedCompetitorUrls(urls: string[]): boolean {
  if (!Array.isArray(urls)) return false;
  return urls.some(url => typeof url === 'string' && url.trim().length > 0);
}

/**
 * Determines if the form has any populated fields
 */
export function hasAnyPopulatedFields(formState: FormState): boolean {
  // Check all the main fields that users typically fill
  const fieldsToCheck = [
    formState.projectDescription,
    formState.businessDescription,
    formState.originalCopy,
    formState.targetAudience,
    formState.keyMessage,
    formState.callToAction,
    formState.keywords,
    formState.context,
    formState.specialInstructions,
    formState.brandValues,
    formState.desiredEmotion,
    formState.briefDescription,
    formState.productServiceName,
    formState.industryNiche,
    formState.preferredWritingStyle,
    formState.targetAudiencePainPoints,
    formState.competitorCopyText,
    formState.excludedTerms,
    formState.geoRegions
  ];

  // Check if any of these fields are populated
  const hasPopulatedTextFields = fieldsToCheck.some(field => isFieldPopulated(field));
  
  // Check arrays
  const hasPopulatedArrays = hasPopulatedCompetitorUrls(formState.competitorUrls) ||
                            isFieldPopulated(formState.languageStyleConstraints) ||
                            isFieldPopulated(formState.outputStructure);
  
  // Check if any settings are modified from defaults
  const hasModifiedSettings =
    isFieldUserModified('language', formState.language) ||
    isFieldUserModified('tone', formState.tone) ||
    isFieldUserModified('wordCount', formState.wordCount) ||
    isFieldUserModified('toneLevel', formState.toneLevel) ||
    isFieldUserModified('generateSeoMetadata', formState.generateSeoMetadata) ||
    isFieldUserModified('generateScores', formState.generateScores) ||
    isFieldUserModified('generateGeoScore', formState.generateGeoScore) ||
    isFieldUserModified('prioritizeWordCount', formState.prioritizeWordCount) ||
    isFieldUserModified('forceElaborationsExamples', formState.forceElaborationsExamples) ||
    isFieldUserModified('enhanceForGEO', formState.enhanceForGEO) ||
    isFieldUserModified('addTldrSummary', formState.addTldrSummary);

  return hasPopulatedTextFields || hasPopulatedArrays || hasModifiedSettings;
}

/**
 * Counts populated fields in a specific section based on field names
 */
export function countFilledFieldsInSection(formState: FormState, fieldNames: string[]): number {
  let count = 0;

  for (const fieldName of fieldNames) {
    const value = formState[fieldName as keyof FormState];
    if (isFieldPopulated(value)) {
      count++;
    }
  }

  return count;
}

