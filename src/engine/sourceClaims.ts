/**
 * Quick — facts about the business that the original does not state.
 *
 * The number, quote and word checks (numberCheck.ts, quoteLock.ts,
 * claimWords.ts) only see numbers, quotation marks and a short list of words
 * like "certified". On 2026-10-18 an outside test (GrokBot, five runs) found
 * every run adding facts none of them can see: "scratch-made", "handcrafted
 * lasagna", "a seasoned team", "honest, transparent pricing", "Austin hosts
 * choose Bella Cucina", "high-converting websites", "no upselling". The old
 * "claims to verify" came from the scorer, which lists every number it sees,
 * so it showed true facts ("5 stars", "10 years") and missed these.
 *
 * So one small call (Haiku) per version lists every statement of fact about
 * the business, and for each one copies the words of the original that state
 * it, or "" when none do. The code then checks that the copied words really
 * are in the original (plain text match), so the model cannot invent a
 * source. A claim without a real source is "not in your original".
 *
 * Tone passes: wording a reader could not check ("we'd love to", "it means
 * everything"). Words a reader could rely on are facts: "authentic",
 * "trusted", "affordable", "experienced". The test: could a customer ask
 * "is that true?"
 *
 * Measured on 2026-10-18 on GrokBot's Bella Cucina, agency and newsletter
 * runs: every invention the test named was found, the true facts (2011,
 * 20 to 300 guests, prices, dates, phone numbers) matched their source.
 *
 * It never throws. On any failure it returns null and nothing changes.
 */
import { User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';

const SOURCE_CHECK_MODEL = 'claude-haiku-4-5';
/** Most claims taken from one version. */
const MAX_CLAIMS = 40;
/** Shortest source text accepted: one or two letters match anywhere. */
const MIN_SOURCE_CHARS = 3;

const SYSTEM_PROMPT = `You compare a rewritten piece of marketing copy with the original it was written from. The business wrote the original; the rewrite must not tell the reader anything about the business that the original does not.

Go through the rewrite sentence by sentence and list every statement of fact about the business: what it offers or sells, how its product is made or what it is made of, how it works with customers, its team and their experience, its prices or how it prices, offers, discounts, limits and deadlines, guarantees and promises, results it gets, its customers and how many there are, its reputation or popularity, awards, credentials, memberships and accreditations, places and dates.

Do not list wording that states no fact about the business: the framing of the reader's situation, how the reader will feel, invitations and calls to action ("Claim your free consultation", "Ready to plan your event?"), general persuasion ("Make sure it's worth remembering") and words that only set the mood ("exciting", "we'd love to", "worth celebrating", "it means everything"). Ignore lines like [[TESTIMONIALS-1]] or [[KEEP-1]].
Do list words a reader could rely on as a fact about the business, such as "authentic", "trusted", "affordable", "experienced", "carefully sourced" or "flexible". The test: if a customer could ask "is that true?", it is a fact.

For each statement give:
- "claim": the words copied exactly from the rewrite, as few as carry the fact.
- "source": words copied exactly from the original that state the same fact, or "" when the original does not state it.

A fact is supported when the original states it, in any wording or language, or when it follows from the original by plain arithmetic ("since 2011" supports "over a decade"). It is NOT supported when the rewrite makes it stronger, more specific or different: "fresh ingredients" does not support "scratch-made" or "hand-rolled"; "competitive prices" does not support "honest" or "transparent pricing"; "many customers are happy" does not support "Austin hosts choose us" or "a reputation earned"; "very professional staff" does not support "a seasoned team"; "web design" does not support "high-converting websites"; "good for beginners" supports "designed for beginners" but not "Priya brings real warmth and patience". When unsure, give "" as the source.

Answer with JSON only: {"claims":[{"claim":"...","source":"..."}]}`;

/** Lowercase, plain quotes and dashes, no markdown, single spaces, no punctuation at the ends. */
export function normaliseForMatch(text: string): string {
  return (text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[*_#>`]/g, '')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[\s"'.,;:!?()-]+|[\s"'.,;:!?()-]+$/g, '');
}

/** True when the words stand in the text (after normalising both). */
export function standsIn(words: string, text: string): boolean {
  const part = normaliseForMatch(words);
  return part.length > 0 && normaliseForMatch(text).includes(part);
}

/**
 * The claims in `text` about the business that `allowed` (the original and
 * the user's facts) does not state, as written in `text`. Null on any failure.
 */
export async function findUnsupportedClaims(
  text: string,
  allowed: string,
  user: User,
  sessionId?: string
): Promise<string[] | null> {
  if (!text.trim() || !allowed.trim()) return null;
  try {
    const response = await makeApiRequestWithFallback(
      SOURCE_CHECK_MODEL,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `ORIGINAL:\n"""\n${allowed}\n"""\n\nREWRITE:\n"""\n${text}\n"""` },
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
    const seen = new Set<string>();
    for (const entry of parsed.claims.slice(0, MAX_CLAIMS)) {
      const claim = typeof entry?.claim === 'string' ? entry.claim.trim() : '';
      const source = typeof entry?.source === 'string' ? entry.source.trim() : '';
      // A claim that is not in the version is the model's own wording: nothing to take out or show.
      if (!claim || !standsIn(claim, text)) continue;
      // A source counts only when its words really are in the original.
      const hasSource = normaliseForMatch(source).length >= MIN_SOURCE_CHARS && standsIn(source, allowed);
      if (hasSource) continue;
      const key = normaliseForMatch(claim);
      if (seen.has(key)) continue;
      seen.add(key);
      unsupported.push(claim);
    }
    return unsupported;
  } catch {
    return null;
  }
}
