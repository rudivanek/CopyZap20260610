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
  { label: 'Shorter', excludes: 'Longer' },
  { label: 'Longer', excludes: 'Shorter' },
  { label: 'Stronger call to action' },
  { label: 'Warmer' },
  { label: 'More formal', excludes: 'Less formal' },
  { label: 'Less formal', excludes: 'More formal' },
];
/** Between the parts of a request made of several changes. */
const CHANGE_SEPARATOR = '; ';
/** Room for the ticked changes on top of the user's own words, with the number of words of Shorter or Longer. */
const TICKED_MAX_CHARS =
  QUICK_CHANGE_OPTIONS.map(option => option.label).join(CHANGE_SEPARATOR).length + CHANGE_SEPARATOR.length + ' to 99999 words'.length;

/** A change as the result screen hands it over: what is ticked, and the user's own words. */
export interface QuickChangeParts {
  ticked: string[];
  own: string;
  /** With "Shorter" or "Longer": how many words the whole best version should have afterwards. */
  targetWords?: number;
}

/**
 * Shorter and Longer, with a number of words.
 *
 * The user sets how many words the best version should have (the screen
 * proposes a quarter fewer or a third more). The rewrite step is told the
 * number; when the result misses it by more than LENGTH_TOLERANCE, one more
 * pass corrects the length, as the main run does.
 *
 * Measured on 2026-10-12 against the live model. "Shorter" with "keep every
 * fact" hardly cut dense copy at all (an email of 105 words asked for 79 came
 * back with 96 to 99, and a second pass did not help), so Shorter keeps the
 * headings and the key facts and may leave out less important detail. Dense
 * copy still stops short of a small target (email 105 to 53: 60 words; page
 * 109 to 55: 76 to 85): nothing is left to cut. Wordy copy reaches it (a page of
 * 272 words asked for 136: 118; for 95: 100 to 102). Longer lands within about
 * 15% (email 140: 158 to 161; page 145: 163 to 165; post 64: 68 to 73).
 */
export type QuickLengthDirection = 'shorter' | 'longer';
/** How far the result may miss the number before a second pass corrects it. */
const LENGTH_TOLERANCE = 0.15;
/** A miss of a few words is never corrected, however short the text. */
const LENGTH_MIN_MISS = 3;
/** Shorter goes down to this share of the words that can be rewritten. */
const SHORTER_MIN_SHARE = 0.3;
/** Longer goes up to this multiple of the words that can be rewritten. */
const LONGER_MAX_SHARE = 2;
/**
 * The rewrite step has room for about this many words of output when the text
 * it gets is short (4,000 tokens; see contentModification.ts), and for about a
 * fifth more than it gets when the text is long. Longer stays inside that room,
 * so a long text is never cut off.
 */
const LONGER_ROOM_WORDS = 1100;
const LONG_INPUT_WORDS = 1250;
const LONGER_LONG_SHARE = 1.15;

/** Shorter or Longer, when one of them is ticked. */
export function quickLengthDirection(ticked: string[]): QuickLengthDirection | null {
  const found = ticked.map(label => label.toLowerCase()).find(label => label === 'shorter' || label === 'longer');
  return (found as QuickLengthDirection | undefined) ?? null;
}

/** Words of the best version now, and the numbers the user may ask for. */
export interface QuickLengthInfo {
  /** Words of the whole best version. */
  now: number;
  /** Words in kept parts and testimonials: they stay as they are, so they count in any target. */
  fixed: number;
  shorter: { min: number; max: number; suggested: number };
  longer: { min: number; max: number; suggested: number };
}

export function quickLengthInfo(result: QuickRunResult): QuickLengthInfo | null {
  const base = result.versions.find(version => version.id === result.scores?.winnerId);
  if (!base) return null;
  const text = contentToText(base.content);
  const now = countWords(text);
  const editable = countWords(lockVersion(text, result.keptTexts).locked);
  const fixed = Math.max(0, now - editable);
  const shorterMin = fixed + Math.max(1, Math.ceil(editable * SHORTER_MIN_SHARE));
  const shorterMax = now - 1;
  const longerRoom =
    editable > LONG_INPUT_WORDS
      ? Math.floor(editable * LONGER_LONG_SHARE)
      : Math.min(Math.floor(editable * LONGER_MAX_SHARE), Math.max(editable + 1, LONGER_ROOM_WORDS));
  const longerMax = fixed + Math.max(editable + 1, longerRoom);
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  return {
    now,
    fixed,
    shorter: { min: shorterMin, max: shorterMax, suggested: clamp(Math.round(now * 0.75), shorterMin, shorterMax) },
    longer: { min: now + 1, max: longerMax, suggested: clamp(Math.round(now * (4 / 3)), now + 1, longerMax) },
  };
}

