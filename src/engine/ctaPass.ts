/**
 * Quick — one more pass when the best version's call to action is weak.
 *
 * Under the Convert goal the scorer anchors Persuasion to the call to action,
 * and Quick's writer, which may only use what the copy says, often leaves a
 * soft "Contact us" in place: many winners score 13–14 of 25 there. After the
 * run, when the best version scores CTA_PASS_MAX_PERSUASION or less on
 * Persuasion, one call rewrites only how it asks the reader to act (CTA_PROMPT)
 * and the new version is scored the way an edit is (editQuickVersion.ts:
 * protected parts back in place, claims and left-out checks, the same scorer).
 * It is kept, as "Stronger call to action", only when it becomes the best by
 * CTA_PASS_MIN_GAIN points or more; otherwise the result stays exactly as the
 * run left it.
 *
 * Tested on 2026-10-22 on five real Quick winners with Persuasion 13–14
 * (project note cta-pass-test-2026-10-22): Tidewell 70 → 72 / 76, a plumber's
 * page 65 → 73 / 73, a logotherapy page 74 → 78 / 76, a newsletter 73 → 79 / 79,
 * a 30-word slogan 66 → 66 / 66. No new facts in any attempt. The first build
 * used the change "Stronger call to action" (changeQuickVersion.ts) instead;
 * live on Tidewell it left the bare "Contact us" in place (69 → 70), so the pass
 * now has its own prompt, and it sees the original, whose ways to act (a form,
 * an email) a version may have dropped.
 *
 * About 10–20 credits when it runs. It never throws, except when the user stops the run.
 */
import { User } from '../types';
import { makeApiRequestWithFallback } from '../services/api/utils';
import { countWords } from '../utils/markdownUtils';
import { contentToText } from '../services/api/contentText';
import { quickTextKindOf } from './buildQuickFormState';
import { ORIGINAL_VERSION_ID } from './pickWinner';
import { QuickStoppedError, throwIfStopped } from './quickStop';
import { cleanUserFacts } from './missingFacts';
import { prepareQuickEdit, scoreQuickEdit, validateQuickEdit } from './editQuickVersion';
import { withQuickResult } from './runQuickPipeline';
import type { QuickProgress, QuickRunResult } from './runQuickPipeline';

/** The pass runs when the best version scores this or less on Persuasion (of 25). */
export const CTA_PASS_MAX_PERSUASION = 17;
/** The new version is kept only when it scores at least this many points more than the best one. */
export const CTA_PASS_MIN_GAIN = 3;
/** Shorter texts have no room for a call to action of their own. */
const CTA_PASS_MIN_WORDS = 60;
/** The name the new version gets when it is kept. */
export const CTA_PASS_LABEL = 'Stronger call to action';
/** Goals that ask the reader to act. */
const ACTION_GOALS = ['convert', 'custom'];
const CTA_MODEL = 'claude-sonnet-4-6';
/** The longest original sent with the pass. */
const ORIGINAL_MAX_CHARS = 20000;
const NEWLINE = String.fromCharCode(10);
const TRIPLE_QUOTE = '"""';

/** The prompt of the 2026-10-22 test, with the protected lines and the original added. */
const CTA_PROMPT = `You improve only how a piece of marketing copy asks the reader to act. A reviewer found the call to action weak: "__NOTE__"

Make the call to action clear and specific:
- Put a clear call to action where the reader decides: after the main benefit and at the end. You may say it twice, not more.
- Start it with a specific action verb and say exactly what the reader does and what happens next, using only what the copy or the original already says: its offer, its contact method (a form, an email, a phone number), its next step.
- Add nothing the copy or the original does not state: no new offer, free extra, discount, deadline, urgency, scarcity, guarantee, response time, number, price, quote or result. No links, no buttons, no markdown link syntax.
- Keep everything else as it is: the same language, facts, sections and order, testimonials word for word, about the same length. Change only the sentences that ask for action and, where needed, the sentence just before them.
- A line in double square brackets stands for a part of the page that is kept as it is: keep each such line exactly as it is, in its place.

You also get the original the copy was written from. Use it only to know how the reader can act and what is true; copy nothing else from it.

Return only the full copy, nothing else.`;

/**
 * True when the pass would run on this result: an action goal, not a short
 * text, the best version's Persuasion at CTA_PASS_MAX_PERSUASION or lower, and
 * long enough. Since 2026-11-04 the pass runs only when the user asks for it
 * ("Strengthen the call to action" on the result): run automatically it added
 * 1 to 2.5 minutes to about one run in five.
 */
export function ctaPassApplies(result: QuickRunResult): boolean {
  const winnerId = result.scores?.winnerId;
  const score = winnerId ? result.scores?.absoluteByVersion[winnerId] : undefined;
  const winner = winnerId ? result.versions.find(version => version.id === winnerId) : undefined;
  if (!winnerId || winnerId === ORIGINAL_VERSION_ID || !score || !winner) return false;
  if (winner.sourceDisplayName === CTA_PASS_LABEL) return false;
  if (!ACTION_GOALS.includes(result.goalKey)) return false;
  if (quickTextKindOf(result.formState).key === 'short_text') return false;
  if (score.persuasion > CTA_PASS_MAX_PERSUASION) return false;
  return countWords(contentToText(winner.content)) >= CTA_PASS_MIN_WORDS;
}

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
  const draft = prepareQuickEdit(result);
  if (!draft) return result;
  try {
    throwIfStopped(signal);
    const facts = cleanUserFacts(result.formState.quickUserFacts ?? []);
    const message = [
      'COPY:',
      TRIPLE_QUOTE,
      draft.text,
      TRIPLE_QUOTE,
      '',
      'THE ORIGINAL:',
      TRIPLE_QUOTE,
      (result.formState.originalCopy || '').slice(0, ORIGINAL_MAX_CHARS),
      TRIPLE_QUOTE,
      ...(facts.length > 0 ? ['', 'The owner’s facts (true):', ...facts.map(fact => `- ${fact}`)] : []),
    ].join(NEWLINE);
    const response = await makeApiRequestWithFallback(
      CTA_MODEL,
      [
        { role: 'system', content: CTA_PROMPT.replace('__NOTE__', (score.persuasion_note || '').trim()) },
        { role: 'user', content: message },
      ],
      0.4,
      Math.min(8000, 800 + countWords(draft.text) * 3),
      undefined,
      user.email,
      'quick_cta_pass',
      result.formState.sessionId
    );
    throwIfStopped(signal);
    const text = (response.choices[0]?.message?.content ?? '').trim();
    if (!text || validateQuickEdit(result, text, draft.text)) return result;
    const outcome = await scoreQuickEdit(result, draft, text, user, onProgress, signal);
    const before = outcome.previousBestScore;
    const after = outcome.newScore;
    if (!outcome.becameBest || before == null || after == null || after - before < CTA_PASS_MIN_GAIN) return result;
    // Kept: named for what it is, not "Your edit".
    const versions = outcome.result.versions.map(version =>
      version.id === outcome.newVersionId ? { ...version, sourceDisplayName: CTA_PASS_LABEL } : version
    );
    const scores = outcome.result.scores;
    return {
      ...outcome.result,
      versions,
      formState: scores ? withQuickResult(outcome.result.formState, versions, scores) : outcome.result.formState,
    };
  } catch (error) {
    if (error instanceof QuickStoppedError) throw error;
    return result;
  }
}
