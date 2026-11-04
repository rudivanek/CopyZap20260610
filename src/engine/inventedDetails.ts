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
 * (numberCheck.ts), quoted words not in them (findUnverifiedQuotes), and
 * words that make a claim stronger than they do, like "certificada" or "la
 * máxima autoridad mundial" (claimWords.ts, since 2026-10-15). When
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
import { findUpgradedClaims } from './claimWords';
import { findUnverifiedQuotes } from './quoteLock';
import { standsIn } from './sourceClaims';

/**
 * Sonnet since 2026-10-19: on a 2,000-word page (GrokBot's Long Time Plumbing
 * run) Haiku's answer was cut off at the output limit, so nothing was taken
 * out, and the version won with "Jefferson and Shelby County" and "no
 * callbacks" in it.
 */
const CLEANUP_MODEL = 'claude-sonnet-4-6';
/** Room for the answer: one edit per sentence on a long page. 1,200 until 2026-10-19. */
const CLEANUP_MAX_TOKENS = 4000;
/**
 * Details sent in one cleanup call. A version with more is cleaned in rounds
 * of this many, each on the text the round before left.
 */
const DETAILS_PER_CALL = 20;
/**
 * Most details taken out of one version; a version with more stays as written.
 * Until 2026-10-20 this was DETAILS_PER_CALL (20), so a version with 21 or
 * more was not cleaned at all: in a live run of the plumber page the best
 * version kept all 22 of its claims and won with them.
 */
const MAX_DETAILS = 60;

export interface CleanedVersion {
  text: string;
  /** The details taken out, as the check named them ("500", a quote). Empty when nothing changed. */
  removed: string[];
}

interface Detail {
  /** What to take out: the number as written, the quoted words, or the words that make a claim stronger. */
  item: string;
  /** The sentence it stands in. */
  context: string;
  /** A word that makes a claim stronger ("certificada"): only it goes, not the whole claim. */
  upgrade?: boolean;
  /** A fact about the business the original does not state ("scratch-made"; see sourceClaims.ts). */
  claim?: boolean;
}

/**
 * The numbers, quoted words and claim-strengthening words (claimWords.ts) of
 * a text that the allowed text does not have.
 */
export function inventedDetails(text: string, allowed: string): Detail[] {
  const numbers = checkNumbers(text, allowed).added.flatMap(finding =>
    finding.numbers.map(number => ({ item: number, context: finding.context }))
  );
  const quotes = findUnverifiedQuotes(text, allowed).map(quote => ({ item: quote, context: quote }));
  const upgrades = findUpgradedClaims(text, allowed).map(claim => ({
    item: claim.words,
    context: claim.context,
    upgrade: true,
  }));
  return [...numbers, ...quotes, ...upgrades];
}

