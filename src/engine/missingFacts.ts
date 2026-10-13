/**
 * Quick — facts the copy is missing, asked from the user before writing.
 *
 * Quick's writer may only use facts the original states (keepToOriginal.ts).
 * Much of what makes copy act — a reason to act now, a low-risk first step,
 * proof, a price — is often not in the original, and only the business can
 * supply it. So on the check screen Quick asks up to three short questions
 * about what is missing, with suggested answers to tick or fill in. What the
 * user answers counts as their own facts: the writer is told to use them.
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
 *
 * One small model call. It never throws: on any failure there are no questions.
 */
import { GoalKey, User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import { lockTestimonials } from './quoteLock';

const MISSING_FACTS_MODEL = 'claude-sonnet-4-6';
/** The start of a long page and its end, where the call to action usually is. */
const HEAD_CHARS = 9000;
const TAIL_CHARS = 3000;

export const MISSING_FACTS_MAX_QUESTIONS = 3;
export const MISSING_FACTS_MAX_SUGGESTIONS = 3;
/** Longest fact the user can add, one at a time. */
export const USER_FACT_MAX_CHARS = 200;
/** Most facts a run takes: one answer per question, plus an own-words line each. */
export const USER_FACTS_MAX = 6;

/** Where the user fills in a suggestion: a number, a date, a name. */
export const FACT_BLANK = '___';

/** The goals the questions are asked for. */
const ASKED_FOR: GoalKey[] = ['convert', 'custom'];

export function asksForMissingFacts(goalKey: GoalKey | null | undefined): boolean {
  return !!goalKey && ASKED_FOR.includes(goalKey);
}

export interface MissingFactQuestion {
  /** offer, urgency, proof, price, guarantee, next_step or other. */
  kind: string;
  /** One short sentence in English. */
  question: string;
  /** In the copy's language. May hold FACT_BLANK where the user fills in a value. */
  suggestions: string[];
}

function goalLine(goalKey: GoalKey, goalLabel?: string): string {
  if (goalKey === 'custom' && goalLabel) return `Its goal, in the user's own words: ${goalLabel}.`;
  return 'Its goal: Convert — get the reader to take an action or buy.';
}

function systemPrompt(goalKey: GoalKey, goalLabel?: string): string {
  return `You read a piece of marketing copy before it is rewritten. ${goalLine(goalKey, goalLabel)}

The rewrite may only use facts the copy states. So find what is MISSING that would most help the copy reach its goal, and that only the business itself can supply. Typical gaps: an offer or first step that lowers the risk (free consultation, trial, quote), a reason to act now (date, limited capacity, season), proof (a result, a number of clients, a named client, a rating), a price or price range, a guarantee, what happens after the reader acts.

Rules:
- Up to ${MISSING_FACTS_MAX_QUESTIONS} gaps, most important first. Fewer is fine. If nothing important is missing, return an empty list.
- Never ask for something the copy already states, even in other words. A line in brackets such as "(customer testimonials, not shown)" stands for a part of the page that is there: do not ask for it.
- Each question is one short sentence in English, also when the copy is in another language, specific to this copy: name or quote the part it is about.
- For each question give 2 or 3 suggested answers, written in the language of the copy, short enough to drop into the copy. The user ticks one only if it is true for them, so:
  - Never write a number, price, date, duration, percentage, rating, count or client name. Where the answer needs one, leave a blank as ${FACT_BLANK} for the user to fill in (for example "More than ${FACT_BLANK} clients", "From $${FACT_BLANK} per month", "Free first call of ${FACT_BLANK} minutes").
  - Answers without a number are fine as they are when they are common for this kind of business (for example "No long-term contract").
  - Each suggestion states one plain fact. No sales phrases such as "filling fast" or "don't miss out", and never a customer quote or testimonial.

Answer with JSON only: {"gaps":[{"kind":"offer|urgency|proof|price|guarantee|next_step|other","question":"...","suggestions":["...","..."]}]}`;
}

/** Where testimonials were taken out: they are on the page, so they are not asked for. */
const TESTIMONIAL_MARKER_LINE = /^.*\[\[\s*TESTIMONIALS[-\s_]?\d+\s*\]\].*$/gim;

/** The copy the questions are about: testimonials out, and for a long page its start and its end. */
function excerpt(copy: string): string {
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

/**
 * A suggestion is shown only when it holds no number of its own: a figure the
 * model wrote ("Rated 4.9 stars") looks true and could be ticked in a hurry.
 * Numbers belong in the blanks, where the user types them.
 */
export function isSafeSuggestion(suggestion: string): boolean {
  return !/\d/.test(suggestion.replace(BLANKS, ''));
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
    const seen = new Set<string>();
    const suggestions = (Array.isArray(item.suggestions) ? item.suggestions : [])
      .map(value => oneLine(value, USER_FACT_MAX_CHARS).replace(BLANKS, FACT_BLANK))
      .filter(value => value && isSafeSuggestion(value))
      .filter(value => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MISSING_FACTS_MAX_SUGGESTIONS);
    questions.push({ kind: oneLine(item.kind, 20).toLowerCase() || 'other', question, suggestions });
    if (questions.length === MISSING_FACTS_MAX_QUESTIONS) break;
  }
  return questions;
}

/** The questions for this copy and goal. Empty for other goals, and on any failure. */
export async function findMissingFacts(
  copy: string,
  goalKey: GoalKey,
  goalLabel: string | undefined,
  user: User,
  sessionId?: string
): Promise<MissingFactQuestion[]> {
  if (!asksForMissingFacts(goalKey)) return [];
  const text = excerpt(copy);
  if (!text.trim()) return [];
  try {
    const response = await makeApiRequestWithFallback(
      MISSING_FACTS_MODEL,
      [
        { role: 'system', content: systemPrompt(goalKey, goalLabel) },
        { role: 'user', content: `Copy:\n"""\n${text}\n"""` },
      ],
      0.2,
      900,
      { type: 'json_object' },
      user.email,
      'quick_missing_facts',
      sessionId
    );
    return parseMissingFacts(response.choices[0]?.message?.content ?? '');
  } catch {
    return [];
  }
}

/**
 * The facts as they go to the writer: one line each, trimmed, no blank left
 * unfilled, no duplicates, at most USER_FACTS_MAX.
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
    factList(clean),
  ].join('\n');
}

/** Told to the rewrite step of a change: the user's facts count as part of the text. */
export function userFactsChangeNote(facts: string[]): string {
  const clean = cleanUserFacts(facts);
  if (clean.length === 0) return '';
  return ['The user also gave these facts about the business. They count as facts the text states, exactly as given:', factList(clean)].join('\n');
}
