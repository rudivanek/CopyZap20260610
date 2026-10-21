/**
 * Quick — key facts of the original that a version leaves out.
 *
 * The scorer reads each version on its own, so it cannot see what a version
 * dropped. On 2026-10-18 an outside test (GrokBot) found winners that had
 * lost the original's best selling points: Logoforo's winner dropped the 50%
 * discount, the course dates and the event; Long Time Plumbing's winner
 * dropped "Licensed Master Plumber"; no Bella Cucina version kept "fresh
 * ingredients". The least faithful version could win.
 *
 * So, for each run:
 * 1. one small call (Haiku) lists the original's key facts: what a customer
 *    would act on or trust (offers, prices, dates, credentials, proof,
 *    contact details, what makes the product different). The facts the user
 *    added in "Make it stronger" are key facts too. Listed once per original.
 * 2. one small call per version says which of them the version still states,
 *    by meaning, in any wording.
 * 3. each fact left out lowers the version's score by LEFT_OUT_POINTS, up to
 *    LEFT_OUT_MAX_POINTS, and is listed under the version as "Left out from
 *    your original". So a version that keeps the facts beats one that drops
 *    them, but one small drop does not sink an otherwise strong version.
 *
 * Parts the user chose to leave out are not in the original it reads, so
 * their facts are not counted. It never throws: on any failure nothing is
 * listed and no score changes.
 */
