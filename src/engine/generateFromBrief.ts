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
  | 'h1_headline' | 'usp' | 'slogan' | 'hero_section'
  | 'email' | 'newsletter'
  | 'social_post' | 'ad' | 'product_description' | 'blog_post' | 'other';

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
  { key: 'blog_post',           label: 'Blog post',                 group: 'page',  channel: 'web_page',    defaultLength: 'long' },
  { key: 'hero_section',        label: 'Hero section',              group: 'short', channel: 'short_text',  defaultLength: 'short' },
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

export type BriefSectionKey =
  | 'hero' | 'benefits' | 'how_it_works' | 'services' | 'what_you_get' | 'offer'
  | 'selected_work' | 'testimonials' | 'differentiator' | 'about' | 'story' | 'team'
  | 'faq' | 'final_cta' | 'intro' | 'main_points' | 'key_takeaways' | 'conclusion' | 'custom';

export interface BriefSectionOption {
  key: BriefSectionKey;
  label: string;
  /** True: written only when the brief or the website gives facts for it. */
  factsOnly: boolean;
  /** What the section must contain, sent to the writer. */
  note: string;
}

export const BRIEF_SECTION_OPTIONS: BriefSectionOption[] = [
  { key: 'hero', label: 'Hero', factsOnly: false, note: 'the # main headline (the main benefit, not the company name), a one- or two-sentence subline, then the call to action as a short line' },
  { key: 'benefits', label: 'Benefits', factsOnly: false, note: '3 to 6 benefits, as many as the facts support, each a short bold lead-in plus one or two sentences' },
  { key: 'how_it_works', label: 'How it works', factsOnly: false, note: 'the real steps from the brief or website, in their order and number; if none are given, 3 or 4 simple steps' },
  { key: 'services', label: 'Services', factsOnly: false, note: 'each service named in the brief or website, with one or two sentences; only services that are given' },
  { key: 'what_you_get', label: 'What you get', factsOnly: false, note: 'a bullet list of what the customer gets, only as given' },
  { key: 'offer', label: 'The offer', factsOnly: false, note: 'exactly what is offered and on what terms, only as given' },
  { key: 'selected_work', label: 'Selected work', factsOnly: true, note: 'the projects or clients named in the brief or website; when only their names are given, a short list of the names is enough — never invent what was done for them or what they said' },
  { key: 'testimonials', label: 'Testimonials', factsOnly: true, note: 'only quotes that appear word for word in the brief or website, with the name and company when given' },
  { key: 'differentiator', label: 'Why us', factsOnly: false, note: 'built on what makes them different, as stated in the brief; this is where a stance like "not the cheapest" belongs' },
  { key: 'about', label: 'About us', factsOnly: false, note: 'a short paragraph about the company, using only given facts' },
  { key: 'story', label: 'Our story', factsOnly: false, note: 'the story in short paragraphs, using only given facts' },
  { key: 'team', label: 'Team', factsOnly: true, note: 'the people, only with the names and roles given' },
  { key: 'faq', label: 'FAQ', factsOnly: true, note: '3 to 6 questions a buyer would ask, answered only with facts from the brief or website; leave out any question you cannot answer from them' },
  { key: 'final_cta', label: 'Final call to action', factsOnly: false, note: 'a heading and one or two sentences that end with the action' },
  { key: 'intro', label: 'Title and intro', factsOnly: false, note: 'the # title (with the main keyword when one is given), then an opening that starts with a concrete situation, question or problem the reader recognises — not a generic statement about the topic — and says what the post will give them' },
  { key: 'main_points', label: 'Main points', factsOnly: false, note: '4 to 7 sections, each with its own ## heading that states the point (use the main keyword or close variants in some headings); each gives concrete, practical advice — what to check, what to ask, what to avoid — with no padding paragraphs' },
  { key: 'key_takeaways', label: 'Key takeaways', factsOnly: false, note: 'a short bullet list that sums up the main points' },
  { key: 'conclusion', label: 'Conclusion', factsOnly: false, note: 'a short wrap-up under its own ## heading that leaves the reader with one clear next step' },
  { key: 'custom', label: 'Own section', factsOnly: false, note: 'write it as its heading says, using only given facts' },
];