/** Why this number of words cannot be asked for; null when it can. */
export function quickLengthProblem(info: QuickLengthInfo, direction: QuickLengthDirection, target: number): string | null {
  const range = info[direction];
  // Too little text to change the length of: a few words, or a version that is mostly kept as it is.
  if (range.min > range.max) {
    return direction === 'shorter'
      ? `This text can't get shorter${info.fixed > 0 ? ': most of it is kept as it is' : ''}.`
      : `This text can't get longer${info.fixed > 0 ? ': most of it is kept as it is' : ''}.`;
  }
  if (!Number.isFinite(target) || target <= 0) return 'Say how many words it should have.';
  if (!Number.isInteger(target)) return 'Use a whole number of words.';
  if (target < range.min) {
    return direction === 'shorter'
      ? `It can go down to about ${range.min} words${info.fixed > 0 ? ' (the parts kept as they are stay)' : ''}.`
      : `For Longer, choose more than ${info.now} words.`;
  }
  if (target > range.max) {
    return direction === 'shorter'
      ? `For Shorter, choose fewer than ${info.now} words.`
      : `It can go up to about ${range.max} words; for more, say in your own words what to add.`;
  }
  return null;
}

/** "Shorter" or "Longer" with the number, as the rewrite step is told it. */
function lengthRequest(direction: QuickLengthDirection, target: number, words: number): string {
  return direction === 'shorter'
    ? `Make it shorter: about ${target} words instead of ${words}. Keep every heading, and keep the key facts: names, numbers, prices, the offer and the call to action. Shorten sentences, merge them, and leave out repetition, filler and less important detail until the text has about ${target} words.`
    : `Make it longer: about ${target} words instead of ${words}. Do it by explaining more fully what the text already says: what each point means for the reader and why it matters. Keep every section, every heading and every fact. Do not add facts, numbers, prices, offers, guarantees, deadlines, examples, customers or results that the text does not state.`;
}

