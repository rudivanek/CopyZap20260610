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
  deriveQuickLabel,
  QuickBriefInput,
  QUICK_DEFAULT_VARIANTS,
  QUICK_MAX_WORDS,
  QUICK_MIN_WORDS,
  QUICK_SECTION,
} from './buildQuickFormState';
import { effectiveGates } from './gateRules';
import { ORIGINAL_OPTION_LABEL, ORIGINAL_VERSION_ID, pickWinner } from './pickWinner';
import {
  findUnverifiedQuotes,
  keepInstructions,
  lockTestimonials,
  restoreTestimonials,
  testimonialInstructions,
} from './quoteLock';
import type { TestimonialZone } from './quoteLock';
import { cutIntoPieces, writeQuickVersionsInPieces, writesInPieces } from './writeInPieces';
import { contentToText } from '../services/api/contentText';

/** How many times each version is scored; the middle reading is used. */
export const QUICK_SCORE_SAMPLES = 3;
/**
 * Scores this close are "about the same". Measured on 2026-10-06: one page,
 * scored three times with nothing changed but a space, came back 79, 79 and 76.
 */
export const QUICK_SCORE_MARGIN = 3;

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
  | 'generation_failed'
  | 'bad_url'
  | 'fetch_failed';

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

/** Where the copy came from, when it was fetched from a page. */
export interface QuickSource {
  url: string;
  host: string;
}

