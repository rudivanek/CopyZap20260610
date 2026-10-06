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

/** Versions one result can hold besides the original. The comparison reads them all together. */
export const QUICK_MAX_VERSIONS = 8;
/** The rewrite step returns at most about this much text in one piece. */
export const QUICK_CHANGE_MAX_WORDS = 1200;
export const QUICK_CHANGE_MIN_CHARS = 3;
export const QUICK_CHANGE_MAX_CHARS = 300;
const LABEL_MAX_CHARS = 40;

export interface QuickChangeOutcome {
  result: QuickRunResult;
  newVersionId: string;
  /** The new version's quality score; null when it could not be scored. */
  newScore: number | null;
  becameBest: boolean;
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
  onProgress?: (progress: QuickProgress) => void
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
  onProgress?.({ stage: 'writing', done: 0, total: 1 });
  const keepZones = zones.filter(zone => zone.marker.startsWith('[[KEEP'));
  const quoteZones = zones.filter(zone => !zone.marker.startsWith('[[KEEP'));
  const rewriteState: FormState = {
    ...result.formState,
    wordCount: 'Custom',
    customWordCount: lockedWords,
    specialInstructions: [keepInstructions(keepZones), testimonialInstructions(quoteZones)].filter(Boolean).join('\n\n'),
  };
  const rewritten = await modifyContent(locked, wanted, rewriteState, user, undefined, result.formState.sessionId);
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
  const newScores = await scoreQuickVersions(result.formState, versions, result.goalKey, user, onProgress, scores);

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
    becameBest: newScores.winnerId === item.id,
  };
}
