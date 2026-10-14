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
  QUICK_MIN_WORDS,
  QUICK_SECTION,
  quickMaxWords,
  quickTextKindOf,
} from './buildQuickFormState';
import { textKindWritingNote } from '../services/api/textKinds';
import { KEEP_TO_ORIGINAL_NOTE, QUICK_REWRITE_NOTE } from './keepToOriginal';
import { cleanUserFacts, userFactsWritingNote } from './missingFacts';
import { claimsStatingUserFacts, withoutStatedFacts } from './factClaimCheck';
import { effectiveGates } from './gateRules';
import { stopSessionWith, throwIfStopped } from './quickStop';
import { ORIGINAL_OPTION_LABEL, ORIGINAL_VERSION_ID, pickWinner } from './pickWinner';
import {
  findUnverifiedQuotes,
  keepInstructions,
  lockTestimonials,
  restoreTestimonials,
  testimonialInstructions,
} from './quoteLock';
import type { TestimonialZone } from './quoteLock';
import { contentToText } from '../services/api/contentText';

/**
 * How many readings a version gets when one is not enough: when its first
 * reading is within QUICK_SCORE_MARGIN of another version or of the original
 * (see scoreQuickVersions). The middle reading is used. Until 2026-10-14 every
 * version was read this many times; that day, of seven texts read three times
 * each, five came back identical and the other two within 4 points.
 */
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
  /** For the goal "Other" (key 'custom'): what the copy is for, in the user's own words. */
  goalLabel?: string;
  variants?: number;
  /** What the user confirmed about the copy (product, audience, tone, language, kind of text). */
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
  /** Set when the user can stop the run: after a stop, no further step is started (see quickStop.ts). */
  signal?: AbortSignal;
  /** The page the copy was fetched from, when it was fetched. Recorded with the result. */
  source?: QuickSource;
  /**
   * Facts the user added on the check screen, for what the copy was missing
   * (see missingFacts.ts). The writer is told to use them. Empty: as before.
   */
  userFacts?: string[];
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
  /** Parts of the page the user kept as they are, and parts left out. */
  parts: { kept: number; leftOut: number };
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
  const maxWords = quickMaxWords();
  if (words > maxWords) {
    throw new QuickPipelineError(
      'too_long',
      `This copy has ${words} words. CopyZap handles up to ${maxWords} words for now.`
    );
  }
}

function toImprovedCopy(content: GeneratedContentItem['content']) {
  return Array.isArray(content) ? content.join('\n') : content;
}

/**
 * For a page, or when the kind of text is not known: the writer chooses the
 * headings the new order needs, in the original's capitalisation style. The
 * other kinds have their own note, which says not to add headings.
 *
 * Until 2026-10-14 this kept every heading of the original in its place. On
 * sharpen.studio that kept a list of thirteen client names (each one a heading
 * on the page) inside every version; see keepToOriginal.ts.
 */
