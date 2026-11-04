/**
 * Quick — "Start from a brief (2)": reads the short request the user typed
 * (and their website, if given) and works out what they want written and
 * which few questions would make the copy theirs instead of generic.
 *
 * One small model call through ai-completion. The operation name starts with
 * "brief_", so the edge function checks brief-mode access before it runs.
 */
import { GoalKey, Language, Tone, User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import {
  BRIEF_MAX_WORDS,
  BRIEF_MIN_WORDS,
  BRIEF_PIECES,
  BriefNotAvailableError,
  BriefPieceKey,
  briefPiece,
  suggestedWordsFor,
} from './generateFromBrief';
import { QUICK_LANGUAGES, QUICK_TONES } from './inferQuickBrief';
import wizardPrompt from '../prompts/wizardQuestions.md?raw';
import followUpPrompt from '../prompts/wizardFollowUp.md?raw';

export type WizardFieldKey =
  | 'product' | 'audience' | 'goal' | 'result' | 'alternatives' | 'differentiators' | 'proof' | 'experience' | 'callToAction';

/** The answers the wizard can ask for, with the label shown when it does not ask. */
export const WIZARD_FIELDS: { key: Exclude<WizardFieldKey, 'goal'>; label: string; placeholder: string }[] = [
  { key: 'product', label: 'Company and what it sells', placeholder: 'For example: Sharpen.Studio, website development' },
  { key: 'audience', label: 'Who it is for', placeholder: 'For example: small business owners' },
  { key: 'result', label: 'What the customer gets', placeholder: 'For example: a brand ready to launch in 4 weeks' },
  { key: 'alternatives', label: 'Who they compare you with, and why they pick you', placeholder: 'For example: freelancers; we include the strategy and the brand manual' },
  { key: 'differentiators', label: 'What makes you different', placeholder: 'For example: 20+ years, every site custom-made' },
  { key: 'proof', label: 'Proof or results', placeholder: 'For example: 200+ clients' },
  { key: 'experience', label: 'Your own experience or opinion', placeholder: 'For example: the biggest mistake is looking for the cheapest quote' },
  { key: 'callToAction', label: 'What the reader should do', placeholder: 'For example: ask for a quote' },
];

export interface WizardQuestion {
  key: WizardFieldKey;
  question: string;
  choices: string[];
}

export type WizardFormality = 'formal' | 'informal';

export interface WizardPlan {
  piece: BriefPieceKey;
  topic: string;
  /** Pages only: the length in words. Null for anything that is not a page. */
  targetWords: number | null;
  language: Language;
  /** Set when the request is in a language the engine cannot write yet. */
  unsupportedLanguage?: string;
  country: string;
  formality: WizardFormality | null;
  tone: Tone;
  goal: GoalKey;
  /** What the request and the website already say, per field. */
  known: Record<Exclude<WizardFieldKey, 'goal'>, string>;
  /** The questions to ask, most important first. */
  questions: WizardQuestion[];
}

const WIZARD_MODEL = 'claude-sonnet-4-6' as const;
const WIZARD_MAX_TOKENS = 1500;
const MAX_QUESTIONS = 6;
const FIELD_KEYS: WizardFieldKey[] = ['product', 'audience', 'goal', 'result', 'alternatives', 'differentiators', 'proof', 'experience', 'callToAction'];
const GOAL_KEYS: GoalKey[] = ['convert', 'nurture', 'inform', 'educate', 'brand'];

function text(value: unknown, max = 400): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function match<T extends string>(value: unknown, options: T[]): T | undefined {
  const wanted = text(value).toLowerCase();
  return wanted ? options.find(option => option.toLowerCase() === wanted) : undefined;
}

function emptyKnown(): WizardPlan['known'] {
  return { product: '', audience: '', result: '', alternatives: '', differentiators: '', proof: '', experience: '', callToAction: '' };
}

/** The plan used when the request cannot be read: every field is asked. */
export function fallbackWizardPlan(language: Language = 'English'): WizardPlan {
  return {
    piece: 'other',
    topic: '',
    targetWords: null,
    language,
    country: '',
    formality: null,
    tone: 'Professional',
    goal: 'convert',
    known: emptyKnown(),
    questions: [],
  };
}

function wordsFor(piece: BriefPieceKey, value: unknown): number | null {
  if (briefPiece(piece).group !== 'page') return null;
  const number = typeof value === 'number' ? value : Number(text(value).replace(/[^\d]/g, ''));
  if (!Number.isFinite(number) || number <= 0) return suggestedWordsFor(piece);
  return Math.min(BRIEF_MAX_WORDS, Math.max(BRIEF_MIN_WORDS, Math.round(number / 10) * 10));
}

/** Turns the model's reply into a plan. Anything missing or invalid falls back. */
export function parseWizardPlan(raw: string, defaultLanguage: Language = 'English'): WizardPlan {
  const fallback = fallbackWizardPlan(defaultLanguage);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanJsonResponse(raw));
  } catch {
    return fallback;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;

  const piece = match(String(parsed.piece ?? '').toLowerCase().replace(/[\s/-]+/g, '_'), BRIEF_PIECES.map(item => item.key)) ?? 'other';
  const reportedLanguage = text(parsed.language, 40);
  const language = match(reportedLanguage, QUICK_LANGUAGES);
  const rawKnown = (parsed.known && typeof parsed.known === 'object' ? parsed.known : {}) as Record<string, unknown>;
  const known = emptyKnown();
  (Object.keys(known) as (keyof WizardPlan['known'])[]).forEach(key => {
    known[key] = text(rawKnown[key]);
  });

  const seen = new Set<WizardFieldKey>();
  const questions: WizardQuestion[] = [];
  if (Array.isArray(parsed.questions)) {
    for (const item of parsed.questions) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const key = match(record.key, FIELD_KEYS);
      const question = text(record.question, 200);
      // The goal is always shown as its own choice, so it is never asked as a question.
      if (!key || key === 'goal' || !question || seen.has(key)) continue;
      seen.add(key);
      const choices = Array.isArray(record.choices)
        ? record.choices.map(choice => text(choice, 120)).filter(Boolean).slice(0, 4)
        : [];
      questions.push({ key, question, choices });
      if (questions.length >= MAX_QUESTIONS) break;
    }
  }

  const formality = match(parsed.formality, ['formal', 'informal'] as WizardFormality[]) ?? null;
  return {
    piece,
    topic: piece === 'blog_post' ? text(parsed.topic, 200) : '',
    targetWords: wordsFor(piece, parsed.targetWords),
    language: language ?? fallback.language,
    ...(reportedLanguage && !language ? { unsupportedLanguage: reportedLanguage } : {}),
    country: text(parsed.country, 60),
    formality,
    tone: match(parsed.tone, QUICK_TONES) ?? 'Professional',
    goal: match(parsed.goal, GOAL_KEYS) ?? 'convert',
    known,
    questions,
  };
}

