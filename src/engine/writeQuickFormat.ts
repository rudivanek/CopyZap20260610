/**
 * Quick — "Turn it into…": the writer.
 *
 * Writes several versions of one format (see quickFormats.ts) from a source
 * text. It does not go through the Copy Maker engine: that engine improves
 * copy and is told to add fresh angles, which is right for a page and wrong
 * here, where the one firm rule is that nothing may be in the email that is
 * not in the source.
 *
 *   plan   one call: which different emails can be made from this source
 *          (a page with four offers gives up to three emails, one offer each)
 *   write  one call per version, in parallel, each with its own angle
 *
 * So writing three versions takes four calls. Both steps use the model the
 * other short Quick steps use (reading the copy, scoring): the calls are
 * ordinary requests and have to finish inside the 150-second limit.
 *
 * A failed plan is not a failed run: the versions are then told apart by how
 * they open, and each picks the source's main topic itself.
 */
import { v4 as uuidv4 } from 'uuid';
import { GeneratedContentItem, GeneratedContentItemType, GoalKey, Language, Tone, User } from '../types';
import { cleanJsonResponse, makeApiRequestWithFallback } from '../services/api/utils';
import { joinFormatText, QuickFormat, splitFormatText } from './quickFormats';
import { throwIfStopped } from './quickStop';

const FORMAT_MODEL = 'claude-sonnet-4-6';
/** Room for the plan: a few short lines per version. */
const PLAN_MAX_TOKENS = 700;
/** Tokens per word of output, generous for any supported language (see outputBudget.ts), plus room for the labelled lines. */
const TOKENS_PER_WORD = 3.6;
const FOCUS_MAX_CHARS = 200;
const NOTE_MAX_CHARS = 90;
/** A labelled line longer than this is cut: it is a line, not a paragraph. */
const LINE_MAX_CHARS = 300;

export interface QuickFormatBrief {
  product?: string;
  audience?: string;
  tone: Tone;
  language: Language;
}

export interface QuickFormatRequest {
  format: QuickFormat;
  /** The source: the copy the versions are written from. */
  source: string;
  goalKey: GoalKey;
  brief: QuickFormatBrief;
  /** What the user asked the versions to be about. Optional. */
  focus?: string;
  /** The page the source was fetched from: the address the main action links to. */
  pageUrl?: string;
  variants: number;
  sessionId: string;
  signal?: AbortSignal;
}

/** One planned version: what it is about, what it asks for, how it opens. */
export interface QuickAngle {
  focus: string;
  action: string;
  open: string;
}

const OPENINGS = ["the reader's situation or problem", 'the offer itself', 'a fact or a story from the source'];

/** What the goal of the form means for the text that is written. */
const GOAL_LINES: Record<string, string> = {
  convert: 'Its goal: get the reader to take the main action. Make that action specific and easy, without pressure the source does not justify.',
  nurture: 'Its goal: keep a warm relationship. Give the reader something useful; the action is a soft invitation.',
  inform: 'Its goal: announce or update. Say what is new and what it means for the reader; the action is where to find out more.',
  educate: 'Its goal: teach. Explain one idea from the source clearly; the action is the next step in learning.',
  brand: 'Its goal: build trust. Let the business speak in its own voice; the action is a low-key invitation.',
};

const clean = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

function parseJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(cleanJsonResponse(raw));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The angles used when the plan could not be made: no assigned topic, a different opening each. */
export function fallbackAngles(count: number): QuickAngle[] {
  return Array.from({ length: count }, (_, index) => ({ focus: '', action: '', open: OPENINGS[index % OPENINGS.length] }));
}

/** Turns the plan's reply into exactly `count` angles. Anything missing or invalid falls back. */
export function parseAngles(raw: string, count: number): QuickAngle[] {
  const fallback = fallbackAngles(count);
  const list = parseJson(raw)?.angles;
  if (!Array.isArray(list)) return fallback;
  const angles = list
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const entry = item as Record<string, unknown>;
      return { focus: clean(entry.focus, FOCUS_MAX_CHARS), action: clean(entry.action, FOCUS_MAX_CHARS), open: clean(entry.open, FOCUS_MAX_CHARS) };
    })
    .filter(angle => angle.focus);
  if (angles.length === 0) return fallback;
  // Fewer angles than versions: the remaining versions take the angles again, with another opening.
  return fallback.map((spare, index) => {
    const planned = angles[index % angles.length];
    const reused = index >= angles.length;
    return { focus: planned.focus, action: planned.action, open: reused || !planned.open ? spare.open : planned.open };
  });
}

