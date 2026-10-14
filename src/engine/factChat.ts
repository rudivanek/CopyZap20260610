/**
 * Quick — "Make it stronger" as a chat, a test next to the answer fields.
 *
 * The first question is the first one missingFacts.ts found, so the chat starts
 * at once. After each answer one small call (Haiku) reads the conversation and
 * decides what comes next: ask to clarify a vague answer ("50% of what?"), ask
 * the next missing thing, or stop. It also keeps the list of facts the user has
 * given, in their own words; that list is what the writer gets.
 *
 * Nothing the user did not say may become a fact: a fact with a number the
 * user never typed is dropped in code, and a currency they never named is taken
 * out of it (factsSaidByUser). The user
 * sees the list before generating and can take any fact out.
 *
 * At most FACT_CHAT_MAX_QUESTIONS questions, and an answer such as "that's all"
 * or "eso es todo" ends the chat (endsChat). When CopyZap has nothing more to
 * ask it ends with one last open question (CLOSING_QUESTION), so the user can
 * add what CopyZap did not think of. The user can also add a fact in their own
 * words at any time (FactChat.added); those go to the writer exactly as typed. The step never throws: on a
 * failure the answer is kept as the user wrote it and the next question found
 * earlier is asked.
 */
import { GoalKey, User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import type { TextKindKey } from '../services/api/textKinds';
import {
  cleanUserFacts,
  excerpt,
  FACT_BLANK,
  exampleLanguage,
  goalLine,
  kindGuidance,
  MissingFactQuestion,
  safeExample,
  USER_FACT_MAX_CHARS,
  USER_FACTS_MAX,
} from './missingFacts';

const FACT_CHAT_MODEL = 'claude-haiku-4-5';
/** Questions CopyZap asks in one chat, clarifications included. */
export const FACT_CHAT_MAX_QUESTIONS = 5;
/** What a skipped question is recorded as. */
export const SKIPPED_ANSWER = '(skipped)';

export interface ChatTurn {
  from: 'copyzap' | 'user';
  text: string;
  /** A CopyZap question only: an example answer in the copy's language, with ___ for the user's own values. */
  example?: string;
}

export interface FactChat {
  turns: ChatTurn[];
  /** The facts CopyZap took from the answers, in the user's words. */
  facts: string[];
  /** Facts the user typed straight into the list ("Add a fact"): used exactly as typed. */
  added: string[];
  /** CopyZap is reading the last answer. */
  waiting: boolean;
  /** No more questions: CopyZap has enough, the limit is reached, or the user said Done. */
  done: boolean;
  /** What the user is typing and has not sent yet. */
  draft: string;
  /** Facts the user took out of the list: never added back. */
  removed: string[];
}

export const EMPTY_FACT_CHAT: FactChat = { turns: [], facts: [], added: [], waiting: false, done: false, draft: '', removed: [] };

/** Every fact of the chat, as the writer gets them: from the answers, then the ones added by hand. */
export function chatFacts(chat: FactChat): string[] {
  return cleanUserFacts([...chat.facts, ...chat.added]);
}

/** The chat's last question, asked when CopyZap has nothing more to ask. */
export const CLOSING_QUESTION = 'Anything else that is true and should be in the copy?';

export const closingAsked = (turns: ChatTurn[]) => turns.some(turn => turn.from === 'copyzap' && turn.text === CLOSING_QUESTION);

/** The chat with its last question added. */
export function withClosingQuestion(chat: FactChat): FactChat {
  return { ...chat, waiting: false, done: false, turns: [...chat.turns, { from: 'copyzap', text: CLOSING_QUESTION }] };
}

/** What the chat is about: the same copy, goal and kind the questions were found for. */
export interface FactChatContext {
  copy: string;
  goalKey: GoalKey;
  goalLabel?: string;
  kind: TextKindKey | null | undefined;
  /** The copy's language as Quick read it ("Spanish"). */
  language?: string | null;
  user: User;
  sessionId?: string;
}

/** When nothing is missing the section's intro says so; the chat only asks. */
const NOTHING_MISSING_QUESTION = 'Is there anything true about your business that should be in the copy?';

/** The chat's first turn: the first question found, or an open one when nothing is missing. */
export function startFactChat(questions: MissingFactQuestion[]): FactChat {
  const first = questions[0];
  const turn: ChatTurn = first
    ? { from: 'copyzap', text: first.question, example: first.example || undefined }
    : { from: 'copyzap', text: NOTHING_MISSING_QUESTION };
  return { ...EMPTY_FACT_CHAT, turns: [turn] };
}

export const questionsAsked = (turns: ChatTurn[]) => turns.filter(turn => turn.from === 'copyzap').length;

// --- Only what the user said -------------------------------------------------

/** Numbers as written, without thousands separators: "32,000" and "32.000" are 32000; "1,5" is 1.5. */
export function numbersIn(text: string): string[] {
  const plain = text.replace(/(\d)[.,\s](?=\d{3}(?!\d))/g, '$1');
  return (plain.match(/\d+(?:[.,]\d+)?/g) ?? []).map(number => number.replace(',', '.'));
}

const CURRENCY_WORDS = /[$€£¥₹]|\b(?:MXN|USD|EUR|GBP|CAD|AUD|CHF|COP|ARS|CLP|PEN|BRL|pesos?|d[oó]lar(?:es)?|dollars?|euros?)\b/gi;
const currenciesIn = (text: string) => text.match(CURRENCY_WORDS) ?? [];

/**
 * The facts whose numbers all come from the user's own answers; a fact with a
 * figure the model made up is dropped. A currency the user never named is
 * taken out of the fact.
 */
export function factsSaidByUser(facts: string[], turns: ChatTurn[]): string[] {
  const said = turns
    .filter(turn => turn.from === 'user')
    .map(turn => turn.text)
    .join('\n');
  const saidNumbers = new Set(numbersIn(said));
  const base = (currency: string) => currency.toLowerCase().replace('ó', 'o').replace(/s$|es$/, '');
  const saidCurrencies = new Set(currenciesIn(said).map(base));
  return cleanUserFacts(
    facts
      .filter(fact => numbersIn(fact).every(number => saidNumbers.has(number)))
      // A currency the user never named is taken out, not the whole fact: "$32,000 MXN" for "32,000 MXN".
      .map(fact => fact.replace(CURRENCY_WORDS, currency => (saidCurrencies.has(base(currency)) ? currency : '')).replace(/\s+/g, ' ').trim())
  );
}

/** An answer that says no, or nothing: it adds no fact. */
const NO_ANSWER = /^\s*(?:\(skipped\)|no|nope|none|nothing|n\/a|-|no\.?|nada|ninguno|ninguna|no aplica|no tenemos|nein|nichts)\s*[.!]?\s*$/i;

/** An answer that ends the chat: "that's all", "eso es todo", "listo". Its facts still count. */
const DONE_ANSWER =
  /(?:^|[\s,;])(?:that'?s (?:all|it)|that is (?:all|it)|i'?m done|done|nothing (?:else|more)|eso es todo|es todo|nada m[aá]s|listo|terminamos|das ist alles|fertig|nichts mehr)$/i;

export const endsChat = (answer: string) => DONE_ANSWER.test(answer.trim().replace(/[.!¡\s]+$/, ''));

// --- One step ----------------------------------------------------------------

function systemPrompt(context: FactChatContext, planned: MissingFactQuestion[]): string {
  const guidance = kindGuidance(context.kind);
  const language = exampleLanguage(context.language);
  const plannedList = planned.length
    ? planned.map(question => `- ${question.question}`).join('\n')
    : '- (nothing important was found missing; ask only what the user offers)';
  return `You help a business owner add true facts to a piece of marketing copy before it is rewritten. ${goalLine(context.goalKey, context.goalLabel)} ${guidance.line}

The rewrite may only use facts the copy states, plus the facts the user gives in this chat. These gaps were found in the copy, most important first:
${plannedList}

You get the copy and the chat so far. Do two things.

1. "facts": the full, updated list of facts the user has given in the chat, one short line each.
- Take every fact from every answer, also a fact that answers a different question than the one asked ("more than 120 sites, and the first review is free" gives two facts).
- Write each fact in ${language}, short: the user's own words, plus only the few words needed to say what it is about (an answer "28000 mxn" to the price question becomes "Precio desde 28000 mxn" in Spanish, "Price from 28000 mxn" in English). Never turn it into a long sentence. Keep every number, currency and name exactly as the user wrote it.
- Never add anything the user did not say: no number, price, currency, date, duration, result or promise of your own, and do not make a fact stronger than the user put it.
- A fact that is vague stays as vague as the user wrote it. When the user later makes it clear, replace it with the clear version.
- "no", "skip" or "(skipped)" gives no fact. Something the copy already says is not a new fact.
- At most ${USER_FACTS_MAX} facts.

2. "next": the next question, or null.
- If the last answer is vague or unclear (a number without what it refers to, "it depends", "a discount" without how much or on what), ask about that answer first, once: say what is unclear and show what a clear answer looks like.
- Otherwise ask the next gap from the list above that is not answered or skipped. You may ask one short follow-up when an answer opens something useful for the copy (what a free consultation includes, for example), but never ask the same thing twice, and never for something the copy already states.
- If the user says they are done, or every gap is answered or skipped, "next" is null. Never ask an open "anything else?" question yourself: CopyZap asks that at the end.
- The question is one short sentence in ENGLISH, whatever the language of the copy or of the answers. Be friendly and plain; no praise, no sales talk.
- "example": one example answer in ${language}, short enough to drop into the copy. Never a number, price, date, duration, percentage, rating, count or client name of your own: leave ${FACT_BLANK} where the user's own value goes. Never a currency symbol or code. Empty when no example helps.

Answer with JSON only: {"facts":["..."],"next":{"question":"(in English)","example":"(in ${language})"}} or {"facts":["..."],"next":null}`;
}

function chatText(turns: ChatTurn[]): string {
  return turns.map(turn => `${turn.from === 'copyzap' ? 'CopyZap' : 'User'}: ${turn.text}`).join('\n');
}

const oneLine = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

export interface FactChatStep {
  facts: string[];
  next: { question: string; example: string } | null;
}

/** Reads the model's reply. Null when it is not usable. */
export function parseFactChatStep(raw: string): FactChatStep | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonResponse(raw));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const item = parsed as Record<string, unknown>;
  if (!Array.isArray(item.facts)) return null;
  const facts = item.facts.map(fact => oneLine(fact, USER_FACT_MAX_CHARS)).filter(Boolean);
  const next = item.next && typeof item.next === 'object' ? (item.next as Record<string, unknown>) : null;
  const question = next ? oneLine(next.question, 220) : '';
  return { facts, next: question ? { question, example: safeExample(next?.example) } : null };
}

