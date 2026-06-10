import { GeneratedContentItem, User, Model, ScoringContext } from '../../types';
import { ComparisonResult } from './comprehensiveScoring';
// phase 2 scoring cleanup: comparative scoring is now the only scoring path
import { compareVersionsRelatively, mapToComparisonResult } from './comparativeScoring';

export interface UnifiedComparisonResult {
  comparisonResult: ComparisonResult;
  modelUsed: string;
}

/**
 * Generate unified comparison using comparative scoring
 *
 * Phase 2 scoring cleanup: Only comparative scoring is supported.
 * All versions are evaluated together in one LLM call with relative ranking.
 */
export async function generateUnifiedComparison(
  originalCopy: string | undefined,
  generatedVersions: GeneratedContentItem[],
  currentUser: User,
  sessionId?: string,
  addProgressMessage?: (message: string) => void,
  userSelectedModel?: Model,
  cachedScores?: Record<string, any>, // Kept for backward compatibility but unused
  keywords: string[] = [],
  scoringContext?: ScoringContext,
  section?: string
): Promise<UnifiedComparisonResult> {
  console.log('🔄 Using comparative scoring engine');
  addProgressMessage?.('Comparing versions relatively...');

  // Build version labels
  const versionLabels: Record<string, string> = {};
  generatedVersions.forEach((v, idx) => {
    versionLabels[v.id] = v.sourceDisplayName || `Version ${idx + 1}`;
  });

  // Call comparative scoring engine — pass user's selected model so Overall Verdict respects it
  const comparativeResult = await compareVersionsRelatively(
    generatedVersions,
    versionLabels,
    currentUser.id,
    sessionId,
    keywords,
    scoringContext,
    userSelectedModel,
    section
  );

  // Map to ComparisonResult format
  const comparisonResult = mapToComparisonResult(comparativeResult, generatedVersions);

  console.log('✅ Comparative result generated:', comparisonResult);

  return {
    comparisonResult,
    modelUsed: userSelectedModel || 'gpt-4o'
  };
}