export function briefSectionOption(key: BriefSectionKey): BriefSectionOption {
  return BRIEF_SECTION_OPTIONS.find(option => option.key === key) ?? BRIEF_SECTION_OPTIONS[BRIEF_SECTION_OPTIONS.length - 1];
}

export interface BriefSection {
  id: string;
  key: BriefSectionKey;
  /** The heading shown to the user; for 'custom', the user's own name for it. */
  label: string;
  /** Optional word count for this section. */
  words: number | null;
}

function newSection(key: BriefSectionKey, label?: string): BriefSection {
  return {
    id: `${key}-${Math.random().toString(36).slice(2, 9)}`,
    key,
    label: label ?? briefSectionOption(key).label,
    words: null,
  };
}

export function makeBriefSection(key: BriefSectionKey, label?: string): BriefSection {
  return newSection(key, label);
}

const DEFAULT_SECTIONS: Partial<Record<BriefPieceKey, BriefSectionKey[]>> = {
  homepage: ['hero', 'benefits', 'how_it_works', 'services', 'selected_work', 'testimonials', 'differentiator', 'faq', 'final_cta'],
  landing_page: ['hero', 'benefits', 'offer', 'how_it_works', 'testimonials', 'faq', 'final_cta'],
  service_page: ['hero', 'what_you_get', 'how_it_works', 'selected_work', 'testimonials', 'faq', 'final_cta'],
  about_page: ['hero', 'story', 'team', 'how_it_works', 'final_cta'],
  blog_post: ['intro', 'main_points', 'conclusion', 'final_cta'],
};

/** The suggested sections for a page; empty for anything that is not a page. */
export function defaultSectionsFor(piece: BriefPieceKey): BriefSection[] {
  return (DEFAULT_SECTIONS[piece] ?? []).map(key =>
    key === 'how_it_works' && piece === 'about_page' ? newSection(key, 'How we work') : newSection(key)
  );
}

const SUGGESTED_WORDS: Partial<Record<BriefPieceKey, number>> = {
  homepage: 1000,
  landing_page: 900,
  service_page: 800,
  about_page: 600,
  blog_post: 900,
};

/** The suggested length in words for a page; null for anything that is not a page. */
export function suggestedWordsFor(piece: BriefPieceKey): number | null {
  return SUGGESTED_WORDS[piece] ?? null;
}

export const BRIEF_MIN_WORDS = 150;
export const BRIEF_MAX_WORDS = 2500;

/** How much of a page each kind of section usually takes, relative to the others. */
const SECTION_WEIGHTS: Record<BriefSectionKey, number> = {
  hero: 6,
  benefits: 18,
  how_it_works: 16,
  services: 15,
  what_you_get: 14,
  offer: 12,
  selected_work: 8,
  testimonials: 12,
  differentiator: 11,
  about: 10,
  story: 20,
  team: 10,
  faq: 14,
  final_cta: 5,
  intro: 12,
  main_points: 70,
  key_takeaways: 8,
  conclusion: 8,
  custom: 10,
};
/**
 * A word count for every section: the user's own count where one is set, and
 * otherwise a share of what is left of the total, by the kind of section.
 * Rounded to tens, at least 20. All null when there is no total.
 */
