/**
 * Quick — invented details taken out before a version is scored.
 *
 * The writer is told to add no facts (keepToOriginal.ts), and mostly it keeps
 * to that. Not always: on 2026-10-14 Sales Boost's versions said "empresas
 * Fortune 500" twice in one day, once in the winning version, and other runs
 * added "24 horas" and "11pm". The checks on the result ("Numbers not in your
 * original", "Quoted words not in your original") showed them, but the version
 * was scored, and could win, with the detail in it.
 *
 * So right after writing, each version is checked the same way the result
 * screen checks it: numbers not in the original or the user's facts
 * (numberCheck.ts), and quoted words not in them (findUnverifiedQuotes). When
 * a version has any, one small call (Haiku) proposes the smallest edits that
 * take them out, as exact "find" and "replace" pairs. The edits are applied by
 * plain text replacement, so nothing else in the version can change; an edit
 * whose text is not found exactly once, or that touches a marker line, is not
 * applied. If the edited version has a number or quote the version did not
 * have before, all edits are dropped and the version stays as written.
 *
 * It never throws. On any failure the version stays as written, and the checks
 * on the result still show what it added.
 */
import { User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import { checkNumbers } from './numberCheck';
import { findUnverifiedQuotes } from './quoteLock';

const CLEANUP_MODEL = 'claude-haiku-4-5';
/** Most details taken out of one version; a version with more stays as written. */
const MAX_DETAILS = 8;

export interface CleanedVersion {
  text: string;
  /** The details taken out, as the check named them ("500", a quote). Empty when nothing changed. */
  removed: string[];
}

interface Detail {
  /** What to take out: the number as written, or the quoted words. */
  item: string;
  /** The sentence it stands in. */
  context: string;
}

/** The numbers and quoted words of a text that the allowed text does not have. */
export function inventedDetails(text: string, allowed: string): Detail[] {
  const numbers = checkNumbers(text, allowed).added.flatMap(finding =>
    finding.numbers.map(number => ({ item: number, context: finding.context }))
  );
  const quotes = findUnverifiedQuotes(text, allowed).map(quote => ({ item: quote, context: quote }));
  return [...numbers, ...quotes];
}

const SYSTEM_PROMPT = `You edit marketing copy so it states only what the business itself said. You get the copy and a list of details in it that the business never stated: numbers, and words put in quotation marks as if someone said them.

A number is part of a claim: "Fortune 500 companies" is a kind of client, "within 24 hours" is a promise, "3,000 teams" is a count of clients. Take out the whole claim the detail belongs to, never only the digits, and never put a vaguer form of the same claim in its place ("large companies", "leading organisations", "quickly", "many clients"). If the sentence says nothing once the claim is gone, the whole sentence goes. A quotation is removed together with its attribution.

For each edit give "find": text copied character for character from the copy, from a few words up to one sentence, containing the detail; and "replace": that text without the claim, or an empty string. Examples: "Trusted by 3,000 teams like yours, we set it up in a week." becomes "We set it up in a week."; "We reply within 24 hours." becomes "".
- Never add a number, name, result, promise or anything else the copy does not already say.
- Keep every other fact of the sentence, its other numbers and names included: only the listed details go.
- Change nothing that is not needed to take the claim out. Never touch a line like [[TESTIMONIALS-1]] or [[KEEP-1]].

Answer with JSON only: {"edits":[{"find":"...","replace":"..."}]}`;

const MARKER = /\[\[[^\]]*\]\]/;

function occurrences(text: string, part: string): number {
  if (!part) return 0;
  let count = 0;
  let at = text.indexOf(part);
  while (at >= 0) {
    count += 1;
    at = text.indexOf(part, at + part.length);
  }
  return count;
}

/**
 * The text with the edits applied, one by one. An edit that is not safe to
 * apply is left out: its text is not found exactly once, it touches a marker
 * line, or it takes out a number that is not one of the details (seen in a
 * test: "Más de 90 empresas en 20 países … un 35% más de cierres" became
 * "Empresas ya trabajan con nosotros", losing two real facts with the 35%).
 */
export function applyEdits(text: string, edits: unknown, details: string[] = []): string {
  if (!Array.isArray(edits)) return text;
  let result = text;
  let applied = 0;
  for (const edit of edits) {
    const find = typeof edit?.find === 'string' ? edit.find : '';
    const replace = typeof edit?.replace === 'string' ? edit.replace : null;
    if (!find.trim() || replace === null) continue;
    if (MARKER.test(find) || MARKER.test(replace)) continue;
    if (occurrences(result, find) !== 1) continue;
    const lost = checkNumbers(replace, find).dropped.flatMap(finding => finding.numbers);
    if (lost.some(number => !details.includes(number))) continue;
    result = result.replace(find, () => replace);
    applied += 1;
  }
  if (applied === 0) return text;
  // A sentence taken out can leave a double space or an empty line behind.
  return result
    .replace(/(\S)[ \t]{2,}(?=\S)/g, '$1 ')
    .replace(/ +([.,;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * The version with the details it added taken out. The allowed text is the
 * original and the facts the user added. Never throws.
 */
export async function removeInventedDetails(
  text: string,
  allowed: string,
  user: User,
  sessionId?: string
): Promise<CleanedVersion> {
  const unchanged: CleanedVersion = { text, removed: [] };
  const details = inventedDetails(text, allowed);
  if (details.length === 0 || details.length > MAX_DETAILS) return unchanged;
  try {
    const response = await makeApiRequestWithFallback(
      CLEANUP_MODEL,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Copy:\n"""\n${text}\n"""\n\nDetails to take out:\n${details
            .map((detail, index) => `${index + 1}. ${detail.item} (in: "${detail.context}")`)
            .join('\n')}`,
        },
      ],
      0,
      1200,
      { type: 'json_object' },
      user.email,
      'quick_detail_cleanup',
      sessionId
    );
    const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? '')) as { edits?: unknown };
    const edited = applyEdits(
      text,
      parsed?.edits,
      details.map(detail => detail.item)
    );
    if (edited === text || !edited.trim()) return unchanged;

    // Nothing new may come in, and the marker lines must all still be there.
    const before = new Set(details.map(detail => detail.item));
    const after = inventedDetails(edited, allowed);
    if (after.some(detail => !before.has(detail.item))) return unchanged;
    const markers = (value: string) => (value.match(/\[\[[^\]]*\]\]/g) ?? []).sort().join('|');
    if (markers(edited) !== markers(text)) return unchanged;

    const left = new Set(after.map(detail => detail.item));
    const removed = [...before].filter(item => !left.has(item));
    return removed.length > 0 ? { text: edited, removed } : unchanged;
  } catch {
    return unchanged;
  }
}
