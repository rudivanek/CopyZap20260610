/**
 * Quick — the automatic pipeline.
 *
 *   access check -> tracking session -> write N versions -> score all of them
 *   (goal-aware Absolute + structural gate) -> pick the winner
 *
 * It calls the same engine functions Copy Maker uses and holds no prompts or
 * scoring rules of its own. It never shows toasts: it reports progress through
 * a callback and throws QuickPipelineError, and the screen decides what to show.
 */
import { v4 as uuidv4 } from 'uuid';
import { FormState, GeneratedContentItem, GeneratedContentItemType, GoalKey, User } from '../types';
import { generateCopy } from '../services/api/copyGeneration';
import { generateUnifiedComparison } from '../services/api/unifiedComparison';
import type { ComparisonResult } from '../services/api/comprehensiveScoring';
import { generateAbsoluteScore } from '../services/api/absoluteScoring';
import type { AbsoluteScoreBreakdown } from '../services/api/absoluteScoring';
import { calculateTargetWordCount } from '../services/api/utils';
import { checkUserAccess } from '../services/supabaseClient';
import { sessionManager } from '../services/sessionService';
import type { GateResult } from '../utils/structuralGate';
import { countWords } from '../utils/markdownUtils';
import {
  buildQuickFormState,
  buildQuickScoringContext,
  QUICK_DEFAULT_VARIANTS,
  QUICK_MAX_WORDS,
  QUICK_MIN_WORDS,
  QUICK_SECTION,
} from './buildQuickFormState';
import { ORIGINAL_OPTION_LABEL, ORIGINAL_VERSION_ID, pickWinner } from './pickWinner';

export type QuickStage = 'checking' | 'writing' | 'scoring';

export interface QuickProgress {
  stage: QuickStage;
  /** Versions finished so far (writing stage only). */
  done?: number;
  /** Versions requested (writing stage only). */
  total?: number;
}

export type QuickErrorCode =
  | 'too_short'
  | 'too_long'
  | 'no_access'
  | 'session_failed'
  | 'generation_failed';

export class QuickPipelineError extends Error {
  code: QuickErrorCode;

  constructor(code: QuickErrorCode, message: string) {
    super(message);
    this.name = 'QuickPipelineError';
    this.code = code;
  }
}

export interface QuickScores {
  comparisonResult: ComparisonResult;
  absoluteByVersion: Record<string, AbsoluteScoreBreakdown>;
  gateByVersion: Record<string, GateResult>;
  /** Version id of the winner, or null when nothing could be ranked. */
  winnerId: string | null;
  /** Versions whose score could not be produced, even after one retry. */
  unscoredIds: string[];
}

export interface QuickRunInput {
  copy: string;
  goalKey: GoalKey;
  variants?: number;
}

export interface QuickRunResult {
  /** Inputs + sessionId + copyResult, in the same shape Copy Maker saves. */
  formState: FormState;
  /** The original first, then the generated versions. */
  versions: GeneratedContentItem[];
  goalKey: GoalKey;
  /** null when scoring failed; the versions are still returned. */
  scores: QuickScores | null;
  scoringError?: string;
  /** How many requested versions could not be written. */
  failedVersions: number;
}

type ProgressFn = (progress: QuickProgress) => void;

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return typeof error === 'string' ? error : 'Unknown error';
}

/** Throws QuickPipelineError when the copy is too short or too long. */
export function validateQuickCopy(copy: string): void {
  const words = countWords((copy || '').trim());
  if (!copy || !copy.trim() || words < QUICK_MIN_WORDS) {
    throw new QuickPipelineError('too_short', `Please paste at least ${QUICK_MIN_WORDS} words.`);
  }
  if (words > QUICK_MAX_WORDS) {
    throw new QuickPipelineError(
      'too_long',
      `This copy has ${words} words. Quick handles up to ${QUICK_MAX_WORDS} words for now.`
    );
  }
}

function toImprovedCopy(content: GeneratedContentItem['content']) {
  return Array.isArray(content) ? content.join('\n') : content;
}

