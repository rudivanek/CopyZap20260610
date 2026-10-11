/**
 * Quick — reads pasted copy and reports what it sells, who it is for, its tone,
 * its language and what kind of text it is, so the user can confirm in one line
 * instead of filling a form.
 *
 * One small model call. It never throws: on any failure it returns a fallback
 * brief with empty text fields, and the user can fill them in or just generate.
 */
import { Language, Tone, User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import { convertLanguageCodeToFormDataLanguage, detectLanguage } from '../utils/languageDetection';
import { DEFAULT_TEXT_KIND, getTextKind, TEXT_KINDS, TextKindKey } from '../services/api/textKinds';
import { countWords } from '../utils/markdownUtils';
import { QUICK_FEW_WORDS } from './buildQuickFormState';

export const QUICK_TONES: Tone[] = ['Professional', 'Friendly', 'Bold', 'Minimalist', 'Creative', 'Persuasive'];
export const QUICK_LANGUAGES: Language[] = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];

const BRIEF_MODEL = 'claude-sonnet-4-6';
const BRIEF_MAX_INPUT_CHARS = 4000;
const BRIEF_FIELD_MAX_CHARS = 140;

export interface QuickBrief {
  /** What the copy sells. Empty when it could not be read. */
  product: string;
  /** Who the copy is for. Empty when it could not be read. */
  audience: string;
  tone: Tone;
  language: Language;
  /** Set when the copy is in a language the engine cannot write yet. */
  unsupportedLanguage?: string;
  /** What kind of text the copy is (see services/api/textKinds.ts). The user can change it. */
  kind: TextKindKey;
  /** For the kind "other": what the user typed. Never filled in by the reading step. */
  kindOther: string;
}

const SYSTEM_PROMPT = `You read a piece of marketing copy and report five facts about it. Reply with one JSON object and nothing else.

{
  "product": "the product or service the copy is selling, 8 words or fewer",
  "audience": "who the copy is written for, 12 words or fewer",
  "tone": "the closest of: ${QUICK_TONES.join(', ')}",
  "language": "the language the copy is written in, as an English word, for example English or Spanish",
  "kind": "what kind of text the copy is, exactly one of: ${TEXT_KINDS.map(kind => kind.key).join(', ')}"
}

The kinds:
${TEXT_KINDS.map(kind => `- ${kind.key}: ${kind.hint}`).join('\n')}

Rules:
- Write "product" and "audience" in the same language as the copy.
- Report only what the copy shows. If something cannot be told from the copy, use an empty string for it.
- Do not rewrite, judge or improve the copy.`;

function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, BRIEF_FIELD_MAX_CHARS);
}

function matchOption<T extends string>(value: unknown, options: T[]): T | undefined {
  const wanted = clean(value).toLowerCase();
  return wanted ? options.find(option => option.toLowerCase() === wanted) : undefined;
}

/** The brief used when the copy cannot be read automatically. */
export function fallbackQuickBrief(copy: string): QuickBrief {
  return {
    product: '',
    audience: '',
    tone: 'Professional',
    language: convertLanguageCodeToFormDataLanguage(detectLanguage(copy)),
    kind: kindForLength(DEFAULT_TEXT_KIND, copy),
    kindOther: '',
  };
}

/**
 * A text of a few words cannot be a page. When the reading step calls it a
 * page, or cannot tell, it is a short text: judged as a page, a slogan would
 * be marked down for everything a page has and a slogan has not. An ad or a
 * social post of a few words stays what it is.
 */
function kindForLength(kind: TextKindKey, copy: string): TextKindKey {
  const fewWords = countWords((copy || '').trim()) < QUICK_FEW_WORDS;
  return fewWords && (kind === 'web_page' || kind === 'other') ? 'short_text' : kind;
}

/** Turns the model's reply into a brief. Anything missing or invalid falls back. */
export function parseQuickBrief(raw: string, copy: string): QuickBrief {
  const fallback = fallbackQuickBrief(copy);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanJsonResponse(raw));
  } catch {
    return fallback;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;

  const reportedLanguage = clean(parsed.language);
  const language = matchOption(reportedLanguage, QUICK_LANGUAGES);

  return {
    product: clean(parsed.product),
    audience: clean(parsed.audience),
    tone: matchOption(parsed.tone, QUICK_TONES) ?? fallback.tone,
    language: language ?? fallback.language,
    ...(reportedLanguage && !language ? { unsupportedLanguage: reportedLanguage } : {}),
    // "Social post" or "web-page" is read as the key it means.
    kind: kindForLength(
      getTextKind(clean(parsed.kind).toLowerCase().replace(/[\s-]+/g, '_'))?.key ?? fallback.kind,
      copy
    ),
    kindOther: '',
  };
}

export async function inferQuickBrief(copy: string, user: User, sessionId?: string): Promise<QuickBrief> {
  const text = (copy || '').trim().slice(0, BRIEF_MAX_INPUT_CHARS);
  if (!text) return fallbackQuickBrief(copy);

  try {
    const response = await makeApiRequestWithFallback(
      BRIEF_MODEL,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `The copy:\n\n"""\n${text}\n"""` },
      ],
      0.2,
      300,
      { type: 'json_object' },
      user.email,
      'quick_brief',
      sessionId
    );
    return parseQuickBrief(response.choices[0]?.message?.content ?? '', copy);
  } catch {
    return fallbackQuickBrief(copy);
  }
}
