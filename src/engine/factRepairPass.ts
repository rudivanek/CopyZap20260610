/**
 * Quick — one more pass when the best version left out key facts.
 *
 * Quick lists the original's key facts and takes LEFT_OUT_POINTS off a version
 * for each one it leaves out (keyFacts.ts). Until now nothing put them back:
 * the best version could still miss a price, a menu or a credential, and the
 * reader lost it. After the run, when the best version has left-out facts,
 * one call puts just those facts back (FIX_PROMPT) and the new version is
 * scored the way an edit is (editQuickVersion.ts: protected parts back in
 * place, claims and left-out checks, the same scorer). It is kept, as
 * "Facts put back", only when it becomes the best version; otherwise the
 * result stays exactly as the run left it.
 *
 * Tested on 2026-10-22 on six real Quick winners with 1–3 left-out facts
 * (project note left-out-repair-test-2026-10-22): two attempts each, average
 * +5 points after Quick's own deduction (Bella Cucina 70 → 75 / 76, Tidewell
 * 61 → 67 / 70, Logoforo seminar 75 → 84 / 84, Sales Boost 76 → 79 / 79,
 * Logoforo articles 68 → 73 / 72, bike shop 82 → 83 / 82). Every fact back,
 * the score before deductions unchanged, no new claims.
 *
 * Runs before the call-to-action pass (ctaPass.ts), which then looks at the
 * repaired version when it is the best. About 10–20 credits when it runs.
 * It never throws, except when the user stops the run.
 */
import { User } from '../types';
import { makeApiRequestWithFallback } from '../services/api/utils';
import { countWords } from '../utils/markdownUtils';
import { ORIGINAL_VERSION_ID } from './pickWinner';
import { QuickStoppedError, throwIfStopped } from './quickStop';
import { cleanUserFacts } from './missingFacts';
import { prepareQuickEdit, scoreQuickEdit, validateQuickEdit } from './editQuickVersion';
import { withQuickResult } from './runQuickPipeline';
import type { QuickProgress, QuickRunResult } from './runQuickPipeline';

/** The name the new version gets when it is kept. */
export const FACT_REPAIR_LABEL = 'Facts put back';
const FACT_REPAIR_MODEL = 'claude-sonnet-4-6';
/** The longest original sent with the pass. */
const ORIGINAL_MAX_CHARS = 20000;
const NEWLINE = String.fromCharCode(10);
const TRIPLE_QUOTE = '"""';

/** The prompt of the 2026-10-22 test, with the protected lines added. */
const FIX_PROMPT = `You repair a rewritten piece of marketing copy. The rewrite left out facts that the original states. Put each of these facts back into the copy:
__FACTS__

How:
- Put each fact where it helps the reader most, in the copy's own style: in a sentence, a list or the section it belongs to. Keep its numbers, names and conditions exactly as the original states them; check the original for the details.
- When the copy states a different number or name for the same thing ("15 years" where the fact says "20 years"), replace it with the fact's. Never state both.
- A list (a programme, a menu, services, places) keeps every item the original names.
- Add nothing else: no fact, offer, number, promise or detail that is not in the copy, the original or the owner's facts.
- Keep everything else as it is: the same language, wording, headings, order and call to action; testimonials word for word. Add only the words the facts need.
- A line in double square brackets stands for a part of the page that is kept as it is: keep each such line exactly as it is, in its place.

Return only the full copy, nothing else.`;

export async function putBackLeftOutFacts(
  result: QuickRunResult,
  user: User,
  onProgress?: (progress: QuickProgress) => void,
  signal?: AbortSignal
): Promise<QuickRunResult> {
  const winnerId = result.scores?.winnerId;
  const score = winnerId ? result.scores?.absoluteByVersion[winnerId] : undefined;
  if (!winnerId || winnerId === ORIGINAL_VERSION_ID || !score) return result;
  const missing = (score.left_out ?? []).map(fact => fact.trim()).filter(Boolean);
  if (missing.length === 0) return result;
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
      FACT_REPAIR_MODEL,
      [
        { role: 'system', content: FIX_PROMPT.replace('__FACTS__', missing.map(fact => `- ${fact}`).join(NEWLINE)) },
        { role: 'user', content: message },
      ],
      0.3,
      Math.min(12000, 1000 + countWords(draft.text) * 3),
      undefined,
      user.email,
      'quick_fact_repair',
      result.formState.sessionId
    );
    throwIfStopped(signal);
    const text = (response.choices[0]?.message?.content ?? '').trim();
    if (!text || validateQuickEdit(result, text, draft.text)) return result;
    const outcome = await scoreQuickEdit(result, draft, text, user, onProgress, signal);
    if (!outcome.becameBest) return result;
    // Kept: named for what it is, not "Your edit".
    const versions = outcome.result.versions.map(version =>
      version.id === outcome.newVersionId ? { ...version, sourceDisplayName: FACT_REPAIR_LABEL } : version
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