function planPrompt(request: QuickFormatRequest): string {
  const { format, variants, focus } = request;
  return `You read a source text, a page or a piece of copy from a business, and plan ${variants} different ${format.nounPlural} that can be written from it. You do not write them. Reply with one JSON object and nothing else:

{
  "angles": [
    { "focus": "...", "action": "...", "open": "..." }
  ]
}

- "focus": the one thing this ${format.noun} is about, in 15 words or fewer: one offer, product, event or topic that the source itself presents.
- "action": the one thing the reader is asked to do about it, as the source puts it, in 10 words or fewer. An empty string when the source asks for nothing.
- "open": how the ${format.noun} starts. One of: ${OPENINGS.map(opening => `"${opening}"`).join(', ')}.

Rules:
- Give exactly ${variants} angles, and make them ${variants} different ${format.nounPlural}. When the source presents several offers or topics, give each angle a different one, the most important first. When it presents only one, keep that focus and vary "open".
${focus ? `- The sender wants the ${format.nounPlural} to be about this: "${focus}". Every angle stays on it. Vary which part of it leads, and vary "open".\n` : ''}- Use only what the source says. Do not invent offers, dates, prices or actions.
- Write "focus" and "action" in the language of the source.`;
}

/** One call: the different versions that can be made from this source. Never throws. */
export async function planQuickAngles(request: QuickFormatRequest, user: User): Promise<QuickAngle[]> {
  try {
    const response = await makeApiRequestWithFallback(
      FORMAT_MODEL,
      [
        { role: 'system', content: planPrompt(request) },
        { role: 'user', content: `The source:\n\n"""\n${request.source}\n"""` },
      ],
      0.2,
      PLAN_MAX_TOKENS,
      { type: 'json_object' },
      user.email,
      'quick_format_plan',
      request.sessionId
    );
    return parseAngles(response.choices[0]?.message?.content ?? '', request.variants);
  } catch {
    return fallbackAngles(request.variants);
  }
}

export function writePrompt(request: QuickFormatRequest): string {
  const { format, brief } = request;
  const layout = [...format.lines.map(line => `${line.label}: ${line.brief}`), '', `(the ${format.noun} itself, as markdown)`].join('\n');

  return `You write one ${format.label.toLowerCase()} from a source text. The source is a page or a piece of copy from a business; the ${format.noun} goes to that business's own readers.

Reply with the ${format.noun} and nothing else, in exactly this layout: each labelled line on a line of its own, then an empty line, then the body.

${layout}

What a ${format.noun} is:
${format.writingRules.map(rule => `- ${rule}`).join('\n')}
- The body has ${format.minWords} to ${format.maxWords} words; aim for about ${format.targetWords}. It is never longer than the source: when the source is short, write a shorter ${format.noun} and do not pad it.

The main action:
- Write it as a link when a page address is given to you: [the action in a few words](the address). Use that address exactly, and only once.
- When no address is given, write the action as one bold line. Never make up a web address, an email address or a phone number.

Facts:
- Use only what the source says. Every fact, number, price, date, name and offer in the ${format.noun} has to be in the source, with the same value. The business sends this to its own customers, and one invented detail is a promise it then has to keep or take back.
- Do not add urgency, discounts, deadlines, guarantees or results that the source does not state. Where the source lacks something a ${format.noun} would normally have, such as a date or a price, leave it out.
- Words a person said, such as a testimonial, may be used only word for word, in quotation marks, with the name as the source gives it. Otherwise leave them out.

Language and voice:
- Write in ${brief.language}, in a ${brief.tone.toLowerCase()} tone${brief.audience ? `, for this reader: ${brief.audience}` : ''}.
- Follow that language's own rules for capital letters and punctuation. In Spanish, French, Italian and Portuguese a subject line or a heading takes a capital only on its first word and on proper names.
- No emoji and no decorative symbols.`;
}