/** The second pass, when the first missed the number. */
function lengthCorrection(direction: QuickLengthDirection, target: number, words: number): string {
  if (words > target && direction === 'shorter') {
    return `This text has ${words} words and must have about ${target}. Shorten it to about ${target} words: shorten and merge sentences and leave out less important detail. Keep every heading, and keep names, numbers, prices, the offer and the call to action. Change nothing else.`;
  }
  if (words > target) {
    return `Make this text shorter: it has ${words} words and should have about ${target}. Cut repetition, filler and long-winded sentences. Keep every section, every heading and every fact, and change nothing else.`;
  }
  return `Make this text longer: it has ${words} words and should have about ${target}. Explain more fully what it already says. Keep every section, every heading and every fact, add no facts, and change nothing else.`;
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
function requestFor(
  wanted: string,
  parts: QuickChangeParts | undefined,
  words: number,
  /** With Shorter or Longer: the words the rewritten text should have. */
  lengthTarget: number | null
): string {
  const ticked = parts?.ticked ?? [];
  const own = (parts?.own ?? '').trim();
  const direction = lengthTarget != null ? quickLengthDirection(ticked) : null;
  if (ticked.length + (own ? 1 : 0) < 2) {
    if (direction && lengthTarget != null) return lengthRequest(direction, lengthTarget, words);
    return FULL_REQUESTS[wanted.toLowerCase()] ?? wanted;
  }
  const all = [
    ...ticked.map(part =>
      direction && lengthTarget != null && part.toLowerCase() === direction ? lengthRequest(direction, lengthTarget, words) : part
    ),
    ...(own ? [own] : []),
  ];
  const numbered = all.map((part, at) => `(${at + 1}) ${part}${/[.!?]$/.test(part) ? '' : '.'}`).join(' ');
  return (
    `Make all of these changes together, in one rewrite: ${numbered}` +
    (direction && lengthTarget != null
      ? ` The result must have about ${lengthTarget} words.`
      : ` Keep the length: the text has ${words} words now and the result should have about as many, unless one of these changes asks for more or fewer.`)
  );
}
const LABEL_MAX_CHARS = 40;

/**
 * For a page, or a result from before the kinds of text: the headings stay as
 * they are. Other kinds of text have their own note, which already says not to
 * add section headings.
 */
const HEADINGS_CHANGE_NOTE =
  'Keep every heading of the text as a heading, with the same markdown marks (# or ##) and the same capitalisation (sentence case stays sentence case). Change the words of a heading only when the request asks for it or when the part under it no longer fits it, and do not add new headings unless the request asks for them.';

/** The ticked changes as they appear in a version's name. */
const LABEL_NAMES: Record<string, string> = {
  'stronger call to action': 'Stronger CTA',
};
/** How long the list of changes in a version's name may be before the rest is counted ("+2 more"). */
const LABEL_LIST_MAX_CHARS = 50;

export interface QuickChangeOutcome {
  result: QuickRunResult;
  newVersionId: string;
  /** The new version's quality score; null when it could not be scored. */
  newScore: number | null;
  /** The score of the version that was best before; null when there was none. */
  previousBestScore: number | null;
  becameBest: boolean;
  /** With Shorter or Longer: the words asked for and the words the new version has. */
  length?: { target: number; words: number };
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

/** Cuts a text at the last whole word that fits. */
function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : text.slice(0, max)).replace(/[\s,;:.-]+$/, '')}…`;
}

/**
 * What a version's name says after "Changed: ". With ticks: their short names
 * and "own words", for example "Longer to 157 words, Stronger CTA, own words".
 * Only own words: the start of them, cut at a whole word.
 */
function labelText(instruction: string, parts: QuickChangeParts | undefined): string {
  const ticked = parts?.ticked ?? [];
  const own = (parts?.own ?? '').replace(/\s+/g, ' ').trim();
  if (ticked.length === 0) {
    const words = cutAtWord(own || instruction.replace(/\s+/g, ' ').trim(), LABEL_MAX_CHARS);
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  const direction = quickLengthDirection(ticked);
  const names = ticked.map(label => {
    const key = label.toLowerCase();
    if (direction && key === direction && Number.isFinite(parts?.targetWords)) return `${label} to ${parts?.targetWords} words`;
    return LABEL_NAMES[key] ?? label;
  });
  if (own) names.push('own words');
  let shown = names.length;
  const listOf = (count: number) =>
    names.slice(0, count).join(', ') + (count < names.length ? ` +${names.length - count} more` : '');
  while (shown > 1 && listOf(shown).length > LABEL_LIST_MAX_CHARS) shown -= 1;
  return listOf(shown);
}

/** A unique, short name for the new version, taken from what the user asked for. */
function labelFor(instruction: string, taken: string[], parts?: QuickChangeParts): string {
  const base = `Changed: ${labelText(instruction, parts)}`;
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
  // Shorter or Longer: the number is for the whole version. Kept parts and
  // testimonials stay as they are, so the rewritten part gets the rest.
  const direction = quickLengthDirection(parts?.ticked ?? []);
  let lengthTarget: number | null = null;
  let wholeTarget: number | null = null;
  if (direction) {
    const info = quickLengthInfo(result);
    if (info) {
      wholeTarget = parts?.targetWords ?? info[direction].suggested;
      const lengthProblem = quickLengthProblem(info, direction, wholeTarget);
      if (lengthProblem) throw new Error(lengthProblem);
      lengthTarget = Math.max(1, wholeTarget - info.fixed);
    }
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
    // The rewrite step's own heading rule (Title Case, "make them compelling") is
    // for writing new copy; a change keeps the headings the text has (see HEADINGS_CHANGE_NOTE).
    includeSectionTitles: false,
    specialInstructions: [
      KEEP_TO_ORIGINAL_CHANGE_NOTE,
      kindNote || HEADINGS_CHANGE_NOTE,
      keepInstructions(keepZones),
      testimonialInstructions(quoteZones),
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
  const request = requestFor(wanted, parts, lockedWords, lengthTarget);
  let rewritten = await modifyContent(locked, request, rewriteState, user, undefined, result.formState.sessionId);
  throwIfStopped(signal);
  // Shorter or Longer missed the number by more than LENGTH_TOLERANCE: one pass that changes only the length.
  if (direction && lengthTarget != null) {
    const got = countWords(contentToText(rewritten));
    const miss = Math.abs(got - lengthTarget);
    if (got > 0 && miss > LENGTH_MIN_MISS && miss / lengthTarget > LENGTH_TOLERANCE) {
      rewritten = await modifyContent(
        contentToText(rewritten),
        lengthCorrection(direction, lengthTarget, got),
        { ...rewriteState, customWordCount: got },
        user,
        undefined,
        result.formState.sessionId
      );
      throwIfStopped(signal);
    }
  }
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
    sourceDisplayName: labelFor(wanted, result.versions.map(version => version.sourceDisplayName || ''), parts),
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
    ...(wholeTarget != null ? { length: { target: wholeTarget, words: countWords(restored.text) } } : {}),
    previousBestScore: scores.absoluteByVersion[base.id]?.total ?? null,
    becameBest: newScores.winnerId === item.id,
  };
}
