/**
 * Quick — facts about the business that the original does not state.
 *
 * The number, quote and word checks (numberCheck.ts, quoteLock.ts,
 * claimWords.ts) only see numbers, quotation marks and a short list of words
 * like "certified". On 2026-10-18 an outside test (GrokBot, five runs) found
 * every run adding facts none of them can see: "scratch-made", "handcrafted
 * lasagna", "a seasoned team", "honest, transparent pricing", "Austin hosts
 * choose Bella Cucina", "high-converting websites", "no upselling".
 *
 * So a small model call (Haiku) lists every statement of fact about the
 * business in a version, and for each one copies the words of the original
 * that state it. The code then checks that the copied words really are in
 * the original, so the model cannot invent a source. A claim without a real
 * source is "not in your original".
 *
 * Tone passes: wording a reader could not check ("we'd love to"). Words a
 * reader could rely on are facts: "authentic", "trusted", "affordable".
 *
 * Second version, same day, after GrokBot's re-run: the first one required
 * one source copied character for character, so true sentences that merge
 * two original sentences ("serving Austin since 2011") or write "cuatro" for
 * "4" were flagged; and on long pages one call listed only 15 to 25 facts for
 * a 2,000-word version (measured in the token log), so most inventions there
 * were missed. Now:
 * - a fact may have several sources, and they are matched on letters and
 *   digits only (punctuation and markdown ignored, small numbers written as
 *   words counted as digits);
 * - a long version is read in parts of about PART_WORDS words, each against
 *   the whole original, in parallel;
 * - a version checked once is not checked again (rememberClaims), so the
 *   cleanup and the result screen see the same answer;
 * - a claim found in one version is also listed in any other version that has
 *   the same words (shareClaims), so versions are treated alike.
 *
 * It never throws. On any failure it returns null and nothing changes.
 */
