/**
 * Quick — turns "pasted copy + a goal" into the full settings object the
 * CopyZap engine expects. Everything not set here keeps the Copy Maker default.
 */
import { FormState, GoalKey, Language, ScoringContext, Tone } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';
import { detectLanguage, convertLanguageCodeToFormDataLanguage } from '../utils/languageDetection';
import { countWords } from '../utils/markdownUtils';
import { buildContextFromKey } from '../utils/scoringContextStorage';

/** How many versions one Quick run writes. */
export const QUICK_DEFAULT_VARIANTS = 3;
/** Shortest input Quick accepts. */
export const QUICK_MIN_WORDS = 10;
/**
 * Longest input Quick accepts. The scorers now read the whole text; the limit
 * left is the writing step, which returns at most 4,000 tokens per version
 * (roughly 2,000 words in Spanish). 1,500 keeps a margin until that is raised.
 */
export const QUICK_MAX_WORDS = 1500;
/** Passed to the comparison prompt as the section name. */
export const QUICK_SECTION = 'Marketing Copy';

const LABEL_MAX_CHARS = 60;

/** A short name for a run, taken from the first line of the copy. */
export function deriveQuickLabel(copy: string): string {
  const firstLine = (copy || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line.length > 0) || '';

  const clean = firstLine
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*>]\s+/, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return 'Untitled copy';
  if (clean.length <= LABEL_MAX_CHARS) return clean;

  const cut = clean.slice(0, LABEL_MAX_CHARS);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** What the user confirmed about the copy. Every field is optional. */
export interface QuickBriefInput {
  product?: string;
  audience?: string;
  tone?: Tone;
  language?: Language;
}

export interface QuickFormInput {
  copy: string;
  variants?: number;
  brief?: QuickBriefInput;
}

export function buildQuickFormState(input: QuickFormInput): FormState {
  const copy = input.copy.trim();
  const words = countWords(copy);
  const variants = Math.min(Math.max(input.variants ?? QUICK_DEFAULT_VARIANTS, 1), 5);
  const brief = input.brief ?? {};

  return {
    ...DEFAULT_FORM_STATE,
    tab: 'improve',
    originalCopy: copy,
    language: brief.language ?? convertLanguageCodeToFormDataLanguage(detectLanguage(copy)),
    tone: brief.tone ?? DEFAULT_FORM_STATE.tone,
    productServiceName: (brief.product ?? '').trim(),
    targetAudience: (brief.audience ?? '').trim(),
    // Improve keeps the length of the original.
    wordCount: 'Custom',
    customWordCount: words,
    prioritizeWordCount: false,
    // Session and history name. Not used in any prompt.
    projectDescription: `Quick: ${deriveQuickLabel(copy)}`,
    createVariants: variants > 1,
    numberOfVariants: variants,
    aiEngineMode: 'enhanced',
    copyResult: { improvedCopy: '', generatedVersions: [] },
  };
}

/** Quick always scores with the goal-aware Absolute method. */
export function buildQuickScoringContext(goalKey: GoalKey): ScoringContext {
  return { ...buildContextFromKey('general_improve', goalKey), method: 'new' };
}