import { User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';

const KEY_FACTS_MODEL = 'claude-haiku-4-5';
/** Most key facts listed from one original. */
const MAX_KEY_FACTS = 15;
/** Points taken off a version's score for each key fact it leaves out. */
export const LEFT_OUT_POINTS = 3;
/** Most points taken off for left-out facts. */
export const LEFT_OUT_MAX_POINTS = 12;
/** How a left-out fact is written as a report note (read by utils/enhancedExports.ts). */
export const LEFT_OUT_NOTE_PREFIX = 'left out — key fact from your original:';
/** Originals remembered, so the facts are listed once per original. */
const MEMORY_SIZE = 50;

const LIST_PROMPT = `You read a piece of marketing copy and list its key facts: the facts a customer would act on or trust. These are:
- offers, discounts and anything free, with their conditions;
- prices;
- dates, times, schedules and deadlines of offers, events or courses;
- a programme, syllabus or temario, agenda, list of sessions or topics, or what is included: as ONE fact that names every item, shortly (such as "temario de 6 sesiones: qué es sentido; Viktor Frankl; autoconocimiento; lo creativo y la actitud; jerarquía de valores; mi huella");
- credentials, licences, accreditations, memberships and awards;
- guarantees;
- proof: ratings, years in business, numbers of customers or projects, named testimonials;
- contact details: phone, email, address;
- what the business sells, and what the copy says makes it different (such as "fresh ingredients" or "taught by Priya").

Do not list navigation, menus, links to social media, cookie or legal text, copyright lines, or the titles of blog articles. Do not list general claims with no fact in them ("we care about our customers"). Merge facts that belong together ("$35 for members, $45 for non-members"). List at most ${MAX_KEY_FACTS}, the most important first. Write each fact in a few words, in the language of the copy, keeping its numbers exactly as written.

Answer with JSON only: {"facts":["...","..."]}`;

const CHECK_PROMPT = `You check whether a rewritten piece of marketing copy still states facts from the original. For each fact, answer true when the rewrite states it, in any wording or language, with the same numbers, names and conditions; answer false when the rewrite leaves it out, states only part of it (a price without its condition, a credential reduced to a vague word), or changes it. A programme, syllabus, agenda or list counts as kept only when the rewrite still names every item, in a list or in a sentence; a sentence that says the list is somewhere else ("the full programme is above") does not keep it. Answer with JSON only: {"kept":[true,false,...]} with one entry per fact, in order.`;

const memory = new Map<string, string[]>();

/** A short, stable key for a text. */
function hashText(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${(hash >>> 0).toString(36)}:${text.length}`;
}

/** The original's key facts, with the user's own facts first. Null on failure. */
export async function listKeyFacts(
  original: string,
  userFacts: string[],
  user: User,
  sessionId?: string
): Promise<string[] | null> {
  if (!original.trim()) return null;
  const key = hashText(original);
  let listed = memory.get(key);
  if (!listed) {
    try {
      const response = await makeApiRequestWithFallback(
        KEY_FACTS_MODEL,
        [
          { role: 'system', content: LIST_PROMPT },
          { role: 'user', content: `COPY:\n"""\n${original}\n"""` },
        ],
        0,
        1200,
        { type: 'json_object' },
        user.email,
        'quick_key_facts',
        sessionId
      );
      const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? '')) as { facts?: unknown };
      if (!Array.isArray(parsed?.facts)) return null;
      const facts: string[] = parsed.facts
        .filter((fact): fact is string => typeof fact === 'string')
        .map(fact => fact.trim())
        .filter(Boolean)
        .slice(0, MAX_KEY_FACTS);
      listed = facts;
      if (memory.size >= MEMORY_SIZE) {
        const oldest = memory.keys().next().value;
        if (oldest !== undefined) memory.delete(oldest);
      }
      memory.set(key, facts);
    } catch {
      return null;
    }
  }
  const own = userFacts.map(fact => fact.trim()).filter(Boolean);
  return [...own, ...listed.filter(fact => !own.includes(fact))];
}

/** The facts a version leaves out. Null on failure. */
export async function findLeftOutFacts(
  facts: string[],
  text: string,
  user: User,
  sessionId?: string
): Promise<string[] | null> {
  if (facts.length === 0) return [];
  if (!text.trim()) return null;
  // A fact whose words all stand in the version is kept, whatever the model
  // says. Seen 2026-10-19: a list of 13 towns, numbered on the page and
  // bulleted in the version, was called "left out" in all three versions.
  const words = new Set(wordsOf(text));
  const open = facts.filter(fact => !wordsKept(fact, words));
  if (open.length === 0) return [];
  try {
    const response = await makeApiRequestWithFallback(
      KEY_FACTS_MODEL,
      [
        { role: 'system', content: CHECK_PROMPT },
        {
          role: 'user',
          content: `FACTS:\n${open.map((fact, index) => `${index + 1}. ${fact}`).join('\n')}\n\nREWRITE:\n"""\n${text}\n"""`,
        },
      ],
      0,
      Math.min(800, 60 + open.length * 8),
      { type: 'json_object' },
      user.email,
      'quick_key_facts_check',
      sessionId
    );
    const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? '')) as { kept?: unknown };
    const kept = parsed?.kept;
    // A reply that does not answer every fact is not trusted.
    if (!Array.isArray(kept) || kept.length !== open.length) return null;
    return open.filter((_, index) => kept[index] === false);
  } catch {
    return null;
  }
}

/** The words of a text: letters and digits, lowercase. */
function wordsOf(text: string): string[] {
  return (text || '').normalize('NFKC').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}
/** Small words that carry no fact ("the", "de", "AL"): ignored when comparing. */
const SMALL_WORD_LETTERS = 2;
/**
 * True when every word of the fact (after a label such as "Service areas:"),
 * beyond the smallest ones, stands in the version.
 */
function wordsKept(fact: string, words: Set<string>): boolean {
  const cut = fact.indexOf(': ');
  const body = cut >= 0 && cut < 40 ? fact.slice(cut + 2) : fact;
  const needed = wordsOf(body).filter(word => word.length > SMALL_WORD_LETTERS || /\d/.test(word));
  return needed.length > 0 && needed.every(word => words.has(word));
}
/** Points taken off for this many left-out facts. */
export function leftOutPenalty(count: number): number {
  return Math.min(LEFT_OUT_MAX_POINTS, Math.max(0, count) * LEFT_OUT_POINTS);
}