const QUICK_HEADINGS_NOTE =
  'Headings: write the headings your version needs as markdown headings, # for the main heading and ## for the others. You may reword, reorder, merge or drop the headings of the original. Use the capitalisation style of the original: sentence case stays sentence case, and you do not switch to Title Case. Keep headings short. Do not add headings to a text that has none.';

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
  keepScores?: QuickScores | null,
  /** Set when the user can stop the process: after a stop, no further scoring call is started. */
  signal?: AbortSignal
): Promise<QuickScores> {
  throwIfStopped(signal);
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
    buildQuickScoringContext(goalKey, quickTextKindOf(formState), formState.quickGoalLabel),
    QUICK_SECTION,
    'new',
    targetWords,
    // Quick keeps earlier scores itself (keepScores, below) and "Score again" must read afresh.
    false
  );

  const comparisonResult = unified.comparisonResult;
  const rows = comparisonResult.rows as ScoredRow[];
  const absoluteByVersion: Record<string, AbsoluteScoreBreakdown> = { ...(unified.absoluteByVersion ?? {}) };

  // While the versions are scored again, an LLM reads the "claims to verify"
  // and the facts the user added, and by meaning decides which claims only
  // state a fact (so are not "source unknown"). It never throws: on any
  // failure nothing is hidden (see factClaimCheck.ts).
  const statedFacts = claimsStatingUserFacts(
    rows.flatMap(row => row.verificationFlags ?? []),
    formState.quickUserFacts,
    user,
    formState.sessionId
  );

  // One reading of the scorer is not exact: the same text can come back up to
  // three points apart. A reading only matters where it could change the
  // outcome, so a version is read again (QUICK_SCORE_SAMPLES readings in all,
  // the middle one used) only when its first reading is within
  // QUICK_SCORE_MARGIN points of another version's or of the original's, or
  // when the first reading failed. Otherwise the first reading stands. The
  // first reading comes from the comparison above; the others are asked for
  // here. A reading that failed is left out, so a failed call never reaches the
  // screen as "0 / 100". Versions that keep an earlier score are not read again,
  // but their score counts when deciding who is close.
  throwIfStopped(signal);
  const kind = quickTextKindOf(formState);
  const context = buildQuickScoringContext(goalKey, kind, formState.quickGoalLabel);
  const fresh = versions.filter(version => !isUsableScore(keepScores?.absoluteByVersion[version.id]));
  const unscoredIds: string[] = [];
  const firstTotal = (id: string): number | null => {
    const kept = keepScores?.absoluteByVersion[id];
    if (isUsableScore(kept)) return kept.total;
    const read = absoluteByVersion[id];
    return isUsableScore(read) ? read.total : null;
  };
  const needsMoreReadings = (id: string): boolean => {
    const mine = firstTotal(id);
    if (mine == null) return true;
    return versions.some(other => {
      if (other.id === id) return false;
      const theirs = firstTotal(other.id);
      return theirs != null && Math.abs(theirs - mine) <= QUICK_SCORE_MARGIN;
    });
  };

  const settled = await Promise.all(
    fresh.map(async version => {
      const first = absoluteByVersion[version.id];
      const extra = needsMoreReadings(version.id) ? QUICK_SCORE_SAMPLES - 1 : 0;
      const more = await Promise.all(
        Array.from({ length: extra }, async () => {
          try {
            return await generateAbsoluteScore(
              version.content,
              user,
              formState.sessionId,
              context.goalKey,
              context.goalLabel,
              kind
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

  // Claims that only state a fact the user added are taken out of every
  // version's flags; the LLM check ran in parallel with the scoring above.
  const stated = await statedFacts;
  for (const row of rows) {
    if (row.verificationFlags && row.verificationFlags.length > 0) {
      row.verificationFlags = withoutStatedFacts(row.verificationFlags, stated);
    }
  }

  // A repetition the original has itself is not held against a version (see gateRules.ts).
  // ...and a version the user asked for is not set aside for being short.
  const gateByVersion = effectiveGates(unified.gateByVersion, versions);
  for (const row of rows) {
    const gate = gateByVersion[row.versionId];
    if (!gate) continue;
    row.incomplete = !gate.valid;
    row.gateFlags = gate.flags;
  }

  // On a tie the version that was best before stays best: adding a version
  // must not reshuffle the ones the user already had.
  let winner = pickWinner(rows);
  const before = keepScores?.winnerId ? rows.find(row => row.versionId === keepScores.winnerId) : undefined;
  if (winner && before && before !== winner && !before.incomplete && before.absoluteTotal === winner.absoluteTotal) {
    winner = before;
  }

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

  throwIfStopped(input.signal);

  // 2 — settings and tracking session (the engine refuses to run without one).
  // Testimonials are taken out first: the engine rewrites the page around a
  // marker line and never sees, and so never edits, what customers said.
  const fullCopy = input.copy.trim();
  // Parts the user keeps as they are have already been replaced by markers.
  const keepZones = input.keep?.zones ?? [];
  const base = input.keep ? input.keep.lockedCopy.trim() : fullCopy;
  const lock = input.keep?.autoLock === false ? { lockedCopy: base, zones: [], count: 0 } : lockTestimonials(base);
  const zones = [...lock.zones, ...keepZones];
  let formState = buildQuickFormState({
    copy: lock.lockedCopy,
    variants: input.variants,
    brief: input.brief,
    goalLabel: input.goalKey === 'custom' ? input.goalLabel : undefined,
  });
  const userFacts = cleanUserFacts(input.userFacts);
  if (userFacts.length > 0) {
    // The facts need room: without it the writer squeezes them into the original's
    // length and merges them ("Solicita tu análisis gratis desde 32,000 MXN" reads
    // as if the free analysis cost the price). Measured 2026-10-13 on a 40-word
    // text with three facts: price and free offer in one sentence in 4 of 6
    // versions at the original length, 2 of 6 with the facts' words added.
    formState = {
      ...formState,
      quickUserFacts: userFacts,
      customWordCount: (formState.customWordCount ?? 0) + countWords(userFacts.join(' ')),
    };
  }
  // What the writer is told on top of its own rules: to keep to the facts of
  // the original (see keepToOriginal.ts), the kind of text when it is not a
  // page (see textKinds.ts), and the parts it must not touch.
  // A page may be rewritten freely (see keepToOriginal.ts); testimonials the
  // user keeps as a row go where they help most, like those Quick locks itself.
  // Other parts kept as they are stay in their place.
  const keptTestimonials = keepZones.filter(zone => zone.testimonials);
  const keptParts = keepZones.filter(zone => !zone.testimonials);
  const writerNotes = [
    KEEP_TO_ORIGINAL_NOTE,
    userFactsWritingNote(userFacts),
    textKindWritingNote(quickTextKindOf(formState)) || `${QUICK_REWRITE_NOTE}\n\n${QUICK_HEADINGS_NOTE}`,
    keepInstructions(keptParts),
    testimonialInstructions([...lock.zones, ...keptTestimonials], true),
  ]
    .filter(Boolean)
    .join('\n\n');
  if (writerNotes) {
    formState = { ...formState, specialInstructions: writerNotes };
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
  // The writer only knows the session: a stop is passed on to it by session.
  stopSessionWith(input.signal, sessionId);
  throwIfStopped(input.signal);

  // 3 — write the versions
  const written = await generateQuickVersions(formState, user, sessionId, onProgress);
  throwIfStopped(input.signal);
  if (written.items.length === 0) {
    throw new QuickPipelineError(
      'generation_failed',
      written.firstError || 'No version could be written. Please try again.'
    );
  }

  // Put the testimonials back, word for word, and check every version for
  // quoted passages that are not in the original.
  const movedIds: string[] = [];
  const quoteFlags: Record<string, string[]> = {};
  for (const item of written.items) {
    if (zones.length > 0) {
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
    scores = await scoreQuickVersions(formState, versions, input.goalKey, user, onProgress, undefined, input.signal);
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
    parts: { kept: input.keep?.kept ?? keepZones.length, leftOut: input.keep?.leftOut ?? 0 },
    ...(input.source ? { source: input.source } : {}),
    keptTexts: keepZones.map(zone => zone.text),
  };
}
