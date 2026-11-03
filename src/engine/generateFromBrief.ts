/**
 * Quick — "Start from a brief": writes one finished piece of copy from the
 * brief the user filled in, so it can be handed to the normal Quick flow as if
 * the user had pasted it.
 *
 * One model call through the same ai-completion edge function the rest of the
 * engine uses. The edge function checks brief-mode access before it runs.
 */
import { GoalKey, Language, Tone, User } from '../types';
import { TextKindKey } from '../services/api/textKinds';
import { makeApiRequestWithFallback } from '../services/api/utils';
import briefPrompt from '../prompts/briefGenerate.md?raw';

export type BriefLength = 'short' | 'medium' | 'long';

export type BriefPieceKey =
  | 'homepage' | 'landing_page' | 'about_page' | 'service_page'
  | 'h1_headline' | 'usp' | 'slogan'
  | 'email' | 'newsletter'
  | 'social_post' | 'ad' | 'product_description' | 'other';

export type BriefPieceGroup = 'page' | 'short' | 'email' | 'post' | 'ad' | 'other';

export interface BriefPiece {
  key: BriefPieceKey;
  label: string;
  group: BriefPieceGroup;
  /** The Quick text kind this piece is scored as. */
  channel: TextKindKey;
  /** Default length for this piece. Pieces outside 'page' and 'email' have a fixed length. */
  defaultLength: BriefLength;
}

export const BRIEF_PIECES: BriefPiece[] = [
  { key: 'homepage',            label: 'Homepage',                  group: 'page',  channel: 'web_page',    defaultLength: 'long' },
  { key: 'landing_page',        label: 'Landing page',              group: 'page',  channel: 'web_page',    defaultLength: 'long' },
  { key: 'service_page',        label: 'Service or product page',   group: 'page',  channel: 'web_page',    defaultLength: 'long' },
  { key: 'about_page',          label: 'About page',                group: 'page',  channel: 'web_page',    defaultLength: 'medium' },
  { key: 'h1_headline',         label: 'H1 / headline',             group: 'short', channel: 'short_text',  defaultLength: 'short' },
  { key: 'usp',                 label: 'USP / value proposition',   group: 'short', channel: 'short_text',  defaultLength: 'short' },
  { key: 'slogan',              label: 'Slogan / tagline',          group: 'short', channel: 'short_text',  defaultLength: 'short' },
  { key: 'email',               label: 'Email',                     group: 'email', channel: 'email',       defaultLength: 'medium' },
  { key: 'newsletter',          label: 'Newsletter',                group: 'email', channel: 'email',       defaultLength: 'medium' },
  { key: 'social_post',         label: 'Social post',               group: 'post',  channel: 'social_post', defaultLength: 'short' },
  { key: 'ad',                  label: 'Ad',                        group: 'ad',    channel: 'ad',          defaultLength: 'short' },
  { key: 'product_description', label: 'Product description',       group: 'other', channel: 'other',       defaultLength: 'medium' },
  { key: 'other',               label: 'Other',                     group: 'other', channel: 'other',       defaultLength: 'medium' },
];

export function briefPiece(key: BriefPieceKey): BriefPiece {
  return BRIEF_PIECES.find(piece => piece.key === key) ?? BRIEF_PIECES[BRIEF_PIECES.length - 1];
}

export interface Brief {
  /** What the copy sells. */
  product: string;
  /** Who the copy is for. */
  audience: string;
  /** What the copy is meant to do. */
  goal: GoalKey;
  /** What the user needs written. */
  piece: BriefPieceKey;
  /** The tone to write in. */
  tone: Tone;
  /** Optional: what makes the business different (pages, USP, headline). */
  differentiators?: string;
  /** Optional: what the reader should do (pages, email, post, ad). */
  callToAction?: string;
  /** Optional: text read from the user's current website, used only as a source of facts. */
  siteFacts?: string;
  /** Optional proof or results the user gave. */
  proof?: string;
  /** Optional words or points that must appear. */
  mustInclude?: string;
  /** Optional words or points to avoid. */
  avoid?: string;
  /** Rough length. Defaults to medium. */
  length: BriefLength;
  /** Output language. */
  language: Language;
  /** For Spanish: address the reader as tú or usted. Undefined for other languages. */
  spanishForm?: 'tú' | 'usted';
}

