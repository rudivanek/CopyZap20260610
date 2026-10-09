/**
 * Output budget for the writing steps (generation and editorial refinement).
 *
 * Until now every writing call was capped at 4,000 output tokens and sent as a
 * normal request, which fails for long copy in two ways: the text is cut off
 * when the cap is reached, and a call that writes that much can exceed the
 * 150-second edge function timeout.
 *
 * Copy up to LONG_COPY_WORDS keeps the old behaviour exactly. Longer copy gets
 * a budget in proportion to its length and is streamed, which has no timeout.
 */

/** Above this many words a piece counts as long copy. 4,000 tokens covers this much in any supported language. */
export const LONG_COPY_WORDS = 1250;
/** The budget every writing call had before, and still has for normal copy. */
export const DEFAULT_OUTPUT_TOKENS = 4000;
/**
 * Ceiling for one writing call. 20,000 covers a German version of about 6,000
 * words: a 5,000-word original that comes back a fifth longer.
 */
export const MAX_OUTPUT_TOKENS = 20000;
/**
 * Generous on purpose. Measured: English needs about 1.5 tokens per word,
 * Spanish 2.2, German 2.9, and a version comes back up to a fifth longer than
 * the copy it was made from (2.9 x 1.19 = 3.45).
 */
const TOKENS_PER_WORD = 3.6;

export interface OutputBudget {
  isLongCopy: boolean;
  maxTokens: number;
}

export function getOutputBudget(words: number): OutputBudget {
  if (!Number.isFinite(words) || words <= LONG_COPY_WORDS) {
    return { isLongCopy: false, maxTokens: DEFAULT_OUTPUT_TOKENS };
  }
  return {
    isLongCopy: true,
    maxTokens: Math.min(MAX_OUTPUT_TOKENS, Math.max(DEFAULT_OUTPUT_TOKENS, Math.ceil(words * TOKENS_PER_WORD))),
  };
}

/** The edge function streams Claude models only. */
export function canStream(model: string | undefined): boolean {
  return typeof model === 'string' && model.startsWith('claude-');
}