/**
 * Without the model: the answer counts as written, and the next question found
 * earlier that has not been asked comes next.
 */
function fallbackStep(chat: FactChat, planned: MissingFactQuestion[]): FactChatStep {
  const last = chat.turns[chat.turns.length - 1];
  const facts = last?.from === 'user' && !NO_ANSWER.test(last.text) ? [...chat.facts, last.text] : chat.facts;
  const asked = new Set(chat.turns.filter(turn => turn.from === 'copyzap').map(turn => turn.text));
  const next = planned.find(question => !asked.has(question.question));
  return { facts, next: next ? { question: next.question, example: next.example } : null };
}

/**
 * The chat after the user's last answer (already in chat.turns): the updated
 * facts and the next question, or done. Never throws.
 */
export async function nextFactChatStep(
  context: FactChatContext,
  planned: MissingFactQuestion[],
  chat: FactChat
): Promise<FactChat> {
  let step: FactChatStep | null = null;
  try {
    const response = await makeApiRequestWithFallback(
      FACT_CHAT_MODEL,
      [
        { role: 'system', content: systemPrompt(context, planned) },
        {
          role: 'user',
          content: `Copy:\n"""\n${excerpt(context.copy)}\n"""\n\nThe chat so far:\n${chatText(chat.turns)}\n\nFacts so far:\n${
            chat.facts.length ? chat.facts.map(fact => `- ${fact}`).join('\n') : '(none)'
          }${
            chat.removed.length
              ? `\n\nThe user took these facts out. Never add them again:\n${chat.removed.map(fact => `- ${fact}`).join('\n')}`
              : ''
          }`,
        },
      ],
      0.2,
      700,
      { type: 'json_object' },
      context.user.email,
      'quick_fact_chat',
      context.sessionId
    );
    step = parseFactChatStep(response.choices[0]?.message?.content ?? '');
  } catch {
    step = null;
  }
  if (!step) step = fallbackStep(chat, planned);

  const removed = new Set(chat.removed.map(fact => fact.toLowerCase()));
  const facts = factsSaidByUser(step.facts, chat.turns).filter(fact => !removed.has(fact.toLowerCase()));
  const last = chat.turns[chat.turns.length - 1];
  const userEnded = last?.from === 'user' && endsChat(last.text);
  const closed = closingAsked(chat.turns);
  const limitReached = questionsAsked(chat.turns) >= FACT_CHAT_MAX_QUESTIONS;
  const next = limitReached || userEnded || closed ? null : step.next;
  const updated: FactChat = { ...chat, facts, waiting: false };
  if (next) {
    return { ...updated, done: false, turns: [...chat.turns, { from: 'copyzap', text: next.question, example: next.example || undefined }] };
  }
  // Nothing more to ask: one last open question, unless the user ended the chat or already had it.
  if (!userEnded && !closed) return withClosingQuestion(updated);
  return { ...updated, done: true };
}
