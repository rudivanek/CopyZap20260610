/**
 * Quick — facts the copy is missing, asked from the user before writing.
 *
 * Quick's writer may only use facts the original states (keepToOriginal.ts).
 * Much of what makes copy act — a reason to act now, a low-risk first step,
 * proof, a price — is often not in the original, and only the business can
 * supply it. So on the check screen Quick asks up to three short questions
 * about what is missing, each with one answer field and an example answer.
 * What the user writes counts as their own facts: the writer is told to use them.
 * Nothing answered: the run is the same as without this step.
 *
 * Measured on 2026-10-12, five texts, goal Convert (see the project note
 * missing-facts-questions-test-2026-10-12): the questions found the right gaps
 * on every text; with realistic answers the best version scored 3.8 points
 * higher on average (branding page 70 -> 77), and invented additions fell by
 * half (22 -> 11 over 15 versions).
 *
 * Asked for the goals Convert and Other only: urgency or a price is the wrong
 * question for copy that informs or builds a brand, and only Convert was measured.
 * Which gaps and how many depend on the kind of text (KIND_GUIDANCE below).
 * Besides the questions the user can add "anything else" in their own words.
 *
 * One small model call. It never throws: on any failure there are no questions.
 */
import { GoalKey, User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import type { TextKindKey } from '../services/api/textKinds';
import { lockTestimonials } from './quoteLock';

const MISSING_FACTS_MODEL = 'claude-sonnet-4-6';
/** The start of a long page and its end, where the call to action usually is. */
const HEAD_CHARS = 9000;
const TAIL_CHARS = 3000;

export const MISSING_FACTS_MAX_QUESTIONS = 3;
/** Longest answer the user can give to one question. */
export const USER_FACT_MAX_CHARS = 400;
/** Most facts a run takes: enough for a chat (see factChat.ts); the fields give at most four. */
export const USER_FACTS_MAX = 6;

/** In an example answer: where the user's own number, date or name goes. */
export const FACT_BLANK = '___';

/** The goals the questions are asked for. */
const ASKED_FOR: GoalKey[] = ['convert', 'custom'];

export function asksForMissingFacts(goalKey: GoalKey | null | undefined): boolean {
  return !!goalKey && ASKED_FOR.includes(goalKey);
}

export interface MissingFactQuestion {
  /** difference, included, timing, offer, urgency, proof, price, guarantee, next_step or other. */
  kind: string;
  /** One short sentence in English. */
  question: string;
  /**
   * One example answer in the copy's language, shown inside the empty answer
   * field. Holds FACT_BLANK where the user's own value goes; never a number or
   * a currency of its own. Empty when the model gave no safe example.
   */
  example: string;
}

export function goalLine(goalKey: GoalKey, goalLabel?: string): string {
  if (goalKey === 'custom' && goalLabel) return `Its goal, in the user's own words: ${goalLabel}.`;
  return 'Its goal: Convert — get the reader to take an action or buy.';
}

/**
 * Which questions suit which kind of text, and how many. A web page can carry
 * every kind of fact; an email needs the offer, a real date and the next step;
 * an ad or a post has room for one or two; a slogan for one at most.
 */
const KIND_GUIDANCE: Record<TextKindKey, { max: number; line: string }> = {
  web_page: { max: 3, line: 'It is a web page: any of the gaps below can matter.' },
  email: {
    max: 3,
    line: 'It is an email or newsletter: ask mainly about the offer, a real reason to act now and what happens after the reader replies or clicks. Do not ask what is included in a service or for credentials.',
  },
  ad: { max: 2, line: 'It is an ad: there is room for one or two facts at most, usually the offer, the price or what makes it different.' },
  social_post: {
    max: 2,
    line: 'It is a social media post: there is room for one or two facts at most, usually the offer, the price or what makes it different.',
  },
  short_text: {
    max: 1,
    line: 'It is a short text (a slogan, headline or USP): ask at most one question, and only about what makes the business different. Never ask for a price, a date or a guarantee.',
  },
  other: { max: 3, line: 'Choose the gaps that suit this kind of text.' },
};

export function kindGuidance(kind: TextKindKey | null | undefined) {
  return KIND_GUIDANCE[kind ?? 'other'] ?? KIND_GUIDANCE.other;
}

/**
 * The language the examples are written in. Named outright: told only "the
 * language of the copy", the model wrote French examples for an English page
 * (Tidewell Bookkeeping, three runs out of three on 2026-10-13).
 */
export function exampleLanguage(language?: string | null): string {
  return language?.trim() ? language.trim() : 'the language of the copy';
}

function systemPrompt(goalKey: GoalKey, goalLabel?: string, kind?: TextKindKey | null, language?: string | null): string {
  const guidance = kindGuidance(kind);
  const examples = exampleLanguage(language);
  return `You read a piece of marketing copy before it is rewritten. ${goalLine(goalKey, goalLabel)} ${guidance.line}

The rewrite may only use facts the copy states. So find what is MISSING that would most help the copy reach its goal, and that only the business itself can supply. Typical gaps:
- what makes the business different: something concrete it does that others do not (a method, something included at no extra cost, a specialty), not a quality every competitor claims
- what the client gets: what is included and what they have at the end
- how long it takes: delivery time or response time
- an offer or first step that lowers the risk (free consultation, trial, quote)
- a reason to act now (a real date, limited capacity, a season)
- proof: a result, a number of clients, a named client, a rating, a certification, a partnership, an award
- a price or price range
- a guarantee
- what happens after the reader acts

Rules:
- Up to ${guidance.max} ${guidance.max === 1 ? 'gap' : 'gaps'}, most important first. Fewer is fine. If nothing important is missing, return an empty list.
- Never ask for something the copy already states, even in other words. A line in brackets such as "(customer testimonials, not shown)" stands for a part of the page that is there: do not ask for it.
- Each question is one short sentence written in ENGLISH, whatever the language of the copy (the user reads the questions in an English interface). It is specific to this copy: name or quote the part it is about; a quote may stay in the copy's language.
- For each question give one example answer, written in ${examples}, short enough to drop into the copy. It is shown greyed out in an empty field as a hint of what to write, so:
  - Never write a number, price, date, duration, percentage, rating, count or client name. Where the answer needs one, leave a blank as ${FACT_BLANK} (for example "More than ${FACT_BLANK} clients", "From ${FACT_BLANK} per month", "Free first call of ${FACT_BLANK} minutes").
  - Never write a currency symbol or code: the user writes the price with their own currency.
  - One plain fact. No sales phrases such as "filling fast" or "don't miss out", and never a customer quote or testimonial.
  - For what makes the business different, the example names something concrete (for example "Every site is delivered with ${FACT_BLANK} included"), never a superlative such as "the best" or "the only".

Answer with JSON only: {"gaps":[{"kind":"difference|included|timing|offer|urgency|proof|price|guarantee|next_step|other","question":"(in English)","example":"(in ${examples})"}]}`;
}

/** Where testimonials were taken out: they are on the page, so they are not asked for. */
const TESTIMONIAL_MARKER_LINE = /^.*\[\[\s*TESTIMONIALS[-\s_]?\d+\s*\]\].*$/gim;

/** The copy the questions are about: testimonials out, and for a long page its start and its end. */
export function excerpt(copy: string): string {
  const text = lockTestimonials((copy || '').trim()).lockedCopy.replace(
    TESTIMONIAL_MARKER_LINE,
    '(customer testimonials, not shown)'
  );
  if (text.length <= HEAD_CHARS + TAIL_CHARS) return text;
  return `${text.slice(0, HEAD_CHARS)}\n\n[…]\n\n${text.slice(-TAIL_CHARS)}`;
}

const oneLine = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Any run of two or more underscores is a blank. */
const BLANKS = /_{2,}/g;

/** Currency symbols and codes: the user writes their own currency, so an example never shows one. */
const CURRENCY = /[$€£¥₹]|\b(?:MXN|USD|EUR|GBP|CAD|AUD|CHF|COP|ARS|CLP|PEN|BRL|pesos?|d[oó]lar(?:es)?|dollars?|euros?)\b/gi;

/**
 * The example as shown, or empty when it is not safe to show. It may hold no
 * number of its own: a figure the model wrote ("Rated 4.9 stars") looks true.
 * Numbers belong in the blanks. A currency is taken out: CopyZap does not
 * guess it.
 */
export function safeExample(value: unknown): string {
  const example = oneLine(value, USER_FACT_MAX_CHARS)
    .replace(BLANKS, FACT_BLANK)
    .replace(CURRENCY, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!example || /\d/.test(example.replace(BLANKS, ''))) return '';
  return example;
}

/** Turns the model's reply into questions. Anything missing or invalid is dropped. */
export function parseMissingFacts(raw: string): MissingFactQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonResponse(raw));
  } catch {
    return [];
  }
  const gaps = (parsed as { gaps?: unknown })?.gaps;
  if (!Array.isArray(gaps)) return [];

  const questions: MissingFactQuestion[] = [];
  for (const gap of gaps) {
    if (!gap || typeof gap !== 'object') continue;
    const item = gap as Record<string, unknown>;
    const question = oneLine(item.question, 220);
    if (!question) continue;
    // An older reply shape gave a list of suggestions: its first safe one is the example.
    const candidates = [item.example, ...(Array.isArray(item.suggestions) ? item.suggestions : [])];
    const example = candidates.map(safeExample).find(Boolean) ?? '';
    questions.push({ kind: oneLine(item.kind, 20).toLowerCase() || 'other', question, example });
    if (questions.length === MISSING_FACTS_MAX_QUESTIONS) break;
  }
  return questions;
}