export interface QuickRunInput {
  copy: string;
  goalKey: GoalKey;
  variants?: number;
  /** What the user confirmed about the copy (product, audience, tone, language). */
  brief?: QuickBriefInput;
  /** A tracking session already started by startQuickSession. One is created when missing. */
  sessionId?: string;
  /**
   * Parts of the page the user chose to keep as they are or to leave out
   * (see pageSections.ts). `copy` above is then the page without the left-out
   * parts, and `lockedCopy` the same with each kept part replaced by its marker.
   */
  keep?: {
    lockedCopy: string;
    zones: TestimonialZone[];
    leftOut: number;
    /** Parts kept as they are, not counting rows of testimonials. Defaults to the number of zones. */
    kept?: number;
    /** Testimonials in the kept rows. Shown with the result. */
    testimonialsKept?: number;
    /**
     * False when the user has already decided about every testimonial Quick
     * found (each is a row with its own choice), so the pipeline must not lock
     * any by itself: a row left on "improve" is meant to be rewritten.
     */
    autoLock?: boolean;
  };
  /** The page the copy was fetched from, when it was fetched. Recorded with the result. */
  source?: QuickSource;
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
  /** Testimonials found in the original and kept word for word in every version. */
  testimonials: {
    count: number;
    /** Versions that lost the testimonials' place; there they were put back before the last section. */
    movedIds: string[];
  };
  /** Per version: quoted passages that are not in the original. */
  quoteFlags: Record<string, string[]>;
  /**
   * Parts of the page the user kept as they are, and parts left out. `pieces`
   * is set when the page was written piece by piece (see writeInPieces.ts):
   * how many pieces it was cut into.
   */
  parts: { kept: number; leftOut: number; pieces?: number };
  /** The page the copy was fetched from. Absent for pasted copy. */
  source?: QuickSource;
  /**
   * The parts kept as they are, word for word. A later change to a version
   * needs them to keep those parts untouched again.
   */
  keptTexts: string[];
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
      `This copy has ${words} words. CopyZap handles up to ${QUICK_MAX_WORDS} words for now.`
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
  onProgress?: ProgressFn,
  /**
   * Scores from before, when a version is added to an existing result. A
   * version that already has a quality score keeps it: the score is measured
   * against a fixed bar, so scoring the same text again would only add noise
   * and could change a number the user has already seen.
   */
  keepScores?: QuickScores | null
): Promise<QuickScores> {
  onProgress?.({ stage: 'scoring' });

  // The gate compares each version with the whole original, testimonials included.
  const targetWords = countWords(formState.originalCopy || '') || calculateTargetWordCount({ ...formState }).target;

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

  // One reading of the scorer is not exact: the same text can come back up to
  // three points apart. So every version is scored QUICK_SCORE_SAMPLES times and
  // the middle reading is used. The first reading comes from the comparison
  // above; the others are asked for here. A reading that failed is left out, so
  // a failed call never reaches the screen as "0 / 100". Versions that keep an
  // earlier score are not read again.
  const context = buildQuickScoringContext(goalKey);
  const fresh = versions.filter(version => !isUsableScore(keepScores?.absoluteByVersion[version.id]));
  const unscoredIds: string[] = [];

  const settled = await Promise.all(
    fresh.map(async version => {
      const first = absoluteByVersion[version.id];
      const more = await Promise.all(
        Array.from({ length: QUICK_SCORE_SAMPLES - 1 }, async () => {
          try {
            return await generateAbsoluteScore(
              version.content,
              user,
              formState.sessionId,
              context.goalKey,
              context.goalLabel
            );
          } catch {
            return null;
          }
        })
      );
      const readings = [first, ...more].filter(isUsableScore).sort((x, y) => x.total - y.total);
      // Three readings: the middle one. Two: the lower one. One: that one.
      const score = readings.length > 0 ? readings[Math.floor((readings.length - 1) / 2)] : null;
      return { id: version.id, score };
    })
  );

  for (const { id, score } of settled) {
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

  // A version scored before keeps the score it had.
  if (keepScores) {
    for (const version of versions) {
      const kept = keepScores.absoluteByVersion[version.id];
      if (!isUsableScore(kept)) continue;
      absoluteByVersion[version.id] = kept;
      const row = rows.find(item => item.versionId === version.id);
      if (row) {
        row.absoluteTotal = kept.total;
        row.absoluteNotes = [kept.clarity_note, kept.persuasion_note, kept.audience_fit_note, kept.structure_note].filter(Boolean);
        row.absoluteSub = {
          clarity: kept.clarity,
          persuasion: kept.persuasion,
          audience_fit: kept.audience_fit,
          structure: kept.structure,
        };
      }
      const at = unscoredIds.indexOf(version.id);
      if (at >= 0) unscoredIds.splice(at, 1);
    }
  }

  // A repetition the original has itself is not held against a version (see gateRules.ts).
  const gateByVersion = effectiveGates(unified.gateByVersion);
  for (const row of rows) {
    const gate = gateByVersion[row.versionId];
    if (!gate) continue;
    row.incomplete = !gate.valid;
    row.gateFlags = gate.flags;
  }

  const winner = pickWinner(rows);

  return {
    comparisonResult,
    absoluteByVersion,
    gateByVersion,
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

/** Throws QuickPipelineError('no_access') when the account cannot generate. */
async function assertQuickAccess(user: User): Promise<void> {
  let access;
  try {
    access = await checkUserAccess(user.id, user.email || '');
  } catch {
    throw new QuickPipelineError('no_access', 'Unable to verify access. Please try again.');
  }
  if (!access.hasAccess) {
    throw new QuickPipelineError('no_access', access.message || 'Your account cannot generate copy right now.');
  }
}

async function createQuickSession(user: User, name: string, inputData?: FormState): Promise<string> {
  try {
    const session = await sessionManager.createSession(user.id, 'quick', name, undefined, inputData, undefined, 'quick');
    return session.id;
  } catch (error) {
    throw new QuickPipelineError('session_failed', `Could not start a tracking session. ${errorMessage(error)}`);
  }
}

/**
 * Checks access and starts the tracking session before the first paid step
 * (fetching a page or reading the copy), so every call of a run is recorded
 * under one session. Pass the returned id to runQuickPipeline.
 */
export async function startQuickSession(user: User, label: string): Promise<string> {
  await assertQuickAccess(user);
  return createQuickSession(user, `Quick: ${deriveQuickLabel(label)}`);
}

export async function runQuickPipeline(
  input: QuickRunInput,
  user: User,
  onProgress?: ProgressFn
): Promise<QuickRunResult> {
  validateQuickCopy(input.copy);

  // 1 — access
  onProgress?.({ stage: 'checking' });
  await assertQuickAccess(user);

  // 2 — settings and tracking session (the engine refuses to run without one).
  // Testimonials are taken out first: the engine rewrites the page around a
  // marker line and never sees, and so never edits, what customers said.
  const fullCopy = input.copy.trim();
  // Parts the user keeps as they are have already been replaced by markers.
  const keepZones = input.keep?.zones ?? [];
  const base = input.keep ? input.keep.lockedCopy.trim() : fullCopy;
  const lock = input.keep?.autoLock === false ? { lockedCopy: base, zones: [], count: 0 } : lockTestimonials(base);
  const zones = [...lock.zones, ...keepZones];
  let formState = buildQuickFormState({ copy: lock.lockedCopy, variants: input.variants, brief: input.brief });
  if (zones.length > 0) {
    formState = {
      ...formState,
      specialInstructions: [keepInstructions(keepZones), testimonialInstructions(lock.zones)].filter(Boolean).join('\n\n'),
    };
  }
  let sessionId = input.sessionId;
  if (sessionId) {
    // The session was started earlier, before the copy was final: store the real
    // name and inputs now. Best effort — a failure here must not stop the run.
    try {
      await sessionManager.updateSession(sessionId, formState.projectDescription || 'Quick', formState);
    } catch {
      // keep going with the session as it is
    }
  } else {
    sessionId = await createQuickSession(user, formState.projectDescription || 'Quick', formState);
  }
  formState = { ...formState, sessionId };

  // 3 — write the versions. With the switch on, a long page is cut into pieces
  // and written piece by piece; a page of one piece is written as before.
  const pieces = writesInPieces() ? cutIntoPieces(lock.lockedCopy) : [];
  const inPieces = pieces.length > 1;
  let written: { items: GeneratedContentItem[]; failed: number; firstError?: string };
  let movedInPieces: string[] = [];
  if (inPieces) {
    const outcome = await writeQuickVersionsInPieces(
      formState,
      pieces,
      { keep: keepZones, testimonials: lock.zones },
      user,
      sessionId,
      formState.numberOfVariants ?? QUICK_DEFAULT_VARIANTS,
      onProgress
    );
    written = outcome;
    movedInPieces = outcome.movedIds;
    // Each piece stored its own settings with the session: store the page's again. Best effort.
    try {
      await sessionManager.updateSession(sessionId, formState.projectDescription || 'Quick', formState);
    } catch {
      // keep going with the session as it is
    }
  } else {
    written = await generateQuickVersions(formState, user, sessionId, onProgress);
  }
  if (written.items.length === 0) {
    throw new QuickPipelineError(
      'generation_failed',
      written.firstError || 'No version could be written. Please try again.'
    );
  }

  // Put the testimonials back, word for word, and check every version for
  // quoted passages that are not in the original.
  const movedIds: string[] = [...movedInPieces];
  const quoteFlags: Record<string, string[]> = {};
  for (const item of written.items) {
    if (zones.length > 0 && inPieces) {
      // Written piece by piece: the kept parts are already back, each in its piece.
      item.sourceText = fullCopy;
    } else if (zones.length > 0) {
      const restored = restoreTestimonials(contentToText(item.content), zones);
      item.content = restored.text;
      item.sourceText = fullCopy;
      if (restored.moved) movedIds.push(item.id);
    }
    const flagged = findUnverifiedQuotes(contentToText(item.content), fullCopy);
    if (flagged.length > 0) quoteFlags[item.id] = flagged;
  }
  // From here on the settings describe the whole page again.
  formState = { ...formState, originalCopy: fullCopy, specialInstructions: '' };

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
    testimonials: { count: lock.count + (input.keep?.testimonialsKept ?? 0), movedIds },
    quoteFlags,
    parts: {
      kept: input.keep?.kept ?? keepZones.length,
      leftOut: input.keep?.leftOut ?? 0,
      ...(inPieces ? { pieces: pieces.length } : {}),
    },
    ...(input.source ? { source: input.source } : {}),
    keptTexts: keepZones.map(zone => zone.text),
  };
}
