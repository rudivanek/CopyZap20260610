import { GeneratedContentItem, User, Model, ScoringContext, ScoringMethod } from '../../types';
import { ComparisonResult } from './comprehensiveScoring';
// phase 2 scoring cleanup: comparative scoring is now the only scoring path
import { compareVersionsRelatively, mapToComparisonResult } from './comparativeScoring';
import { structuralGate, GateResult } from '../../utils/structuralGate';
import { generateAbsoluteScore, AbsoluteScoreBreakdown } from './absoluteScoring';

export interface UnifiedComparisonResult {
  comparisonResult: ComparisonResult;
  modelUsed: string;
  scoringMethod: ScoringMethod;
  // Populated only by the 'new' method (goal-aware, absolute-led, gated):
  absoluteByVersion?: Record<string, AbsoluteScoreBreakdown>;
  gateByVersion?: Record<string, GateResult>;
}

// Minimal, dependency-free text extraction for the structural gate.
function toPlainText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return (content as string[]).join('\n');
  if (content && typeof content === 'object') {
    const c = content as any;
    if (c.headline) {
      const sections = (c.sections || [])
        .map((s: any) => `${s.title || ''}\n${s.content || (s.listItems || []).join('\n')}`)
        .join('\n\n');
      return `${c.headline}\n\n${sections}`;
    }
    if (c.content) return toPlainText(c.content);
  }
  return '';
}

/**
 * Generate unified comparison.
 *
 * method 'current' (default): unchanged comparative-only scoring path.
 * method 'new': same comparative ranking, PLUS a goal-aware absolute score per
 *   version (computed in parallel to respect the edge-function time limit) and a
 *   structural validity gate. Result is stamped scoringVersion 'comparative-v2'.
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
  section?: string,
  method?: ScoringMethod
): Promise<UnifiedComparisonResult> {
  const resolvedMethod: ScoringMethod = method ?? scoringContext?.method ?? 'current';
  console.log(`🔄 Using comparative scoring engine (method: ${resolvedMethod})`);
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

  // Stamp the scoring context (use case + goal) onto the result so the UI and
  // reports can display "Judged as / Goal". Applies to BOTH methods.
  if (scoringContext) {
    comparisonResult.scoringContext = scoringContext;
  }

  // CURRENT method: unchanged behaviour.
  if (resolvedMethod !== 'new') {
    console.log('✅ Comparative result generated (current method)');
    return {
      comparisonResult,
      modelUsed: userSelectedModel || 'gpt-4o',
      scoringMethod: 'current',
    };
  }

  // NEW method: structural gate + goal-aware absolute scoring.
  addProgressMessage?.('New method: goal-aware absolute scoring…');
  const goalKey = scoringContext?.goalKey;

  // Structural gate (deterministic, language-independent). No word target passed
  // yet, so it flags repeated passages; too-short can be wired later.
  const gateByVersion: Record<string, GateResult> = {};
  for (const v of generatedVersions) {
    gateByVersion[v.id] = structuralGate(toPlainText(v.content));
  }

  // Goal-aware absolute score, computed in PARALLEL to stay within the
  // edge-function time limit (sequential calls risk the 150s Supabase timeout).
  const absoluteByVersion: Record<string, AbsoluteScoreBreakdown> = {};
  const scored = await Promise.all(
    generatedVersions.map((v) =>
      generateAbsoluteScore(v.content, currentUser, sessionId, goalKey)
        .then((score) => ({ id: v.id, score: score as AbsoluteScoreBreakdown | null }))
        .catch(() => ({ id: v.id, score: null as AbsoluteScoreBreakdown | null }))
    )
  );
  for (const r of scored) {
    if (r.score) absoluteByVersion[r.id] = r.score;
  }

  // Stamp so saved sessions and reports know which method produced this result.
  comparisonResult.scoringVersion = 'comparative-v2';
  // Attach the goal-aware absolute score and structural-gate result onto each
  // comparison row, so they ride along with comparisonResult through the app's
  // existing state, props and storage — no separate plumbing needed. The results
  // panel reads these fields for display.
  for (const row of comparisonResult.rows) {
    const abs = absoluteByVersion[row.versionId];
    if (abs) {
      row.absoluteTotal = abs.total;
      row.absoluteNotes = [abs.clarity_note, abs.persuasion_note, abs.audience_fit_note, abs.structure_note].filter(Boolean);
    }
    const gate = gateByVersion[row.versionId];
    if (gate) {
      row.incomplete = !gate.valid;
      row.gateFlags = gate.flags;
    }
  }

  console.log('✅ Comparative result generated (new method)');
  return {
    comparisonResult,
    modelUsed: userSelectedModel || 'gpt-4o',
    scoringMethod: 'new',
    absoluteByVersion,
    gateByVersion,
  };
}