export function writeUserPrompt(request: QuickFormatRequest, angle: QuickAngle): string {
  const { format, brief, focus, pageUrl, source, goalKey } = request;
  // Without a plan the version has no assigned topic: it takes what the sender asked for, or picks the source's main one.
  const about = angle.focus
    ? angle.focus
    : focus
      ? focus
      : 'choose the most important offer or topic of the source, and stay on it.';
  const lines = [
    `What this ${format.noun} is about: ${about}`,
    angle.action ? `The one action the reader is asked to take: ${angle.action}` : '',
    `How it opens: with ${angle.open}.`,
    focus && angle.focus ? `The sender asked for it to be about: "${focus}". Stay within that.` : '',
    GOAL_LINES[goalKey] ?? '',
    brief.product ? `What the business sells: ${brief.product}` : '',
    pageUrl ? `The page address for the main action: ${pageUrl}` : 'No page address is given.',
  ].filter(Boolean);

  return `${lines.join('\n')}\n\nThe source:\n\n"""\n${source}\n"""`;
}

/** Turns the writer's reply into the one text a version is. Throws when there is no body. */
export function parseFormatReply(raw: string, format: QuickFormat): string {
  // A reply wrapped in a code fence (three backticks) is unwrapped first.
  const text = (raw || '').replace(/^\s*`{3}[a-z]*\s*/i, '').replace(/\s*`{3}\s*$/, '').trim();
  // A reply that came back as a JSON object after all, with the parts as its fields.
  if (text.startsWith('{')) {
    const parsed = parseJson(text);
    const body = parsed && typeof parsed.body === 'string' ? parsed.body.trim() : '';
    if (parsed && body) {
      const lines: Record<string, string> = {};
      for (const line of format.lines) lines[line.key] = clean(parsed[line.key] ?? parsed[line.label], LINE_MAX_CHARS);
      return joinFormatText(format, lines, body);
    }
  }
  const parts = splitFormatText(format, text);
  if (!parts.body) throw new Error('The reply had no text.');
  const lines: Record<string, string> = {};
  for (const line of format.lines) lines[line.key] = clean(parts.lines[line.key], LINE_MAX_CHARS);
  return joinFormatText(format, lines, parts.body);
}

async function writeOne(request: QuickFormatRequest, angle: QuickAngle, index: number, user: User): Promise<GeneratedContentItem> {
  const { format } = request;
  const response = await makeApiRequestWithFallback(
    FORMAT_MODEL,
    [
      { role: 'system', content: writePrompt(request) },
      { role: 'user', content: writeUserPrompt(request, angle) },
    ],
    0.5,
    Math.ceil(format.maxWords * TOKENS_PER_WORD) + 500,
    undefined,
    user.email,
    'quick_format_write',
    request.sessionId
  );
  const content = parseFormatReply(response.choices[0]?.message?.content ?? '', format);

  return {
    id: uuidv4(),
    type: GeneratedContentItemType.Improved,
    content,
    sourceText: request.source,
    generatedAt: new Date().toISOString(),
    sourceDisplayName: `${format.titlePrefix} ${index + 1}`,
    // Shown under the version's name: what this version is about.
    ...(angle.focus
      ? { sourceNote: angle.focus.length > NOTE_MAX_CHARS ? `${angle.focus.slice(0, NOTE_MAX_CHARS).trim()}…` : angle.focus }
      : {}),
    analysisMode: 'on_demand',
  };
}

/**
 * Plans and writes the versions. Returns the ones that succeeded, in order,
 * in the shape generateQuickVersions returns for an ordinary run.
 */
export async function writeQuickFormat(
  request: QuickFormatRequest,
  user: User,
  onProgress?: (done: number, total: number) => void
): Promise<{ items: GeneratedContentItem[]; failed: number; firstError?: string }> {
  const total = request.variants;
  let done = 0;
  onProgress?.(done, total);

  const angles = await planQuickAngles(request, user);
  throwIfStopped(request.signal);

  const settled = await Promise.allSettled(
    angles.map((angle, index) =>
      writeOne(request, angle, index, user).then(item => {
        done += 1;
        onProgress?.(done, total);
        return item;
      })
    )
  );

  const items: GeneratedContentItem[] = [];
  let firstError: string | undefined;
  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      items.push(outcome.value);
    } else if (!firstError) {
      firstError = outcome.reason instanceof Error && outcome.reason.message ? outcome.reason.message : 'A version could not be written.';
    }
  }
  return { items, failed: total - items.length, firstError };
}
