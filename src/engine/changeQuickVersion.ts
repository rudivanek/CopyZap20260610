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
import { textKindChangeNote } from '../services/api/textKinds';
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
import { quickTextKindOf } from './buildQuickFormState';
import { KEEP_TO_ORIGINAL_CHANGE_NOTE } from './keepToOriginal';

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
/** Longest text the user can type as a change of their own. */
export const QUICK_CHANGE_MAX_CHARS = 300;

/**
 * The changes that can be ticked on the result screen. Several can go into
 * one rewrite. `excludes` names the one that cannot be ticked together with it.
 */
export interface QuickChangeOption {
  label: string;
  excludes?: string;
}
export const QUICK_CHANGE_OPTIONS: QuickChangeOption[] = [
  { label: 'Shorter' },
  { label: 'Stronger call to action' },
  { label: 'Warmer' },
  { label: 'More formal', excludes: 'Less formal' },
  { label: 'Less formal', excludes: 'More formal' },
];
/** Between the parts of a request made of several changes. */
const CHANGE_SEPARATOR = '; ';
/** Room for the ticked changes on top of the user's own words. */
const TICKED_MAX_CHARS = QUICK_CHANGE_OPTIONS.map(option => option.label).join(CHANGE_SEPARATOR).length + CHANGE_SEPARATOR.length;

/** A change as the result screen hands it over: what is ticked, and the user's own words. */
export interface QuickChangeParts {
  ticked: string[];
  own: string;
}

/**
 * One line out of the ticked changes and the user's own words:
 * "Shorter; Warmer; mention the free diagnosis earlier". It names the new
 * version and is what is checked for length. A single change is the change
 * itself, as before.
 */
export function composeQuickChange(ticked: string[], own: string): string {
  return [...ticked, (own || '').trim()].filter(Boolean).join(CHANGE_SEPARATOR);
}

/**
 * What the rewrite step is told. One change (one tick, or the user's own
 * words, whatever they contain) is passed on as it always was. Several are
 * numbered in one line, so that none of them is lost.
 *
 * The length is said with the numbers. Measured on 2026-10-11 against the
 * live model, on an email of 105 words and a page of 109:
 * - "Shorter" among several changes: without the numbers the other changes
 *   used up the cut (97 to 109 words, and 107 to 109); with them the result is
 *   as short as "Shorter" on its own gives, or shorter (86 to 97, and 93 to 97).
 * - Several changes without "Shorter": without the numbers the text grew by up
 *   to half (121 to 147 words, and 139 to 169); with them it stays where one
 *   change on its own lands (110 to 118, and 122 to 133).
 */
function requestFor(wanted: string, parts: QuickChangeParts | undefined, words: number): string {
  const ticked = parts?.ticked ?? [];
  const own = (parts?.own ?? '').trim();
  if (ticked.length + (own ? 1 : 0) < 2) return FULL_REQUESTS[wanted.toLowerCase()] ?? wanted;
  const shorter = ticked.some(part => part.toLowerCase() === 'shorter');
  const target = Math.round(words * 0.75);
  // A text of one or two words cannot be given a smaller number.
  const shorterInFull =
    target < words
      ? FULL_REQUESTS.shorter.replace('a quarter shorter.', `a quarter shorter: about ${target} words instead of ${words}.`)
      : FULL_REQUESTS.shorter;
  const all = [...ticked.map(part => (part.toLowerCase() === 'shorter' ? shorterInFull : part)), ...(own ? [own] : [])];
  const numbered = all.map((part, at) => `(${at + 1}) ${part}${/[.!?]$/.test(part) ? '' : '.'}`).join(' ');
  return (
    `Make all of these changes together, in one rewrite: ${numbered}` +
    (shorter
      ? ' The result must still be about a quarter shorter than the text is now.'
      : ` Keep the length: the text has ${words} words now and the result should have about as many, unless one of these changes asks for more or fewer.`)
  );
}
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
  if (text.length > QUICK_CHANGE_MAX_CHARS + TICKED_MAX_CHARS) return `Keep it under ${QUICK_CHANGE_MAX_CHARS} characters.`;
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
  signal?: AbortSignal,
  /** What is ticked and what the user wrote, when the change comes from the result screen. */
  parts?: QuickChangeParts
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
  // A text that is not a page (see textKinds.ts) is told so, and the rewrite
  // step's rule "every section must have a heading" is switched off for it.
  const kindNote = textKindChangeNote(quickTextKindOf(result.formState));
  const rewriteState: FormState = {
    ...result.formState,
    wordCount: 'Custom',
    customWordCount: lockedWords,
    ...(kindNote ? { includeSectionTitles: false } : {}),
    specialInstructions: [
      KEEP_TO_ORIGINAL_CHANGE_NOTE,
      kindNote,
      keepInstructions(keepZones),
      testimonialInstructions(quoteZones),
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
  const request = requestFor(wanted, parts, lockedWords);
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
