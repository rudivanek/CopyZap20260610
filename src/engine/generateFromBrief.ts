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

export interface Brief {
  /** What the copy sells. */
  product: string;
  /** Who the copy is for. */
  audience: string;
  /** What the copy is meant to do. */
  goal: GoalKey;
  /** Where the copy will appear (the kind of text). */
  channel: TextKindKey;
  /** The tone to write in. */
  tone: Tone;
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
const BRIEF_MAX_TOKENS = 2000;

const CHANNEL_NAMES: Record<TextKindKey, string> = {
  web_page: 'a web page',
  short_text: 'a short text (headline, slogan or value proposition)',
  email: 'an email',
  social_post: 'a social post',
  ad: 'an ad',
  other: 'marketing copy',
};

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
  lines.push(`Where it will appear: ${CHANNEL_NAMES[brief.channel] ?? brief.channel}`);
  lines.push(`Tone: ${brief.tone}`);
  if (brief.proof && brief.proof.trim()) lines.push(`Proof or results: ${brief.proof.trim()}`);
  if (brief.mustInclude && brief.mustInclude.trim()) lines.push(`Must include: ${brief.mustInclude.trim()}`);
  if (brief.avoid && brief.avoid.trim()) lines.push(`Avoid: ${brief.avoid.trim()}`);
  lines.push(`Length: ${brief.length}`);
  if (brief.language === 'Spanish') {
    lines.push(`Language: Spanish, addressing the reader as ${brief.spanishForm ?? 'usted'}`);
  } else {
    lines.push(`Language: ${brief.language}`);
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
