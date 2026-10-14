/**
 * Quick — "claims to verify" that only state a fact the user gave.
 *
 * The comparison lists every number, time or promise in a version as a claim
 * to verify. The facts the user added in "Make it stronger" are true, so a
 * claim that only states one of them is not listed. A claim that goes further
 * is: a stronger number, the number put to something else, a guarantee or a
 * refund the user never mentioned.
 *
 * Whether a claim only states a fact is a question of meaning, so one small
 * call (Haiku) answers it for all claims of a run at once. Until 2026-10-13
 * CopyZap compared words instead: it listed the user's own facts when the
 * writer reworded them, and hid "garantizamos la entrega en 6 semanas o te
 * devolvemos tu dinero" because it contains the user's "6 semanas". Measured on
 * 2026-10-13 on the claims of three reports plus eight invented ones (a refund,
 * "el más bajo del mercado", "siempre", a stronger number, a free offer merged
 * with a price…), each checked at least twice: the same answer every time, the
 * user's own facts hidden, every invented one listed.
 * Telling the comparison itself about the facts did not work: it still listed
 * some, and listed new non-claims instead.
 *
 * It never throws. On any failure nothing is hidden: the user sees a few notes
 * about their own facts, never a hidden invented claim.
 */
import { User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import { cleanUserFacts } from './missingFacts';

const CLAIM_CHECK_MODEL = 'claude-haiku-4-5';
/** Most claims checked in one run; more are left as they are (listed). */
const MAX_CLAIMS = 60;

const CLAIM_NOTE = /^\s*unverified claim\b/i;

/** The claim a note quotes: what follows the first ": ". */
function claimOf(note: string): string {
  const cut = note.indexOf(': ');
  return cut >= 0 ? note.slice(cut + 2).trim() : '';
}

const SYSTEM_PROMPT = `You check claims in marketing copy against facts the business owner confirmed. For each claim, answer true only when the claim states nothing beyond one of the facts: the same thing in other words, shorter, translated, or with the same number for the same thing. Answer false when the claim adds anything the facts do not state: a different or larger number, the number applied to something else, a guarantee, refund or promise, or words such as "always", "guaranteed", "fixed", "the best", "the lowest", "the only". When unsure, answer false. Answer with JSON only: {"results":[true,false,...]} with one entry per claim, in order.`;

/** The claims (as quoted in the notes) that only state one of the user's facts. Empty on any failure. */
export async function claimsStatingUserFacts(
  notes: string[],
  userFacts: string[] | null | undefined,
  user: User,
  sessionId?: string
): Promise<Set<string>> {
  const facts = cleanUserFacts(userFacts);
  const claims = Array.from(new Set(notes.filter(note => CLAIM_NOTE.test(note)).map(claimOf).filter(Boolean))).slice(
    0,
    MAX_CLAIMS
  );
  if (facts.length === 0 || claims.length === 0) return new Set();
  try {
    const response = await makeApiRequestWithFallback(
      CLAIM_CHECK_MODEL,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Facts the owner confirmed:\n${facts.map(fact => `- ${fact}`).join('\n')}\n\nClaims:\n${claims
            .map((claim, index) => `${index + 1}. ${claim}`)
            .join('\n')}`,
        },
      ],
      0,
      Math.min(1200, 100 + claims.length * 8),
      { type: 'json_object' },
      user.email,
      'quick_claim_check',
      sessionId
    );
    const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? ''));
    const results = (parsed as { results?: unknown })?.results;
    // A reply that does not answer every claim is not trusted.
    if (!Array.isArray(results) || results.length !== claims.length) return new Set();
    return new Set(claims.filter((_, index) => results[index] === true));
  } catch {
    return new Set();
  }
}

/** The notes without the claims that only state a user fact. Other notes stay, in their order. */
export function withoutStatedFacts(notes: string[] | null | undefined, stated: Set<string>): string[] {
  const list = Array.isArray(notes) ? notes : [];
  if (stated.size === 0) return list;
  return list.filter(note => !(CLAIM_NOTE.test(note) && stated.has(claimOf(note))));
}