export function suggestSectionWords(sections: BriefSection[], totalWords: number | null): (number | null)[] {
  if (!totalWords || totalWords <= 0) return sections.map(section => section.words ?? null);
  const fixed = sections.reduce((sum, section) => sum + (section.words ?? 0), 0);
  const remaining = Math.max(0, totalWords - fixed);
  const openWeight = sections.reduce((sum, section) => sum + (section.words ? 0 : SECTION_WEIGHTS[section.key] ?? 10), 0);
  return sections.map(section => {
    if (section.words) return section.words;
    if (openWeight === 0) return null;
    const share = (remaining * (SECTION_WEIGHTS[section.key] ?? 10)) / openWeight;
    return Math.max(20, Math.round(share / 10) * 10);
  });
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
  /** Pages only: the sections to write, in this order. */
  sections?: BriefSection[];
  /** Pages only: the target length in words. */
  targetWords?: number;
  /** Blog posts: the topic or title idea. */
  topic?: string;
  /** Blog posts: the main search keyword, if the user has one. */
  keyword?: string;
  /** Output language. */
  language: Language;
  /** For Spanish: address the reader as tú or usted. Undefined for other languages. */
  spanishForm?: 'tú' | 'usted';
  /** Optional: the company's own experience, opinion or lesson, stated once in the body in its voice. */
  experience?: string;
  /** Optional: what the customer has after buying (the main result). */
  result?: string;
  /** Optional: who customers compare the company with, and why they choose it. */
  alternatives?: string;
  /** Optional: the country whose readers the copy is for; sets vocabulary, spelling, currency and dates. */
  country?: string;
  /** Optional: address the reader formally or informally, for any language that has both. */
  formality?: 'formal' | 'informal';
  /**
   * Optional: answers that were read from the website and not confirmed by the
   * user (Brief (2), "Already understood" left as it was). They are marked in
   * the brief, so the user's own answers win when the two disagree.
   */
  fromWebsite?: ('proof' | 'experience' | 'differentiators' | 'result' | 'alternatives')[];
}

export class BriefNotAvailableError extends Error {
  constructor() {
    super('This feature is not available on your account yet.');
    this.name = 'BriefNotAvailableError';
  }
}

