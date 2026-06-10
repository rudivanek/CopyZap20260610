/**
 * API service main entry point
 * Re-exports all functionality from the api/ directory
 */

export * from './api/utils';
export * from './api/copyGeneration';
export * from './api/alternativeCopy';
export * from './api/humanizedCopy';
export * from './api/seoGeneration';
export * from './api/contentScoring';
export * from './api/promptEvaluation';
export * from './api/suggestions';
export * from './api/voiceStyles';
export * from './api/contentRefinement';
export * from './api/geoScoring';
export * from './api/templateSuggestions';
export * from './api/contentModification';
// phase 1 scoring cleanup: removed dead legacy comparison code