async function writeOneVersion(
  formState: FormState,
  user: User,
  sessionId: string,
  index: number
): Promise<GeneratedContentItem> {
  const result = await generateCopy({ ...formState }, user, sessionId);

  if (!result || result.validationFailed || !result.improvedCopy) {
    throw new Error(`Version ${index + 1} could not be written.`);
  }

  return {
    id: uuidv4(),
    type: GeneratedContentItemType.Improved,
    content: result.improvedCopy,
    sourceText: formState.originalCopy,
    generatedAt: new Date().toISOString(),
    sourceDisplayName: `Generated Copy ${index + 1}`,
    analysisMode: 'on_demand',
  };
}

/** Writes the versions in parallel. Returns the ones that succeeded, in order. */
export async function generateQuickVersions(
  formState: FormState,
  user: User,
  sessionId: string,
  onProgress?: ProgressFn
): Promise<{ items: GeneratedContentItem[]; failed: number; firstError?: string }> {
  const total = formState.numberOfVariants ?? QUICK_DEFAULT_VARIANTS;
  let done = 0;
  onProgress?.({ stage: 'writing', done, total });

  const settled = await Promise.allSettled(
    Array.from({ length: total }, (_, index) =>
      writeOneVersion(formState, user, sessionId, index).then(item => {
        done += 1;
        onProgress?.({ stage: 'writing', done, total });
        return item;
      })
    )
  );

  const items: GeneratedContentItem[] = [];
  let firstError: string | undefined;
  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      items.push(outcome.value);
    } else if (!firstError) {
      firstError = errorMessage(outcome.reason);
    }
  }

  return { items, failed: total - items.length, firstError };
}

type ScoredRow = ComparisonResult['rows'][number] & {
  absoluteSub?: { clarity: number; persuasion: number; audience_fit: number; structure: number };
};

/**
 * The absolute scorer never throws: when its call fails it returns a score of 0
 * with a placeholder note. A real score of exactly 0 does not occur for real
 * copy, so 0 is treated as "not scored" rather than shown as a result.
 */
function isUsableScore(score: AbsoluteScoreBreakdown | null | undefined): score is AbsoluteScoreBreakdown {
  return !!score && score.total > 0;
}

/** Scores every version against the goal and picks the winner. */
export async function scoreQuickVersions(
  formState: FormState,
  versions: GeneratedContentItem[],
  goalKey: GoalKey,
  user: User,
  onProgress?: ProgressFn
): Promise<QuickScores> {
  onProgress?.({ stage: 'scoring' });

  const targetWords = calculateTargetWordCount({ ...formState }).target;

  const unified = await generateUnifiedComparison(
    formState.originalCopy,
    versions,
    user,
    formState.sessionId,
    undefined,
    formState.model,
    undefined,
    [],
    buildQuickScoringContext(goalKey),
    QUICK_SECTION,
    'new',
    targetWords
  );

  const comparisonResult = unified.comparisonResult;
  const rows = comparisonResult.rows as ScoredRow[];
  const absoluteByVersion: Record<string, AbsoluteScoreBreakdown> = { ...(unified.absoluteByVersion ?? {}) };

  // Retry once any version the scorer failed on, so a failed call never
  // reaches the screen as "0 / 100".
  const context = buildQuickScoringContext(goalKey);
  const failedIds = versions.map(version => version.id).filter(id => !isUsableScore(absoluteByVersion[id]));
  const unscoredIds: string[] = [];

  if (failedIds.length > 0) {
    const retried = await Promise.all(
      failedIds.map(async id => {
        const version = versions.find(item => item.id === id);
        if (!version) return { id, score: null };
        try {
          const score = await generateAbsoluteScore(
            version.content,
            user,
            formState.sessionId,
            context.goalKey,
            context.goalLabel
          );
          return { id, score: isUsableScore(score) ? score : null };
        } catch {
          return { id, score: null };
        }
      })
    );

    for (const { id, score } of retried) {
      const row = rows.find(item => item.versionId === id);
      if (score) {
        absoluteByVersion[id] = score;
        if (row) {
          row.absoluteTotal = score.total;
          row.absoluteNotes = [
            score.clarity_note,
            score.persuasion_note,
            score.audience_fit_note,
            score.structure_note,
          ].filter(Boolean);
          row.absoluteSub = {
            clarity: score.clarity,
            persuasion: score.persuasion,
            audience_fit: score.audience_fit,
            structure: score.structure,
          };
        }
      } else {
        delete absoluteByVersion[id];
        if (row) {
          delete row.absoluteTotal;
          delete row.absoluteNotes;
          delete row.absoluteSub;
        }
        unscoredIds.push(id);
      }
    }
  }

  const winner = pickWinner(rows);

  return {
    comparisonResult,
    absoluteByVersion,
    gateByVersion: unified.gateByVersion ?? {},
    winnerId: winner ? winner.versionId : null,
    unscoredIds,
  };
}

