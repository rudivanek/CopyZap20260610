/**
 * Quick, "Start from a brief": does a version do what the brief asked?
 *
 * The quality scorer reads the copy alone (absoluteScoring.ts). It cannot see
 * that a page says "tú" where the brief asks for "usted", or that an email
 * never mentions the guarantee the brief is built on. Tested 2026-11-05
 * (project note score-calibration-test-2026-11-05): the app scored a generic
 * one-liner email 71 where two blind judges gave 43, and a homepage that used
 * "tú" instead of "usted" 81 where they gave 54.
 *
 * This check answers six yes/no questions about the version against the
 * brief, in a separate call. Giving the brief to the quality scorer itself was
 * tried and rejected: once the scorer sees the brief it rates copy that
 * follows it 5 to 15 points too high, even when told not to.
 *
 * Each "no" costs points (BRIEF_FIT_POINTS, up to BRIEF_FIT_MAX_POINTS), taken
 * from the four parts' sum; the specificity cap (absoluteScoring.ts) and this
 * penalty do not add up: the lower of the two totals counts.
 * With the five checks and the cap, the app agreed with the judges at 0.94
 * (was 0.50), 3.7 points apart on average (was 8.5).
 *
 * It never throws: on any failure there is no check and no score changes.
 */
import { User } from '../types';
import { makeApiRequestWithFallback, cleanJsonResponse } from '../services/api/utils';

const BRIEF_FIT_MODEL = 'claude-sonnet-4-6' as const;

export type BriefFitMiss = 'address' | 'address_slip' | 'offer' | 'differentiator' | 'action' | 'piece';

export interface BriefFit {
  /** The checks the version fails. */
  misses: BriefFitMiss[];
  /** One sentence on the biggest gap, from the check. */
  note: string;
}

/**
 * Points per failed check. The wrong form of address is the most serious.
 * One or two words in the other form, in copy that otherwise uses the right
 * one, cost little: the user fixes them in a second (2026-11-05: one "tu" in a
 * sign-off cost an "usted" email the full 20 points).
 */
export const BRIEF_FIT_POINTS: Record<BriefFitMiss, number> = {
  address: 20,
  address_slip: 4,
  offer: 8,
  differentiator: 8,
  action: 6,
  piece: 6,
};
export const BRIEF_FIT_MAX_POINTS = 24;

/** What the result says for each failed check. */
export const BRIEF_FIT_LABELS: Record<BriefFitMiss, string> = {
  address: 'It does not address the reader the way your brief says (formal or informal)',
  address_slip: 'A word or two use the other form (formal or informal): change them before you publish',
  offer: 'What the customer gets, from your brief, is missing',
  differentiator: 'What makes you different, from your brief, is missing',
  action: 'The action you asked the reader to take is missing',
  piece: 'It is not the kind of text, or the length, you asked for',
};

const FIELDS: [string, BriefFitMiss][] = [
  ['address_form_matches', 'address'],
  ['address_form_no_slips', 'address_slip'],
  ['main_offer_present', 'offer'],
  ['differentiator_present', 'differentiator'],
  ['requested_action_present', 'action'],
  ['right_piece', 'piece'],
];

const BRIEF_FIT_PROMPT = `You check a piece of marketing copy against the client's brief it was written for. Do not score its quality. Reply with the JSON object only: no reasoning, no text before or after it. Answer six questions with true or false:
"address_form_matches": the copy addresses the reader mostly in the form the brief sets (usted or tú, formal or informal). false only when most of it uses the other form. true when the brief sets none.
"address_form_no_slips": no word in the copy uses the other form, the subject and sign-off included. true when the brief sets none, or when "address_form_matches" is false.
"main_offer_present": what the brief says the client gets is clearly in the copy.
"differentiator_present": the brief's main differentiator is clearly in the copy.
"requested_action_present": the copy asks for the action the brief names (wording may differ). true when the brief names no specific action (a goal such as "convert" is not an action).
"right_piece": the copy is the kind of piece the brief asks for, in a fitting length. A section the brief marks "only if facts exist" may be missing: that is not a fault.
Judge only these six points. Facts the copy leaves out of a longer list, or facts it adds, do not count.
Return JSON only: {"address_form_matches": true|false, "address_form_no_slips": true|false, "main_offer_present": true|false, "differentiator_present": true|false, "requested_action_present": true|false, "right_piece": true|false, "note": "one short sentence naming the biggest gap, quoting the word in the other form when there is one, or empty"}`;

/** The brief as the check reads it: the saved fields, one per line, without the ones that say nothing about the copy. */
export function briefFitText(fields: { label: string; value: string }[] | null | undefined): string {
  const skip = ['Started from', 'Goal', 'Tone'];
  return (fields ?? [])
    .filter(field => field && field.value && !skip.includes(field.label))
    .map(field => `${field.label}: ${field.value}`)
    .join('\n');
}

export async function checkBriefFit(
  text: string,
  brief: string,
  user: User,
  sessionId?: string
): Promise<BriefFit | null> {
  const copy = (text || '').trim();
  const asked = (brief || '').trim();
  if (!copy || !asked) return null;
  try {
    const response = await makeApiRequestWithFallback(
      BRIEF_FIT_MODEL,
      [
        { role: 'system', content: BRIEF_FIT_PROMPT },
        { role: 'user', content: `The client's brief:\n<brief>\n${asked}\n</brief>\n\nThe copy:\n"""\n${copy}\n"""` },
      ],
      0,
      300,
      { type: 'json_object' },
      user.email,
      'quick_brief_fit',
      sessionId
    );
    const raw = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(cleanJsonResponse(raw));
    if (!parsed || typeof parsed !== 'object') return null;
    const found = FIELDS.filter(([field]) => parsed[field] === false).map(([, miss]) => miss);
    // Copy in the wrong form throughout is not also charged for slips. And a
    // brief that names no action cannot be missed on it: the check read a goal
    // such as "convert" as an action now and then (2026-11-05).
    const namesAction = /^[-*\s]*(What the reader should do|Call to action|Action)\s*:/im.test(asked);
    const misses = found
      .filter(miss => !(miss === 'address_slip' && found.includes('address')))
      .filter(miss => miss !== 'action' || namesAction);
    return { misses, note: typeof parsed.note === 'string' ? parsed.note.trim() : '' };
  } catch {
    return null;
  }
}

/** Points the failed checks cost, up to BRIEF_FIT_MAX_POINTS. */
export function briefFitPenalty(misses: BriefFitMiss[]): number {
  return Math.min(BRIEF_FIT_MAX_POINTS, misses.reduce((sum, miss) => sum + (BRIEF_FIT_POINTS[miss] ?? 0), 0));
}
