/**
 * Quick — one more pass when the best version's call to action is weak.
 *
 * Under the Convert goal the scorer anchors Persuasion to the call to action,
 * and Quick's writer, which may only use what the copy says, often leaves a
 * soft "Contact us" in place: many winners score 13–14 of 25 there. After the
 * run, when the best version scores CTA_PASS_MAX_PERSUASION or less on
 * Persuasion, Quick makes the change "Stronger call to action" on it by itself
 * (the same change the user can tick under "Change it"; see
 * changeQuickVersion.ts), scored the way every version is. The new version is
 * kept only when it becomes the best by CTA_PASS_MIN_GAIN points or more;
 * otherwise the result stays exactly as the run left it.
 *
 * Tested on 2026-10-22 on five real Quick winners with Persuasion 13–14
 * (project note cta-pass-test-2026-10-22): Tidewell 70 → 72 / 76, a plumber's
 * page 65 → 73 / 73, a logotherapy page 74 → 78 / 76, a newsletter 73 → 79 / 79,
 * a 30-word slogan 66 → 66 / 66. No new facts in any attempt; the calls to
 * action used the copy's own contact methods. About 10–20 credits when it runs.
 *
 * It never throws, except when the user stops the run.
 */
import { User } from '../types';
import { changeQuickVersion, validateQuickChange } from './changeQuickVersion';
import { countWords } from '../utils/markdownUtils';
import { contentToText } from '../services/api/contentText';
import { quickTextKindOf } from './buildQuickFormState';
import { ORIGINAL_VERSION_ID } from './pickWinner';
import { QuickStoppedError } from './quickStop';
import type { QuickProgress, QuickRunResult } from './runQuickPipeline';

/** The pass runs when the best version scores this or less on Persuasion (of 25). */
export const CTA_PASS_MAX_PERSUASION = 17;
/** The new version is kept only when it scores at least this many points more than the best one. */
export const CTA_PASS_MIN_GAIN = 3;
/** Shorter texts have no room for a call to action of their own. */
const CTA_PASS_MIN_WORDS = 60;
/** The change, as it is named under "Change it". */
const CTA_CHANGE = 'Stronger call to action';
/** Goals that ask the reader to act. */
const ACTION_GOALS = ['convert', 'custom'];

export async function strengthenWeakCallToAction(
  result: QuickRunResult,
  user: User,
  onProgress?: (progress: QuickProgress) => void,
  signal?: AbortSignal
): Promise<QuickRunResult> {
  const winnerId = result.scores?.winnerId;
  const score = winnerId ? result.scores?.absoluteByVersion[winnerId] : undefined;
  const winner = winnerId ? result.versions.find(version => version.id === winnerId) : undefined;
  if (!winnerId || winnerId === ORIGINAL_VERSION_ID || !score || !winner) return result;
  if (!ACTION_GOALS.includes(result.goalKey)) return result;
  if (quickTextKindOf(result.formState).key === 'short_text') return result;
  if (score.persuasion > CTA_PASS_MAX_PERSUASION) return result;
  if (countWords(contentToText(winner.content)) < CTA_PASS_MIN_WORDS) return result;
  if (validateQuickChange(result, CTA_CHANGE)) return result;
  try {
    const outcome = await changeQuickVersion(result, CTA_CHANGE, user, onProgress, signal, { ticked: [CTA_CHANGE], own: '' });
    const before = outcome.previousBestScore;
    const after = outcome.newScore;
    if (outcome.becameBest && before != null && after != null && after - before >= CTA_PASS_MIN_GAIN) return outcome.result;
  } catch (error) {
    if (error instanceof QuickStoppedError) throw error;
  }
  return result;
}
