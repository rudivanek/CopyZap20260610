/**
 * Optimization & Additional Features Auto-Population Policy
 *
 * STRICT CLARITY-FIRST RULE:
 * These fields may ONLY be auto-populated when:
 * 1) Loading a SAVED SESSION (resume work)
 * 2) Opening a SAVED OUTPUT (view/edit existing saved output)
 *
 * In BOTH cases, fields must be restored EXACTLY as saved.
 *
 * In ALL other flows, these fields MUST remain EMPTY/OFF:
 * - Quick Prompt Wizard (all paths)
 * - Wizard "Analyze URL"
 * - Purpose Rewrite → Continue in Copy Maker
 * - Load Template
 * - Load Prefill / Quick Start
 * - Any "Apply suggestions" or AI analysis step
 */

import { FormState } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';

/**
 * Source types for form state loading
 */
export type OptimizationRestoreSource =
  | 'saved_session'    // Resume from a saved session - RESTORE optimization fields
  | 'saved_output'     // Open a saved output - RESTORE optimization fields
  | 'wizard'           // Quick Prompt Wizard - CLEAR optimization fields
  | 'template'         // Load Template - CLEAR optimization fields
  | 'prefill'          // Load Prefill/Quick Start - CLEAR optimization fields
  | 'purpose_rewrite'  // Purpose Rewrite → Continue - CLEAR optimization fields
  | 'analyze_url'      // Analyze URL - CLEAR optimization fields
  | 'manual'           // Manual form editing - KEEP current values
  | 'unknown';         // Unknown source - CLEAR optimization fields (safe default)

/**
 * Explicit list of all Optimization & Additional Features fields.
 * This is the single source of truth for which fields are governed by this policy.
 */
export const OPTIMIZATION_FEATURE_FIELDS: (keyof FormState)[] = [
  // Core toggles
  'generateScores',
  'generateGeoScore',
  'forceElaborationsExamples',
  'enhanceForGEO',
  'addTldrSummary',
  'generateSeoMetadata',

  // Word count controls
  'prioritizeWordCount',
  'wordCountTolerancePercentage',
  'adhereToLittleWordCount',
  'littleWordCountTolerancePercentage',
  'aiDecideWordCount',

  // SEO metadata variant counts
  'numUrlSlugs',
  'numMetaDescriptions',
  'numH1Variants',
  'numH2Variants',
  'numH3Variants',
  'numOgTitles',
  'numOgDescriptions',

  // GEO targeting
  'geoRegions',

  // FAQ schema
  'faqSchemaEnabled',

  // Section breakdown
  'sectionBreakdown',
];

/**
 * Get the default empty state for optimization fields
 */
export function getEmptyOptimizationState(): Partial<FormState> {
  const emptyState: Partial<FormState> = {};

  OPTIMIZATION_FEATURE_FIELDS.forEach(field => {
    emptyState[field] = DEFAULT_FORM_STATE[field];
  });

  return emptyState;
}

/**
 * Apply the optimization restore policy to incoming form state.
 *
 * @param source - Where the state is coming from
 * @param incomingState - The state being applied to the form
 * @returns The state with optimization fields handled according to policy
 */
export function applyOptimizationRestorePolicy(
  source: OptimizationRestoreSource,
  incomingState: Partial<FormState>
): Partial<FormState> {
  // Determine if we should restore or clear optimization fields
  const shouldRestore = source === 'saved_session' || source === 'saved_output';

  if (shouldRestore) {
    // RESTORE: Keep optimization fields exactly as they are in incoming state
    console.log(`✓ Optimization Policy: RESTORING fields from ${source}`);
    return incomingState;
  } else {
    // CLEAR: Overwrite optimization fields with empty/off defaults
    const emptyOptimization = getEmptyOptimizationState();
    const clearedState = {
      ...incomingState,
      ...emptyOptimization
    };

    // Log which fields were reset for debugging
    const resetFields = OPTIMIZATION_FEATURE_FIELDS.filter(
      field => incomingState[field] !== undefined && incomingState[field] !== emptyOptimization[field]
    );

    if (resetFields.length > 0) {
      console.log(`✗ Optimization Policy: CLEARED ${resetFields.length} fields from ${source}:`, resetFields);
    } else {
      console.log(`✓ Optimization Policy: No fields to clear from ${source}`);
    }

    return clearedState;
  }
}

/**
 * Helper to determine the source type from context
 * Use this when the source isn't explicitly known
 */
export function inferOptimizationRestoreSource(context: {
  isSession?: boolean;
  isSavedOutput?: boolean;
  isTemplate?: boolean;
  isPrefill?: boolean;
  isWizard?: boolean;
}): OptimizationRestoreSource {
  if (context.isSession) return 'saved_session';
  if (context.isSavedOutput) return 'saved_output';
  if (context.isTemplate) return 'template';
  if (context.isPrefill) return 'prefill';
  if (context.isWizard) return 'wizard';
  return 'unknown'; // Safe default: clear optimization fields
}
