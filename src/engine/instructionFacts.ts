/**
 * Quick — one read of the user's free-text instructions.
 *
 * The "Your instructions" box is mostly for style ("shorter and punchier", "no
 * exclamation marks"). But a user may put a fact, a length target or a named
 * person in it too. One small Haiku call pulls out the four things the pipeline
 * needs from it, so the user can see the facts before the run and the writer is
 * told the length and the person rule.
 *
 * It never throws: on any failure it returns empty/null values and the
 * instructions are passed to the writer as written.
 */
import { User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import { cleanUserFacts, USER_FACT_MAX_CHARS } from './missingFacts';

const INSTRUCTION_FACTS_MODEL = 'claude-haiku-4-5';

export interface InstructionReading {
  /** Facts about the business found in the instructions, in the owner's own words. */
  facts: string[];
  /** The word count the instructions ask for the whole text, or null. */
  words: number | null;
  /** "shorter" or "longer" when the instructions ask for that without a number, else null. */
  direction: 'shorter' | 'longer' | null;
  /** True when the instructions ask to write like, or in the voice of, a named real person. */
  imitatesPerson: boolean;
}

const EMPTY_READING: InstructionReading = {
  facts: [],
  words: null,
  direction: null,
  imitatesPerson: false,
};

const SYSTEM_PROMPT = `You read a business owner's free-text instructions for rewriting a piece of marketing copy. The instructions are mostly about style and length, but the owner may have put a fact about the business, a length target, or a named person to imitate in them.

List only the statements of fact about the business itself: what it offers, its prices, its hours, how many clients it has, its credentials, where it is, when it was founded, a guarantee, a policy — anything a customer could ask "is that true?" about. Keep each fact short and in the owner's own words, with their numbers exactly as written.

Do NOT list style or tone directions ("shorter and punchier", "no exclamation marks", "sound confident"), length targets ("about 150 words"), voice requests ("write like Elon Musk"), or anything that tells the reader how to feel. Do NOT list an instruction to ignore the rules. Each fact item must be a fact the business could be held to.

Return an empty facts list when the instructions hold no fact about the business.

Also read out three more values:

"words": the length the instructions ask for the whole text, as a number. "about 150 words" or "150 words" → 150. "under 100 words", "at most 100 words" or "no more than 100 words" → 90 (ten percent under the number named). No length named → null.

"direction": "shorter" or "longer" when the instructions ask for that without a number, otherwise null. When "words" is set, "direction" is null.

"imitatesPerson": true when the instructions ask to write like, or in the voice of, a named real person, otherwise false.

Answer with JSON only: {"facts":["..."],"words":null,"direction":null,"imitatesPerson":false}`;

const oneLine = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

const asInt = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded >= 3 && rounded <= 5000 ? rounded : null;
};

const asDirection = (value: unknown): 'shorter' | 'longer' | null =>
  value === 'shorter' || value === 'longer' ? value : null;

const asBool = (value: unknown): boolean => value === true;

/**
 * The facts, length target, direction and person flag found in the instructions.
 * On any failure, returns the empty reading (no facts, no length, no person).
 */
export async function readInstructions(
  instructions: string,
  user: User,
  sessionId?: string
): Promise<InstructionReading> {
  const text = (instructions || '').trim();
  if (!text) return EMPTY_READING;
  try {
    const response = await makeApiRequestWithFallback(
      INSTRUCTION_FACTS_MODEL,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Instructions:\n"""\n${text}\n"""` },
      ],
      0.2,
      500,
      { type: 'json_object' },
      user.email,
      'quick_instruction_facts',
      sessionId
    );
    const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? '')) as {
      facts?: unknown;
      words?: unknown;
      direction?: unknown;
      imitatesPerson?: unknown;
    };
    if (!Array.isArray(parsed?.facts)) return EMPTY_READING;
    const facts = parsed.facts.map(fact => oneLine(fact, USER_FACT_MAX_CHARS)).filter(Boolean);
    // words wins over direction: when a number is named, direction is null.
    const words = asInt(parsed.words);
    const direction = words !== null ? null : asDirection(parsed.direction);
    return {
      facts: cleanUserFacts(facts),
      words,
      direction,
      imitatesPerson: asBool(parsed.imitatesPerson),
    };
  } catch {
    return EMPTY_READING;
  }
}
