/**
 * Quick — "Make it stronger": answers the user's own page already holds.
 *
 * The questions in "Make it stronger" (missingFacts.ts, factChat.ts) ask for
 * facts the copy does not state plainly. Often the page does hold one, just
 * not where it helps: a figure inside a testimonial, a free offer in a button
 * label. On 2026-10-14 the chat asked Sales Boost for its results; the only
 * figure was in a testimonial ("hemos crecido nuestras ventas 48% año contra
 * año"). Typed in as the answer, it raised the best version from 76 to 82.
 *
 * So for each question one small call (Haiku) reads the whole page,
 * testimonials included, and copies the passage that answers it, if there is
 * one. The passage is shown under the question with a "Use this" button that
 * puts it in the answer field; nothing is used until the user sends it.
 *
 * Nothing invented can get through: a passage is shown only when it is found
 * word for word in the page (verifiedPassage), or, when the model joined two
 * parts of the page around a figure, the page's own sentence with that figure
 * (sentenceWithFigure). The step never throws: on any failure no passage is
 * shown.
 */
import { User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import { exampleLanguage } from './missingFacts';

const PAGE_ANSWER_MODEL = 'claude-haiku-4-5';
/** Longest passage shown, in characters, and the fewest words it needs. */
const PASSAGE_MAX_CHARS = 320;
const PASSAGE_MIN_WORDS = 4;
/** How much of the page is read. A Quick run takes up to 5,000 words; this covers it. */
const PAGE_MAX_CHARS = 40000;

/** What the user's answer starts with when it is a passage of their page. The chat reads it as on purpose. */
export const FROM_PAGE_PREFIX = 'From my page:';

/** For comparing: no markdown marks, one kind of quotation mark, single spaces, lower case. */
function normalise(text: string): string {
  return (text || '')
    .replace(/[*_`#>]/g, ' ')
    .replace(/[“”„«»″]/g, '"')
    .replace(/[‘’‚′]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * The passage, cleaned, when it is in the page word for word and long enough to
 * say something. Empty otherwise.
 */
export function verifiedPassage(passage: unknown, page: string): string {
  if (typeof passage !== 'string') return '';
  const clean = passage
    .replace(/^[\s"“”«»'‘’…]+|[\s"“”«»'‘’…]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || clean.length > PASSAGE_MAX_CHARS) return '';
  if (clean.split(' ').length < PASSAGE_MIN_WORDS) return '';
  return normalise(page).includes(normalise(clean)) ? clean : '';
}

/**
 * When the model's passage is not on the page as written but holds a figure
 * (seen 2026-10-14: "Aumento de Ventas 48% año contra año", a heading glued to
 * a testimonial), the page's own sentence with that figure is shown instead,
 * cut to at most 40 words around it. Empty when no figure or no such sentence.
 */
export function sentenceWithFigure(passage: unknown, page: string): string {
  if (typeof passage !== 'string') return '';
  const figures = passage.match(/\d[\d.,]*\s?%?/g) ?? [];
  const sentences = (page || '')
    .replace(/[*_`#>]/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(sentence => sentence.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  for (const raw of figures) {
    const figure = raw.trim();
    if (!/\d/.test(figure)) continue;
    const found = sentences.filter(sentence => sentence.includes(figure));
    if (found.length !== 1) continue; // none, or the figure is in several places: do not guess which
    const words = found[0].split(' ');
    const at = Math.max(0, words.findIndex(word => word.includes(figure.replace(/\s?%$/, ''))));
    const start = Math.max(0, Math.min(at - 20, words.length - 40));
    const cut = words.slice(start, start + 40).join(' ');
    const shown = verifiedPassage(cut, page);
    if (shown) return shown;
  }
  return '';
}

function systemPrompt(language?: string | null): string {
  return `A business owner is asked a question about their marketing copy, because the copy does not state the answer where it would help. You get the whole page, customer testimonials included, and the question.

First name the topic of the question to yourself: results, price, timing, the offer, proof, what is included, what makes the business different, or similar. Then look through the WHOLE page, wherever the passage is (a testimonial, a list, a button label, another section), for a concrete fact on that topic: a number, a result, a client, an offer, a time, a deliverable. If there is one, copy that passage EXACTLY as it is written on the page, word for word, in ${exampleLanguage(language)} as on the page.
- A result one client reports counts for a question about results, even when the question asks for general or average figures: the owner decides whether to use it.
- At most 40 words. Cut it to the sentence or part of a sentence that holds the fact; never join parts from different places.
- Never change, translate, shorten inside, or add a word. Never write a passage that is not on the page.
- A passage that only names the topic without a concrete fact does not count.
- If there is no such passage, return an empty string.

Answer with JSON only: {"passage":"..."}`;
}

/**
 * The passage of the page that answers the question, checked word for word
 * against the page, or '' when there is none. Never throws.
 */
export async function findPageAnswer(
  page: string,
  question: string,
  user: User,
  sessionId?: string,
  /** The copy's language as Quick read it ("Spanish"). */
  language?: string | null
): Promise<string> {
  const text = (page || '').trim().slice(0, PAGE_MAX_CHARS);
  if (!text || !question.trim()) return '';
  try {
    const response = await makeApiRequestWithFallback(
      PAGE_ANSWER_MODEL,
      [
        { role: 'system', content: systemPrompt(language) },
        { role: 'user', content: `Page:\n"""\n${text}\n"""\n\nQuestion: ${question}` },
      ],
      0,
      400,
      { type: 'json_object' },
      user.email,
      'quick_fact_chat',
      sessionId
    );
    const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? '')) as { passage?: unknown };
    return verifiedPassage(parsed?.passage, text) || sentenceWithFigure(parsed?.passage, text);
  } catch {
    return '';
  }
}