export class BriefNotAvailableError extends Error {
  constructor() {
    super('This feature is not available on your account yet.');
    this.name = 'BriefNotAvailableError';
  }
}

const BRIEF_MODEL = 'claude-sonnet-4-6' as const;
const BRIEF_MAX_TOKENS = 3000;

const GOAL_NAMES: Record<GoalKey, string> = {
  convert: 'drive an action or a sale',
  nurture: 'keep a warm relationship with the reader',
  inform: 'announce or update',
  educate: 'teach or explain',
  brand: 'build brand awareness',
  custom: 'the goal stated in the brief',
};

function briefText(brief: Brief): string {
  const lines: string[] = [];
  lines.push(`What you are selling: ${brief.product}`);
  lines.push(`Who it is for: ${brief.audience}`);
  lines.push(`Goal: ${GOAL_NAMES[brief.goal] ?? brief.goal}`);
  lines.push(`What to write: ${briefPiece(brief.piece).label}`);
  lines.push(`Tone: ${brief.tone}`);
  if (brief.differentiators && brief.differentiators.trim()) lines.push(`What makes them different: ${brief.differentiators.trim()}`);
  if (brief.callToAction && brief.callToAction.trim()) lines.push(`What the reader should do: ${brief.callToAction.trim()}`);
  if (brief.proof && brief.proof.trim()) lines.push(`Proof or results: ${brief.proof.trim()}`);
  if (brief.mustInclude && brief.mustInclude.trim()) lines.push(`Must include: ${brief.mustInclude.trim()}`);
  if (brief.avoid && brief.avoid.trim()) lines.push(`Avoid: ${brief.avoid.trim()}`);
  lines.push(`Length: ${brief.length}`);
  if (brief.language === 'Spanish') {
    lines.push(`Language: Spanish, addressing the reader as ${brief.spanishForm ?? 'usted'}`);
  } else {
    lines.push(`Language: ${brief.language}`);
  }
  if (brief.siteFacts && brief.siteFacts.trim()) {
    lines.push('');
    lines.push('Text from their current website. Use it ONLY as a source of true facts (services, experience, location, clients, results). Do not copy its wording or structure.');
    lines.push('<website>');
    lines.push(brief.siteFacts.trim());
    lines.push('</website>');
  }
  return lines.join('\n');
}

/**
 * Writes one finished piece of copy from the brief. Throws BriefNotAvailableError
 * when the account is not allowed to use brief mode; throws Error on any other
 * failure.
 */
export async function generateFromBrief(brief: Brief, user: User, sessionId?: string): Promise<string> {
  let response;
  try {
    response = await makeApiRequestWithFallback(
      BRIEF_MODEL,
      [
        { role: 'system', content: briefPrompt },
        { role: 'user', content: briefText(brief) },
      ],
      0.7,
      BRIEF_MAX_TOKENS,
      undefined,
      user.email,
      'brief_generate',
      sessionId,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('BRIEF_MODE_NOT_AVAILABLE')) {
      throw new BriefNotAvailableError();
    }
    throw error;
  }
  const draft = (response.choices[0]?.message?.content ?? '').trim();
  if (!draft) throw new Error('No copy was written. Please try again.');
  return draft;
}

/** Cuts the website text to at most `maxWords` words, so the prompt stays small. */
export function trimSiteFacts(text: string, maxWords = 2500): string {
  const words = (text || '').split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? words.join(' ') : words.slice(0, maxWords).join(' ');
}
