/**
 * Quick — change the best version.
 *
 * The user says in plain words what should change ("shorter", "less salesy").
 * The engine rewrites the current best version accordingly; the new version is
 * scored and joins the same result. The best version is then chosen by score
 * again: if the change made the copy worse, the earlier best stays on top.
 *
 * What was protected stays protected. Testimonials and the parts the user kept
 * as they are get taken out before the rewrite and put back afterwards, exactly
 * as in the first run, so a change never touches them.
 */
import { FormState, GeneratedContentItem, GeneratedContentItemType, User } from '../types';
import { modifyContent } from '../services/api/contentModification';
import { contentToText } from '../services/api/contentText';
import { checkUserAccess } from '../services/supabaseClient';
import { countWords } from '../utils/markdownUtils';
import {
  findUnverifiedQuotes,
  keepInstructions,
  lockTestimonials,
  restoreTestimonials,
  testimonialInstructions,
} from './quoteLock';
import type { TestimonialZone } from './quoteLock';
import { QuickRunResult, scoreQuickVersions, withQuickResult } from './runQuickPipeline';
import type { QuickProgress } from './runQuickPipeline';
import { throwIfStopped } from './quickStop';
import { formatChangeInstructions, getQuickFormat } from './quickFormats';

/** Versions one result can hold besides the original. The comparison reads them all together. */
export const QUICK_MAX_VERSIONS = 8;
/**
 * Most words a change rewrites. The rewrite step sizes its room to the text and
 * streams long copy (contentModification.ts), like the writing step, so this
 * covers the best version of a page at the word limit that came back a fifth
 * longer. Until 2026-10-09 it was 1,200: the rewrite step had 4,000 tokens.
 */
export const QUICK_CHANGE_MAX_WORDS = 6500;
/**
 * What a one-word request means to the rewrite step. Said out in full because
 * "Shorter" alone was taken very freely: on 2026-10-09 it cut a version of
 * 3,974 words down to 1,258. The version is still named after the short word.
 */
const FULL_REQUESTS: Record<string, string> = {
  shorter:
    'Make it about a quarter shorter. Keep every section, every heading and every fact: cut repetition, filler and long-winded sentences, not content.',
};
export const QUICK_CHANGE_MIN_CHARS = 3;
export const QUICK_CHANGE_MAX_CHARS = 300;
const LABEL_MAX_CHARS = 40;

export interface QuickChangeOutcome {
  result: QuickRunResult;
  newVersionId: string;
  /** The new version's quality score; null when it could not be scored. */
  newScore: number | null;
  /** The score of the version that was best before; null when there was none. */
  previousBestScore: number | null;
  becameBest: boolean;
}

const wordsToRewriteOf = new WeakMap<GeneratedContentItem, number>();

/** The words a change has to rewrite: the best version without its protected parts. Worked out once per version. */
function wordsToRewrite(result: QuickRunResult): number {
  const base = result.versions.find(version => version.id === result.scores?.winnerId);
  if (!base) return 0;
  const known = wordsToRewriteOf.get(base);
  if (known !== undefined) return known;
  const words = countWords(lockVersion(contentToText(base.content), result.keptTexts).locked);
  wordsToRewriteOf.set(base, words);
  return words;
}

/** Why a change cannot be made right now, or null when it can. */
export function validateQuickChange(result: QuickRunResult, instruction: string): string | null {
  const text = (instruction || '').trim();
  if (!result.scores || !result.scores.winnerId) return 'Score this result first; a change starts from the best version.';
  if (text.length < QUICK_CHANGE_MIN_CHARS) return 'Say what should change.';
  if (text.length > QUICK_CHANGE_MAX_CHARS) return `Keep it under ${QUICK_CHANGE_MAX_CHARS} characters.`;
  if (result.versions.length - 1 >= QUICK_MAX_VERSIONS) {
    return `This result already has ${QUICK_MAX_VERSIONS} versions. Start a new one to keep changing.`;
  }
  // Said here, before anything starts, and not after the modal has opened.
  const words = wordsToRewrite(result);
  if (words > QUICK_CHANGE_MAX_WORDS) {
    return `The best version has ${words.toLocaleString('en-US')} words to rewrite. A change handles up to ${QUICK_CHANGE_MAX_WORDS.toLocaleString('en-US')}. Use "Edit it myself" for this one.`;
  }
  return null;
}

/** A unique, short name for the new version, taken from what the user asked for. */
function labelFor(instruction: string, taken: string[]): string {
  const clean = instruction.replace(/\s+/g, ' ').trim();
  const short = clean.length > LABEL_MAX_CHARS ? `${clean.slice(0, LABEL_MAX_CHARS).trim()}…` : clean;
  const base = `Changed: ${short}`;
  let label = base;
  for (let n = 2; taken.includes(label); n += 1) label = `${base} (${n})`;
  return label;
}