/**
 * Reads the request (and the website text, if any) and returns what to write
 * and what to ask. Throws BriefNotAvailableError when the account may not use
 * brief mode; on any other failure returns a plan that asks for everything.
 */
export async function getWizardPlan(
  request: string,
  siteFacts: string | undefined,
  user: User,
  defaultLanguage: Language,
  sessionId?: string,
): Promise<WizardPlan> {
  const system = wizardPrompt.replace('{{PIECES}}', BRIEF_PIECES.map(item => item.key).join(', '));
  const lines = [`The request:\n"""\n${request.trim().slice(0, 2000)}\n"""`];
  if (siteFacts && siteFacts.trim()) {
    lines.push('');
    lines.push('Text from their website, as a source of facts about the company:');
    lines.push('<website>');
    lines.push(siteFacts.trim());
    lines.push('</website>');
  }
  try {
    const response = await makeApiRequestWithFallback(
      WIZARD_MODEL,
      [
        { role: 'system', content: system },
        { role: 'user', content: lines.join('\n') },
      ],
      0.3,
      WIZARD_MAX_TOKENS,
      { type: 'json_object' },
      user.email,
      'brief_wizard_questions',
      sessionId,
    );
    return parseWizardPlan(response.choices[0]?.message?.content ?? '', defaultLanguage);
  } catch (error) {
    if (error instanceof Error && error.message.includes('BRIEF_MODE_NOT_AVAILABLE')) {
      throw new BriefNotAvailableError();
    }
    return fallbackWizardPlan(defaultLanguage);
  }
}

const MAX_FOLLOW_UPS = 2;

/**
 * Reads the user's answers and asks one follow-up for each of at most two
 * answers that are too general to make the copy specific ("satisfaction
 * guarantee" -> "what exactly do you guarantee?"). Never throws: on any
 * failure there are no follow-ups and the copy is written from the answers.
 */
export async function getWizardFollowUps(
  pieceLabel: string,
  answers: { key: WizardFieldKey; label: string; value: string }[],
  user: User,
  sessionId?: string,
): Promise<WizardQuestion[]> {
  const given = answers.filter(answer => answer.value.trim());
  if (given.length === 0) return [];
  const lines = [
    `What is being written: ${pieceLabel}`,
    '',
    'The answers:',
    ...given.map(answer => `- ${answer.key} (${answer.label}): ${answer.value.trim()}`),
  ];
  try {
    const response = await makeApiRequestWithFallback(
      WIZARD_MODEL,
      [
        { role: 'system', content: followUpPrompt },
        { role: 'user', content: lines.join('\n') },
      ],
      0.2,
      600,
      { type: 'json_object' },
      user.email,
      'brief_wizard_followup',
      sessionId,
    );
    const parsed = JSON.parse(cleanJsonResponse(response.choices[0]?.message?.content ?? ''));
    const list = parsed && Array.isArray(parsed.followUps) ? parsed.followUps : [];
    const keys = given.map(answer => answer.key);
    const seen = new Set<WizardFieldKey>();
    const followUps: WizardQuestion[] = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const key = match((item as Record<string, unknown>).key, keys);
      const question = text((item as Record<string, unknown>).question, 200);
      if (!key || !question || seen.has(key)) continue;
      seen.add(key);
      const rawChoices = (item as Record<string, unknown>).choices;
      const choices = Array.isArray(rawChoices) ? rawChoices.map(choice => text(choice, 120)).filter(Boolean).slice(0, 3) : [];
      followUps.push({ key, question, choices });
      if (followUps.length >= MAX_FOLLOW_UPS) break;
    }
    return followUps;
  } catch {
    return [];
  }
}
