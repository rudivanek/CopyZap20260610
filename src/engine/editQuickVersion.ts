/**
 * Quick — edit the best version by hand and score the edit.
 *
 * The user gets the best version as plain text, changes what they want, and
 * has the result scored. Nothing is rewritten by the engine, so it costs only
 * a scoring run. The edit joins the same result as one more version, and the
 * best version is chosen by score again.
 *
 * Protected parts are not editable. In the text the user edits, each one is a
 * single line in double square brackets that says what it stands for. When the
 * edit is scored, that line is replaced by the part itself, word for word. A
 * line that was deleted is not lost: the part goes back before the last section
 * and the result says so.
 */
import { GeneratedContentItem, GeneratedContentItemType, User } from '../types';
import { contentToText } from '../services/api/contentText';
import { checkUserAccess } from '../services/supabaseClient';
import { countWords } from '../utils/markdownUtils';
import { lockVersion, QUICK_MAX_VERSIONS } from './changeQuickVersion';
import type { QuickChangeOutcome } from './changeQuickVersion';
import { findUnverifiedQuotes, restoreTestimonials } from './quoteLock';
import type { TestimonialZone } from './quoteLock';
import { QuickRunResult, scoreQuickVersions, withQuickResult } from './runQuickPipeline';
import type { QuickProgress } from './runQuickPipeline';

export const QUICK_EDIT_MIN_WORDS = 10;

export interface QuickEditDraft {
  /** The best version as editable text, with one bracketed line per protected part. */
  text: string;
  /** The protected parts, to be put back when the edit is scored. */
  zones: TestimonialZone[];
}

const firstLine = (text: string) =>
  (text.split('\n').find(line => line.trim()) || '').replace(/^#{1,6}\s+/, '').replace(/[*_`]/g, '').trim();

/** What a bracketed line tells the user about the part it stands for. */
function describe(zone: TestimonialZone): string {
  if (zone.marker.startsWith('[[KEEP')) {
    const title = firstLine(zone.text);
    const name = title ? `"${title.length > 50 ? `${title.slice(0, 50).trim()}…` : title}"` : 'A part of the page';
    return `${name}, kept as it is (${countWords(zone.text)} words). Leave this line where the part belongs.`;
  }
  const what = zone.count === 1 ? '1 testimonial' : `${zone.count} testimonials`;
  return `${what}, kept word for word. Leave this line where ${zone.count === 1 ? 'it belongs' : 'they belong'}.`;
}

/** The best version, ready to be edited by hand. Null when there is no best version yet. */
export function prepareQuickEdit(result: QuickRunResult): QuickEditDraft | null {
  const winnerId = result.scores?.winnerId;
  const base = winnerId ? result.versions.find(version => version.id === winnerId) : undefined;
  if (!base) return null;

  const { locked, zones } = lockVersion(contentToText(base.content), result.keptTexts);
  let text = locked;
  for (const zone of zones) {
    // The whole line is replaced by the part later, so the explanation can sit on it.
    text = text.replace(zone.marker, `${zone.marker} ${describe(zone)}`);
  }
  return { text, zones };
}

/** Why an edit cannot be scored right now, or null when it can. */
export function validateQuickEdit(result: QuickRunResult, text: string, startedFrom: string): string | null {
  if (!result.scores || !result.scores.winnerId) return 'Score this result first; an edit starts from the best version.';
  if (result.versions.length - 1 >= QUICK_MAX_VERSIONS) {
    return `This result already has ${QUICK_MAX_VERSIONS} versions. Start a new one to keep going.`;
  }
  if (countWords(text) < QUICK_EDIT_MIN_WORDS) return `An edit needs at least ${QUICK_EDIT_MIN_WORDS} words.`;
  if (text.trim() === startedFrom.trim()) return 'Nothing has been changed yet.';
  return null;
}

function labelFor(taken: string[]): string {
  let label = 'Your edit';
  for (let n = 2; taken.includes(label); n += 1) label = `Your edit (${n})`;
  return label;
}

export async function scoreQuickEdit(
  result: QuickRunResult,
  draft: QuickEditDraft,
  editedText: string,
  user: User,
  onProgress?: (progress: QuickProgress) => void
): Promise<QuickChangeOutcome> {
  const problem = validateQuickEdit(result, editedText, draft.text);
  if (problem) throw new Error(problem);
  const scores = result.scores!;
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

  // Put the protected parts back in place of their bracketed lines.
  const restored =
    draft.zones.length > 0 ? restoreTestimonials(editedText, draft.zones) : { text: editedText.trim(), moved: false };

  const original = result.formState.originalCopy || '';
  const item: GeneratedContentItem = {
    id: crypto.randomUUID(),
    type: GeneratedContentItemType.Improved,
    content: restored.text,
    generatedAt: new Date().toISOString(),
    sourceId: base.id,
    sourceType: base.type,
    sourceDisplayName: labelFor(result.versions.map(version => version.sourceDisplayName || '')),
    sourceText: original,
  };
  const versions = [...result.versions, item];

  // Versions scored before keep their score; only the edit gets a new one.
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