/** Puts the versions and scores into formState.copyResult, the shape Copy Maker saves. */
export function withQuickResult(
  formState: FormState,
  versions: GeneratedContentItem[],
  scores: QuickScores | null
): FormState {
  const generated = versions.filter(version => version.id !== ORIGINAL_VERSION_ID);
  const winner = scores?.winnerId ? generated.find(version => version.id === scores.winnerId) : undefined;
  const lead = winner ?? generated[0];

  return {
    ...formState,
    copyResult: {
      ...formState.copyResult,
      improvedCopy: lead ? toImprovedCopy(lead.content) : '',
      generatedVersions: versions,
      comparisonResult: scores?.comparisonResult,
    },
  };
}

export async function runQuickPipeline(
  input: QuickRunInput,
  user: User,
  onProgress?: ProgressFn
): Promise<QuickRunResult> {
  validateQuickCopy(input.copy);

  // 1 — access
  onProgress?.({ stage: 'checking' });
  let access;
  try {
    access = await checkUserAccess(user.id, user.email || '');
  } catch {
    throw new QuickPipelineError('no_access', 'Unable to verify access. Please try again.');
  }
  if (!access.hasAccess) {
    throw new QuickPipelineError('no_access', access.message || 'Your account cannot generate copy right now.');
  }

  // 2 — settings and tracking session (the engine refuses to run without one)
  let formState = buildQuickFormState({ copy: input.copy, variants: input.variants });
  let sessionId: string;
  try {
    const session = await sessionManager.createSession(
      user.id,
      'quick',
      formState.projectDescription,
      undefined,
      formState,
      undefined,
      'quick'
    );
    sessionId = session.id;
  } catch (error) {
    throw new QuickPipelineError('session_failed', `Could not start a tracking session. ${errorMessage(error)}`);
  }
  formState = { ...formState, sessionId };

  // 3 — write the versions
  const written = await generateQuickVersions(formState, user, sessionId, onProgress);
  if (written.items.length === 0) {
    throw new QuickPipelineError(
      'generation_failed',
      written.firstError || 'No version could be written. Please try again.'
    );
  }

  const original: GeneratedContentItem = {
    id: ORIGINAL_VERSION_ID,
    type: GeneratedContentItemType.Original,
    content: formState.originalCopy || '',
    generatedAt: new Date().toISOString(),
    sourceDisplayName: ORIGINAL_OPTION_LABEL,
    analysisMode: 'on_demand',
  };
  const versions = [original, ...written.items];

  // 4 — score and pick. A scoring failure keeps the versions.
  let scores: QuickScores | null = null;
  let scoringError: string | undefined;
  try {
    scores = await scoreQuickVersions(formState, versions, input.goalKey, user, onProgress);
  } catch (error) {
    scoringError = errorMessage(error);
  }

  return {
    formState: withQuickResult(formState, versions, scores),
    versions,
    goalKey: input.goalKey,
    scores,
    scoringError,
    failedVersions: written.failed,
  };
}