const BRIEF_MODEL = 'claude-sonnet-4-6' as const;
const BRIEF_MAX_TOKENS = 3000;
/** Room for a long page: about 2.5 tokens per word, capped. */
function maxTokensFor(brief: Brief): number {
  if (briefPiece(brief.piece).group !== 'page' || !brief.targetWords) return BRIEF_MAX_TOKENS;
  return Math.min(8000, Math.max(BRIEF_MAX_TOKENS, Math.round(brief.targetWords * 2.5)));
}

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
  const read = (key: NonNullable<Brief['fromWebsite']>[number]) =>
    brief.fromWebsite?.includes(key) ? ' (read from their website, not confirmed by them)' : '';
  lines.push(`What you are selling: ${brief.product}`);
  if (brief.result && brief.result.trim()) lines.push(`What the customer gets (the main result)${read('result')}: ${brief.result.trim()}`);
  if (brief.alternatives && brief.alternatives.trim()) lines.push(`Who customers compare them with, and why they choose them${read('alternatives')}: ${brief.alternatives.trim()}`);
  lines.push(`Who it is for: ${brief.audience}`);
  lines.push(`Goal: ${GOAL_NAMES[brief.goal] ?? brief.goal}`);
  lines.push(`What to write: ${briefPiece(brief.piece).label}`);
  if (brief.topic && brief.topic.trim()) lines.push(`Topic or title idea: ${brief.topic.trim()}`);
  if (brief.keyword && brief.keyword.trim()) lines.push(`Main keyword: ${brief.keyword.trim()}`);
  lines.push(`Tone: ${brief.tone}`);
  if (brief.differentiators && brief.differentiators.trim()) lines.push(`What makes them different${read('differentiators')}: ${brief.differentiators.trim()}`);
  if (brief.callToAction && brief.callToAction.trim()) lines.push(`What the reader should do: ${brief.callToAction.trim()}`);
  if (brief.proof && brief.proof.trim()) lines.push(`Proof or results${read('proof')}: ${brief.proof.trim()}`);
  if (brief.experience && brief.experience.trim()) {
    lines.push(`The company's own experience or view${read('experience')} (must appear once in the body, said by the company, with the same meaning — not softened, not turned into general advice): ${brief.experience.trim()}`);
  }
  if (brief.mustInclude && brief.mustInclude.trim()) lines.push(`Must include: ${brief.mustInclude.trim()}`);
  if (brief.avoid && brief.avoid.trim()) lines.push(`Avoid: ${brief.avoid.trim()}`);
  const isPage = briefPiece(brief.piece).group === 'page';
  // Pages, emails and the other longer pieces keep the length the user asked
  // for (2026-11-05: an email asked at "about 120 words" came back at 223,
  // because only "Length: medium" reached the writer).
  const takesTarget = isPage || ['email', 'other'].includes(briefPiece(brief.piece).group);
  if (takesTarget && brief.targetWords) {
    lines.push(`Target length: about ${brief.targetWords} words`);
  } else {
    lines.push(`Length: ${brief.length}`);
  }
  if (isPage && brief.sections && brief.sections.length > 0) {
    lines.push('Sections, in this order:');
    brief.sections.forEach((section, index) => {
      const option = briefSectionOption(section.key);
      const words = section.words ? ` — about ${section.words} words` : '';
      const factsOnly = option.factsOnly ? ' — only if facts exist' : '';
      lines.push(`${index + 1}. ${section.label}${words}${factsOnly}: ${option.note}`);
    });
  }
  const place = brief.country && brief.country.trim()
    ? ` as written in ${brief.country.trim()} (use that country's vocabulary, spelling, currency and date formats)`
    : '';
  if (brief.formality) {
    const form = brief.formality === 'formal' ? 'formally (for example usted, Sie, vous)' : 'informally (for example tú, du, tu)';
    lines.push(`Language: ${brief.language}${place}, addressing the reader ${form} in every sentence`);
  } else if (brief.language === 'Spanish') {
    lines.push(`Language: Spanish${place}, addressing the reader as ${brief.spanishForm ?? 'usted'}`);
  } else {
    lines.push(`Language: ${brief.language}${place}`);
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
      maxTokensFor(brief),
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

const SHAPE_NOTES: Partial<Record<BriefPieceKey, string>> = {
  hero_section:
    'This text is a hero section. Keep its shape: a # headline of under 10 words, a subline of one or two sentences, 3 short bullet points, then the call to action as a button label of 2 to 5 words on its own last line.',
  usp: 'This text is a value proposition. Keep its shape: one main sentence of under 25 words, then 3 short bullet points.',
  h1_headline: 'This text is one headline of under 12 words. Keep it one headline.',
  slogan: 'This text is one slogan of under 8 words. Keep it one slogan.',
};

/**
 * For short texts written from a brief: the shape the improve step must keep.
 * Quick's own rule for short texts says "one statement, no list", which would
 * strip a USP's bullets. Empty for pages and anything else.
 */
export function briefShapeNote(piece: BriefPieceKey): string {
  return SHAPE_NOTES[piece] ?? '';
}

/** Cuts the website text to at most `maxWords` words, so the prompt stays small. */
export function trimSiteFacts(text: string, maxWords = 2500): string {
  const words = (text || '').split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? words.join(' ') : words.slice(0, maxWords).join(' ');
}

/**
 * A blog post starts with a line "Meta description: …". The line is taken off
 * the draft (so it is not scored or rewritten as body copy) and returned on its own.
 */
export function splitMetaDescription(text: string): { draft: string; metaDescription?: string } {
  const lines = (text || '').replace(/\r\n?/g, '\n').split('\n');
  const index = lines.findIndex(line => line.trim() !== '');
  if (index === -1) return { draft: text };
  const match = lines[index].trim().match(/^\**\s*meta(?:\s|-)?description\s*\**\s*[:\-–—]\s*\**\s*(.+?)\s*\**$/i);
  if (!match) return { draft: text };
  const metaDescription = match[1].replace(/^["“]|["”]$/g, '').trim();
  const draft = lines.slice(index + 1).join('\n').replace(/^\s+/, '');
  return metaDescription ? { draft, metaDescription } : { draft: text };
}