/** The questions for this copy and goal. Empty for other goals, and on any failure. */
export async function findMissingFacts(
  copy: string,
  goalKey: GoalKey,
  goalLabel: string | undefined,
  kind: TextKindKey | null | undefined,
  user: User,
  sessionId?: string,
  /** The copy's language as Quick read it ("Spanish"): the examples are written in it. */
  language?: string | null
): Promise<MissingFactQuestion[]> {
  if (!asksForMissingFacts(goalKey)) return [];
  const text = excerpt(copy);
  if (!text.trim()) return [];
  try {
    const response = await makeApiRequestWithFallback(
      MISSING_FACTS_MODEL,
      [
        { role: 'system', content: systemPrompt(goalKey, goalLabel, kind, language) },
        { role: 'user', content: `Copy:\n"""\n${text}\n"""` },
      ],
      0.2,
      900,
      { type: 'json_object' },
      user.email,
      'quick_missing_facts',
      sessionId
    );
    return parseMissingFacts(response.choices[0]?.message?.content ?? '').slice(0, kindGuidance(kind).max);
  } catch {
    return [];
  }
}

/**
 * The facts as they go to the writer: one line each, trimmed, no blank left
 * unfilled (an example copied with its ___), no duplicates, at most USER_FACTS_MAX.
 */
