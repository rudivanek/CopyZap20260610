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
/** Ceiling for one writing call. */
export const MAX_OUTPUT_TOKENS = 16000;
/** Generous on purpose: Spanish and German need about twice as many tokens per word as English. */
const TOKENS_PER_WORD = 3.2;

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
