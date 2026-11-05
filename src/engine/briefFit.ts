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
 * This check answers five yes/no questions about the version against the
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

export type BriefFitMiss = 'address' | 'offer' | 'differentiator' | 'action' | 'piece';

export interface BriefFit {
  /** The checks the version fails. */
  misses: BriefFitMiss[];
  /** One sentence on the biggest gap, from the check. */
  note: string;
}

/** Points per failed check. The wrong form of address is the most serious. */
export const BRIEF_FIT_POINTS: Record<BriefFitMiss, number> = {
  address: 20,
  offer: 8,
  differentiator: 8,
  action: 6,
  piece: 6,
};
export const BRIEF_FIT_MAX_POINTS = 24;

/** What the result says for each failed check. */
export const BRIEF_FIT_LABELS: Record<BriefFitMiss, string> = {
  address: 'It does not address the reader the way your brief says (formal or informal)',
  offer: 'What the customer gets, from your brief, is missing',
  differentiator: 'What makes you different, from your brief, is missing',
  action: 'The action you asked the reader to take is missing',
  piece: 'It is not the kind of text, or the length, you asked for',
};

const FIELDS: [string, BriefFitMiss][] = [
  ['address_form_matches', 'address'],
  ['main_offer_present', 'offer'],
  ['differentiator_present', 'differentiator'],
  ['requested_action_present', 'action'],
  ['right_piece', 'piece'],
];

const BRIEF_FIT_PROMPT = `You check a piece of marketing copy against the client's brief it was written for. Do not score its quality. Answer five questions with true or false:
"address_form_matches": the copy addresses the reader in the form the brief sets (usted or tú, formal or informal) throughout. true when the brief sets none.
"main_offer_present": what the brief says the client gets is clearly in the copy.
"differentiator_present": the brief's main differentiator is clearly in the copy.
"requested_action_present": the copy asks for the action the brief names (wording may differ). true when the brief names no specific action.
"right_piece": the copy is the kind of piece the brief asks for, in a fitting length.
Judge only these five points. Facts the copy leaves out of a longer list, or facts it adds, do not count.
Return JSON only: {"address_form_matches": true|false, "main_offer_present": true|false, "differentiator_present": true|false, "requested_action_present": true|false, "right_piece": true|false, "note": "one short sentence naming the biggest gap, or empty"}`;

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
      200,
      { type: 'json_object' },
      user.email,
      'quick_brief_fit',
      sessionId
    );
    const raw = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(cleanJsonResponse(raw));
    if (!parsed || typeof parsed !== 'object') return null;
    const misses = FIELDS.filter(([field]) => parsed[field] === false).map(([, miss]) => miss);
    return { misses, note: typeof parsed.note === 'string' ? parsed.note.trim() : '' };
  } catch {
    return null;
  }
}

/** Points the failed checks cost, up to BRIEF_FIT_MAX_POINTS. */
export function briefFitPenalty(misses: BriefFitMiss[]): number {
  return Math.min(BRIEF_FIT_MAX_POINTS, misses.reduce((sum, miss) => sum + (BRIEF_FIT_POINTS[miss] ?? 0), 0));
}