const SYSTEM_PROMPT = `You edit marketing copy so it states only what the business itself said. You get the copy and a list of details in it that the business never stated: numbers, and words put in quotation marks as if someone said them.

A number is part of a claim: "Fortune 500 companies" is a kind of client, "within 24 hours" is a promise, "3,000 teams" is a count of clients. Take out the whole claim the detail belongs to, never only the digits, and never put a vaguer form of the same claim in its place ("large companies", "leading organisations", "quickly", "many clients"). If the sentence says nothing once the claim is gone, the whole sentence goes. A quotation is removed together with its attribution.

For each edit give "find": text copied character for character from the copy, one whole sentence (or a whole list item or heading) containing the detail, so that it appears only once in the copy; when the same words appear in several sentences, give one edit for each of those sentences; and "replace": that text without the claim, or an empty string. Examples: "Trusted by 3,000 teams like yours, we set it up in a week." becomes "We set it up in a week."; "We reply within 24 hours." becomes "".
Some details are marked "makes a claim stronger": words such as "certificada", "la máxima autoridad mundial", "oficial", "garantiza" or "guaranteed" that the business never used. For these, take out only those words, so the sentence says what the business said. Examples: "psicóloga y logoterapeuta certificada con 32 años de experiencia" becomes "psicóloga y logoterapeuta con 32 años de experiencia"; "del Instituto Viktor Frankl de Viena — la máxima autoridad mundial en esta metodología." becomes "del Instituto Viktor Frankl de Viena."; "Repairs the same day, guaranteed." becomes "Repairs the same day."
Every edit only deletes words: "replace" is "find" with words taken out. Never add a word, and never swap a word for another one (not "handcrafted" for "beautifully crafted", not "transparent" for "honest"); an edit that adds a word is not applied.
What is left after an edit must be a complete sentence that reads correctly on its own: it has a subject and a verb, and the verb agrees with its subject. Never leave a fragment such as "Fresh ingredients.", a clause such as "Whether you're gathering 20 people or 300.", or a sentence whose verb no longer fits, such as "Competitive pricing speak for themselves." If taking the listed words out cannot leave a complete, correct sentence, take out the whole sentence (replace with an empty string). Headings and list items may stay short. Examples: "Real food built from fresh ingredients." (listed: "Real food built from") becomes ""; "Whether you're gathering 20 people or 300, we've handled them all." (listed: "we've handled them all") becomes ""; "Competitive pricing and glowing reviews speak for themselves." (listed: "glowing reviews") becomes "".
Some details are marked "not in the original": words that state a fact about the business the business never stated, such as "scratch-made", "a seasoned team", "honest pricing" or "Austin hosts choose us". Take out those words; keep the rest of the sentence when it still says something, and take out the whole sentence when nothing is left. Never put a vaguer claim of the same kind in their place, and never take out words that are not listed: a word like "fresh" stays when it is not in the list. Examples: "Our scratch-made Italian menu — handcrafted lasagna, fresh pasta, tiramisu" (listed: "scratch-made", "handcrafted") becomes "Our Italian menu — lasagna, fresh pasta, tiramisu"; "A seasoned team that arrives ready." (listed: "A seasoned team that arrives ready") becomes "".
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
/** Words of up to this many letters ("y", "and", "de") may be added, so a sentence still reads after a cut. */
const SMALL_WORD_LETTERS = 3;

/** The words of a text: letters and digits, lowercase. */
function wordsOf(text: string): string[] {
  return (text || '').normalize('NFKC').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** True when `replace` has a word (longer than SMALL_WORD_LETTERS) that `find` does not have. */
export function addsWords(find: string, replace: string): boolean {
  const had = new Set(wordsOf(find));
  return wordsOf(replace).some(word => word.length > SMALL_WORD_LETTERS && !had.has(word));
}

/**
 * True when leaving `replace` in place of `find` would leave a sentence
 * fragment: a sentence whose start was cut, a clause with no main sentence, or
 * a sentence whose subject no longer agrees with its verb. Only whole
 * sentences (ending with . ! or ?) are checked; headings and list items are
 * left alone.
 */
function leavesFragment(find: string, replace: string): boolean {
  if (!replace.trim()) return false;
  const findTrim = find.trimStart();
  if (/^(#|-|\*|•|\d+[.)])/i.test(findTrim)) return false;
  const findTrimEnd = find.trim();
  if (!/[.!?]['"]?$/.test(findTrimEnd)) return false;
  const findWords = wordsOf(find);
  const replaceWords = wordsOf(replace);
  const startRemoved =
    findWords.length > 0 &&
    replaceWords.length > 0 &&
    replaceWords[0] !== findWords[0];
  const fewWords = replaceWords.length <= 3;
  if (startRemoved && fewWords) return true;
  const clauseStarters = [
    'whether', 'if', 'when', 'while', 'although', 'though', 'because', 'since',
    'unless', 'whereas', 'si', 'cuando', 'mientras', 'aunque', 'porque', 'wenn',
    'weil', 'obwohl', 'ob',
  ];
  const replaceLower = replace.trim().toLowerCase();
  const startsWithStarter = clauseStarters.some(
    word => replaceLower === word || replaceLower.startsWith(word + ' ')
  );
  if (startsWithStarter && !/[,,:?]/.test(replace.trim())) return true;
  return false;
}

/**
 * When an edit removed the start of the sentence, the leftover words begin
 * mid-sentence with a lowercase letter. Capitalise the first letter so the
 * result reads as a standalone sentence.
 */
function capitalizeIfCut(find: string, replace: string): string {
  const findWords = wordsOf(find);
  const replaceWords = wordsOf(replace);
  const startRemoved =
    findWords.length > 0 &&
    replaceWords.length > 0 &&
    replaceWords[0] !== findWords[0];
  if (!startRemoved) return replace;
  const match = replace.match(/^([ \t]*)([a-z])/);
  if (!match) return replace;
  return match[1] + match[2].toUpperCase() + replace.slice(match[0].length);
}

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
    // An edit may only take words out. Seen 2026-10-18: asked to take out
    // "scratch-made" and "transparent pricing", the cleanup put "beautifully
    // crafted" and "honest food built from quality ingredients" in their place.
    if (addsWords(find, replace)) continue;
    const finalReplace = leavesFragment(find, replace) ? '' : capitalizeIfCut(find, replace);
    result = result.replace(find, () => finalReplace);
    applied += 1;
  }
  if (applied === 0) return text;
  // A sentence taken out can leave a double space or an empty line behind.
  // It can also leave an empty bullet ("- ") or a sentence that now ends on a
  // comma at the end of its paragraph (seen 2026-11-04: a hero's third bullet
  // and a blog post's "…el servidor de alojamiento,"): both are tidied here.
  return result
    .replace(/^[ \t]*(?:[-*•]|\d+[.)])[ \t]*(?:\*\*[ \t]*\*\*)?[ \t]*$\n?/gm, '')
    .replace(/,[ \t]*$/gm, '.')
    .replace(/(\S)[ \t]{2,}(?=\S)/g, '$1 ')
    .replace(/ +([.,;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[ \t]+(?![ \t]|[-*•]|\d+[.)])/gm, '')
    .trim();
}

/**
 * The version with the details it added taken out. The allowed text is the
 * original and the facts the user added. `claims` are the facts about the
 * business the original does not state, from sourceClaims.ts. Never throws.
 */
export async function removeInventedDetails(
  text: string,
  allowed: string,
  user: User,
  sessionId?: string,
  claims: string[] = [],
  /**
   * onlyClaims: take out only the claims given, nothing else the version adds
   * (the user's "Remove it" on one claim; see claimReview.ts).
   */
  options: { onlyClaims?: boolean } = {}
): Promise<CleanedVersion> {
  const unchanged: CleanedVersion = { text, removed: [] };
  // What the version adds before any edit: an edit may not bring in anything else.
  const existing = inventedDetails(text, allowed);
  const found = options.onlyClaims ? [] : existing;
  const claimDetails: Detail[] = claims
    .filter(claim => !found.some(detail => standsIn(detail.item, claim) || standsIn(claim, detail.item)))
    .map(claim => ({ item: claim, context: claim, claim: true }));
  const details = [...found, ...claimDetails];
  if (details.length === 0 || details.length > MAX_DETAILS) return unchanged;
  try {
    // In rounds of DETAILS_PER_CALL, each on the text the round before left.
    let edited = text;
    for (let start = 0; start < details.length; start += DETAILS_PER_CALL) {
      const round = details.slice(start, start + DETAILS_PER_CALL);
      const response = await makeApiRequestWithFallback(
        CLEANUP_MODEL,
        [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Copy:\n"""\n${edited}\n"""\n\nDetails to take out:\n${round
              .map(
                (detail, index) =>
                  `${index + 1}. ${detail.item}${
                    detail.upgrade ? ' (makes a claim stronger)' : detail.claim ? ' (not in the original)' : ''
                  } (in: "${detail.context}")`
              )
              .join('\n')}`,
          },
        ],
        0,
        CLEANUP_MAX_TOKENS,
        { type: 'json_object' },
        user.email,
        'quick_detail_cleanup',
        sessionId
      );
      const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? '')) as { edits?: unknown };
      edited = applyEdits(
        edited,
        parsed?.edits,
        details.map(detail => detail.item)
      );
    }
    if (edited === text || !edited.trim()) return unchanged;

    // Nothing new may come in, and the marker lines must all still be there.
    const before = new Set([...details, ...existing].map(detail => detail.item));
    const after = inventedDetails(edited, allowed);
    if (after.some(detail => !before.has(detail.item))) return unchanged;
    const markers = (value: string) => (value.match(/\[\[[^\]]*\]\]/g) ?? []).sort().join('|');
    if (markers(edited) !== markers(text)) return unchanged;

    const left = new Set(after.map(detail => detail.item));
    // A fact not in the original is gone when its words no longer stand in the version.
    const removed = details
      .filter(detail => (detail.claim ? !standsIn(detail.item, edited) : !left.has(detail.item)))
      .map(detail => detail.item);
    return removed.length > 0 ? { text: closeTableGaps(edited), removed } : unchanged;
  } catch {
    return unchanged;
  }
}

/**
 * A markdown table after rows were taken out of it. An edit that takes out a
 * row can leave an empty line, or a row with only empty cells, between the
 * rows that stay; an empty line ends a markdown table, so everything after it
 * showed as raw "| ... |" text (seen 2026-10-22: Logoforo's price table, after
 * the invented "$47 USD" rows were taken out of the best version). Empty lines
 * between two table rows and rows whose cells are all empty are taken out;
 * nothing else changes.
 */
export function closeTableGaps(text: string): string {
  const isRow = (line: string | undefined) => line !== undefined && line.trim().startsWith('|');
  const isEmptyRow = (line: string) => {
    if (!isRow(line)) return false;
    const cells = line.trim().split('|').slice(1, -1);
    return cells.length > 0 && cells.every(cell => cell.trim() === '');
  };
  const lines = text.split(String.fromCharCode(10)).filter(line => !isEmptyRow(line));
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '' && isRow(kept[kept.length - 1])) {
      let next = i;
      while (next < lines.length && lines[next].trim() === '') next++;
      if (isRow(lines[next])) {
        i = next - 1;
        continue;
      }
    }
    kept.push(lines[i]);
  }
  return kept.join(String.fromCharCode(10));
}