/** Takes the protected parts out of a version: the kept parts first, then the testimonials. */
export function lockVersion(text: string, keptTexts: string[]): { locked: string; zones: TestimonialZone[] } {
  let working = text;
  const keepZones: TestimonialZone[] = [];
  for (const kept of keptTexts) {
    if (!kept || !working.includes(kept)) continue;
    const marker = `[[KEEP-${keepZones.length + 1}]]`;
    working = working.replace(kept, marker);
    keepZones.push({ marker, text: kept, count: 1 });
  }
  const lock = lockTestimonials(working);
  return { locked: lock.lockedCopy, zones: [...lock.zones, ...keepZones] };
}

export async function changeQuickVersion(
  result: QuickRunResult,
  instruction: string,
  user: User,
  onProgress?: (progress: QuickProgress) => void,
  /** Set when the user can stop the change: after a stop, no further step is started. */
  signal?: AbortSignal
): Promise<QuickChangeOutcome> {
  const problem = validateQuickChange(result, instruction);
  if (problem) throw new Error(problem);
  const scores = result.scores!;
  const wanted = instruction.trim();

  const base = result.versions.find(version => version.id === scores.winnerId);
  if (!base) throw new Error('The best version could not be found. Score the result again.');

  onProgress?.({ stage: 'checking' });
  let access: { hasAccess: boolean; message: string };
  try {
    access = await checkUserAccess(user.id, user.email || '');
  } catch {
    throw new Error('Could not confirm access. Check your connection and try again.');
  }
  if (!access.hasAccess) throw new Error(access.message || 'Access denied.');

  const baseText = contentToText(base.content);
  const { locked, zones } = lockVersion(baseText, result.keptTexts);
  const lockedWords = countWords(locked);
  if (lockedWords > QUICK_CHANGE_MAX_WORDS) {
    throw new Error(
      `This version has ${lockedWords} words to rewrite; a change handles up to ${QUICK_CHANGE_MAX_WORDS} for now.`
    );
  }

  // 1 — rewrite
  throwIfStopped(signal);
  onProgress?.({ stage: 'writing', done: 0, total: 1 });
  const keepZones = zones.filter(zone => zone.marker.startsWith('[[KEEP'));
  const quoteZones = zones.filter(zone => !zone.marker.startsWith('[[KEEP'));
  // A version of a format ("Turn it into…") keeps that format when it is changed.
  const format = getQuickFormat(result.formState.quickFormat);
  const rewriteState: FormState = {
    ...result.formState,
    wordCount: 'Custom',
    customWordCount: lockedWords,
    // The rewrite step gives every section a heading unless told not to; a format has its own shape.
    ...(format ? { includeSectionTitles: false } : {}),
    specialInstructions: [
      format ? formatChangeInstructions(format) : '',
      keepInstructions(keepZones),
      testimonialInstructions(quoteZones),
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
  const request = FULL_REQUESTS[wanted.toLowerCase()] ?? wanted;
  const rewritten = await modifyContent(locked, request, rewriteState, user, undefined, result.formState.sessionId);
  throwIfStopped(signal);
  const restored = zones.length > 0 ? restoreTestimonials(contentToText(rewritten), zones) : { text: contentToText(rewritten), moved: false };
  if (!restored.text.trim()) throw new Error('The change came back empty. Try again.');
  onProgress?.({ stage: 'writing', done: 1, total: 1 });

  const original = result.formState.originalCopy || '';
  const item: GeneratedContentItem = {
    id: crypto.randomUUID(),
    type: GeneratedContentItemType.Improved,
    content: restored.text,
    generatedAt: new Date().toISOString(),
    sourceId: base.id,
    sourceType: base.type,
    sourceDisplayName: labelFor(wanted, result.versions.map(version => version.sourceDisplayName || '')),
    sourceText: original,
    modificationInstruction: wanted,
  };
  const versions = [...result.versions, item];

  // 2 — score. Versions scored before keep their score; only the new one is new.
  const newScores = await scoreQuickVersions(result.formState, versions, result.goalKey, user, onProgress, scores, signal);

  const flagged = findUnverifiedQuotes(restored.text, original);
  const quoteFlags = flagged.length > 0 ? { ...result.quoteFlags, [item.id]: flagged } : result.quoteFlags;
  const movedIds = restored.moved ? [...result.testimonials.movedIds, item.id] : result.testimonials.movedIds;

  return {
    result: {
      ...result,
      versions,
      scores: newScores,
      scoringError: undefined,
      formState: withQuickResult(result.formState, versions, newScores),
      quoteFlags,
      testimonials: { ...result.testimonials, movedIds },
    },
    newVersionId: item.id,
    newScore: newScores.absoluteByVersion[item.id]?.total ?? null,
    previousBestScore: scores.absoluteByVersion[base.id]?.total ?? null,
    becameBest: newScores.winnerId === item.id,
  };
}