import { User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';

/**
 * Sonnet, not Haiku (2026-10-18): asked through the live app, Haiku matched
 * "Seasoned staff" to "our staff is very professional" (the prompt's own
 * counter-example) and left "we've earned our place" and "our customers
 * return" off its list. Sonnet, same prompt, found all three, twice, and
 * flagged no true fact on the other versions.
 */
const SOURCE_CHECK_MODEL = 'claude-sonnet-4-6';
/** Most claims taken from one part of a version. */
const MAX_CLAIMS = 40;
/** Shortest source accepted, in letters and digits: one or two letters match anywhere. */
const MIN_SOURCE_CHARS = 3;
/** About this many words of a version are checked per call. */
const PART_WORDS = 450;
/** At most this many calls per version; longer versions get larger parts. */
const MAX_PARTS = 6;
/** Versions remembered (see rememberClaims). */
const MEMORY_SIZE = 200;
/**
 * Prompt caching (2026-10-19). Every call sends the whole original, so on a
 * long page most of the cost was the same original sent again: 26 calls,
 * 80 credits, on a 2,800-word page. The original is now a cached block: after
 * the first call Claude charges it at a tenth. Below about this many words
 * the instructions and the original stay under Sonnet's 1,024-token minimum
 * and nothing is cached, so nothing is changed.
 */
const CACHE_MIN_WORDS = 700;
/**
 * A cache exists only once a call has begun its answer, so calls sent at the
 * same moment all pay full price. The first call for an original therefore
 * goes alone, and the others start when it is done. A cache lives five
 * minutes; after CACHE_FRESH_MS it is filled again the same way.
 */
const CACHE_FRESH_MS = 4 * 60 * 1000;
const warmed = new Map<string, { at: number; done: Promise<unknown> }>();

const SYSTEM_PROMPT = `You compare a rewritten piece of marketing copy with the original it was written from. The business wrote the original; the rewrite must not tell the reader anything about the business that the original does not.

You may get only part of the rewrite. Go through that part sentence by sentence and list every statement of fact about the business: what it offers or sells, how its product is made or what it is made of, how it works with customers, its team and their experience, its prices or how it prices, offers, discounts, limits and deadlines, guarantees and promises, policies, results it gets, its customers and how many there are, how often they come back, its reputation or popularity, awards, credentials, memberships and accreditations, the places it serves, dates, and stories about its past work. List every one, also the ones you think are supported.

Do not list wording that states no fact about the business: the framing of the reader's situation, how the reader will feel, invitations and calls to action ("Claim your free consultation", "Ready to plan your event?"), general persuasion ("Make sure it's worth remembering") and words that only set the mood ("exciting", "we'd love to", "worth celebrating", "it means everything"). Ignore lines like [[TESTIMONIALS-1]] or [[KEEP-1]].
Do list words a reader could rely on as a fact about the business, such as "authentic", "trusted", "affordable", "experienced", "seasoned", "carefully sourced" or "flexible". The test: if a customer could ask "is that true?", it is a fact.

For each statement give:
- "claim": the words copied exactly from the rewrite, as few as carry the fact.
- "sources": a list of passages copied exactly from the ORIGINAL, as written there (keep its digits and its spelling), that together state the same fact; one passage when one is enough, several when the rewrite merges facts from different sentences; an empty list when the original does not state it.

A fact is supported when the original states it, in any wording or language, or when it follows from the original by plain arithmetic ("since 2011" supports "over a decade"; "10 am to 1 pm" supports "three hours"). It is NOT supported when the rewrite makes it stronger, more specific, more general or different: "fresh ingredients" does not support "scratch-made" or "hand-rolled"; "competitive prices" does not support "honest" or "transparent pricing"; "many customers are happy" does not support "Austin hosts choose us" or "a reputation earned"; "very professional staff" does not support "a seasoned team"; "web design" does not support "high-converting websites"; a list of towns does not support the name of the county they are in; what happened on one job is not a policy for every job; "good for beginners" supports "designed for beginners" but not "Priya brings real warmth and patience". When unsure, give an empty list.

Answer with JSON only: {"claims":[{"claim":"...","sources":["..."]}]}`;

/** Small numbers written as words (English, Spanish), read as digits when matching. */
const NUMBER_WORDS: Record<string, string> = {
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12',
  uno: '1', una: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5', seis: '6', siete: '7', ocho: '8', nueve: '9',
  diez: '10', once: '11', doce: '12',
};

/** Letters and digits only, lowercase, single spaces; small number words as digits. */
export function normaliseForMatch(text: string): string {
  return (text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .map(word => NUMBER_WORDS[word] ?? word)
    .join(' ');
}

/** True when the words stand in the text (letters and digits only, see normaliseForMatch). */
export function standsIn(words: string, text: string): boolean {
  const part = normaliseForMatch(words);
  return part.length > 0 && ` ${normaliseForMatch(text)} `.includes(` ${part} `);
}

/** A short, stable key for a text. */
function hashText(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${(hash >>> 0).toString(36)}:${text.length}`;
}

const memory = new Map<string, string[]>();
const memoryKey = (text: string, allowed: string) => `${hashText(allowed)}|${hashText(text)}`;

/** Remembers the claims of a version, so the same text is not checked again. */
export function rememberClaims(text: string, allowed: string, claims: string[]): void {
  if (memory.size >= MEMORY_SIZE) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(memoryKey(text, allowed), claims.filter(claim => standsIn(claim, text)));
}

/** Splits a version into parts of about PART_WORDS words, at paragraph ends. */
export function splitIntoParts(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
  const words = (part: string) => part.split(/\s+/).filter(Boolean).length;
  const total = paragraphs.reduce((sum, part) => sum + words(part), 0);
  const size = Math.max(PART_WORDS, Math.ceil(total / MAX_PARTS));
  const parts: string[] = [];
  let current: string[] = [];
  let count = 0;
  for (const paragraph of paragraphs) {
    const n = words(paragraph);
    if (current.length > 0 && count + n > size) {
      parts.push(current.join('\n\n'));
      current = [];
      count = 0;
    }
    current.push(paragraph);
    count += n;
  }
  if (current.length > 0) parts.push(current.join('\n\n'));
  return parts.length > 0 ? parts : [text];
}

/** True when the original is long enough for Claude to cache it. */
function worthCaching(allowed: string): boolean {
  return allowed.split(/\s+/).filter(Boolean).length >= CACHE_MIN_WORDS;
}

/**
 * Runs the calls of one check. With a long original, the first call for it
 * goes alone so the others can read it from the cache (see CACHE_FRESH_MS).
 */
async function withWarmCache<T>(allowed: string, calls: (() => Promise<T>)[]): Promise<T[]> {
  if (calls.length === 0) return [];
  if (!worthCaching(allowed)) return Promise.all(calls.map(call => call()));
  const key = hashText(allowed);
  const known = warmed.get(key);
  if (known && Date.now() - known.at < CACHE_FRESH_MS) {
    await known.done;
    return Promise.all(calls.map(call => call()));
  }
  const first = calls[0]();
  warmed.set(key, { at: Date.now(), done: first.catch(() => undefined) });
  const firstResult = await first;
  const rest = await Promise.all(calls.slice(1).map(call => call()));
  return [firstResult, ...rest];
}

/** One call: the unsupported claims of one part. Null on failure. */
async function checkPart(
  part: string,
  allowed: string,
  label: string,
  user: User,
  sessionId?: string
): Promise<string[] | null> {
  try {
    const response = await makeApiRequestWithFallback(
      SOURCE_CHECK_MODEL,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          // The same text as before, in two blocks: the original (cached) and the part.
          content: [
            { type: 'text', text: `ORIGINAL:\n"""\n${allowed}\n"""\n\n`, cache: worthCaching(allowed) },
            { type: 'text', text: `${label}:\n"""\n${part}\n"""` },
          ],
        },
      ],
      0,
      3000,
      { type: 'json_object' },
      user.email,
      'quick_source_check',
      sessionId
    );
    const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? '')) as { claims?: unknown };
    if (!Array.isArray(parsed?.claims)) return null;
    const unsupported: string[] = [];
    for (const entry of parsed.claims.slice(0, MAX_CLAIMS)) {
      const claim = typeof entry?.claim === 'string' ? entry.claim.trim() : '';
      // A claim that is not in the version is the model's own wording: nothing to take out or show.
      if (!claim || !standsIn(claim, part)) continue;
      const listed: unknown[] = Array.isArray(entry?.sources)
        ? entry.sources
        : typeof entry?.source === 'string'
          ? [entry.source]
          : [];
      const sources = listed
        .filter((source): source is string => typeof source === 'string')
        .map(source => source.trim())
        .filter(source => normaliseForMatch(source).length > 0);
      // Supported only when there is a source and every source really is in the original.
      const supported =
        sources.length > 0 &&
        sources.some(source => normaliseForMatch(source).replace(/ /g, '').length >= MIN_SOURCE_CHARS) &&
        sources.every(source => standsIn(source, allowed));
      if (!supported) unsupported.push(claim);
    }
    return unsupported;
  } catch {
    return null;
  }
}

/**
 * The claims in `text` about the business that `allowed` (the original and
 * the user's facts) does not state, as written in `text`. Null when no part
 * could be checked.
 */
export async function findUnsupportedClaims(
  text: string,
  allowed: string,
  user: User,
  sessionId?: string
): Promise<string[] | null> {
  if (!text.trim() || !allowed.trim()) return null;
  const known = memory.get(memoryKey(text, allowed));
  if (known) return [...known];
  const parts = splitIntoParts(text);
  const results = await withWarmCache(
    allowed,
    parts.map((part, index) => () =>
      checkPart(
        part,
        allowed,
        parts.length > 1 ? `REWRITE (part ${index + 1} of ${parts.length})` : 'REWRITE',
        user,
        sessionId
      )
    )
  );
  if (results.every(result => result === null)) return null;
  const unsupported: string[] = [];
  const seen = new Set<string>();
  for (const claim of results.flatMap(result => result ?? [])) {
    const key = normaliseForMatch(claim);
    if (seen.has(key)) continue;
    seen.add(key);
    unsupported.push(claim);
  }
  // Only a complete check is remembered: a failed part may hide claims.
  if (results.every(result => result !== null)) rememberClaims(text, allowed, unsupported);
  return unsupported;
}

/**
 * Lists a claim found in one version also in every other version whose text
 * has the same words, so versions are treated alike.
 */
export function shareClaims<T extends { text: string; claims: string[] | null }>(entries: T[]): T[] {
  const all = entries.flatMap(entry => entry.claims ?? []);
  return entries.map(entry => {
    if (!entry.claims) return entry;
    const own = new Set(entry.claims.map(normaliseForMatch));
    const added = all.filter(claim => {
      const key = normaliseForMatch(claim);
      if (own.has(key) || !standsIn(claim, entry.text)) return false;
      own.add(key);
      return true;
    });
    return added.length > 0 ? { ...entry, claims: [...entry.claims, ...added] } : entry;
  });
}