export function cleanUserFacts(facts: (string | null | undefined)[] | null | undefined): string[] {
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const fact of facts ?? []) {
    const line = oneLine(fact, USER_FACT_MAX_CHARS);
    if (!line || /_{2,}/.test(line)) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push(line);
    if (clean.length === USER_FACTS_MAX) break;
  }
  return clean;
}

const factList = (facts: string[]) => facts.map(fact => `- ${fact}`).join('\n');

/**
 * Told to the writer, after the keep-to-original note. Measured wording: with
 * "you may use them" the writer often left out the reason to act now.
 */
export function userFactsWritingNote(facts: string[]): string {
  const clean = cleanUserFacts(facts);
  if (clean.length === 0) return '';
  return [
    'The user added these facts about the business. They are true. Use every one of them, in the copy\'s own language and voice, exactly as given: do not change their numbers or make them stronger. Put the reason to act now and the offer next to the call to action, and the proof where the copy makes its claims. Do not turn a limit on capacity into a claim that places are running out.',
    'Use each fact only for what it says. Where a fact does not say what a number or a result refers to, keep it as general as the user wrote it: do not decide that it is about sales, clients, traffic or anything else. Keep separate facts in separate statements: a free offer and a price, for example, never in one sentence.',
    factList(clean),
  ].join('\n');
}

/** Told to the rewrite step of a change: the user's facts count as part of the text. */
export function userFactsChangeNote(facts: string[]): string {
  const clean = cleanUserFacts(facts);
  if (clean.length === 0) return '';
  return ['The user also gave these facts about the business. They count as facts the text states, exactly as given:', factList(clean)].join('\n');
}
