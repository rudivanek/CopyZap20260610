/**
 * Quick — "Turn it into…": the writer.
 *
 * Writes several versions of one format (see quickFormats.ts) from a source
 * text. It does not go through the Copy Maker engine: that engine improves
 * copy and is told to add fresh angles, which is right for a page and wrong
 * here, where the one firm rule is that nothing may be in the email that is
 * not in the source.
 *
 *   plan   one call: how the versions of this one email will differ. Every
 *          version covers the same thing: what the source covers, or what the
 *          user asked for. Each gets its own angle and its own opening.
 *   write  one call per version, in parallel, each with its own angle
 *
 * The versions are alternatives to each other: the user compares them and
 * sends one. So they must never differ in what they are about. (Until
 * 2026-10-11 a page with several offers gave one email per offer. Three emails
 * about three products cannot be compared, and the user had asked for no
 * split; that rule was removed.)
 *
 * So writing three versions takes four calls. Both steps use the model the
 * other short Quick steps use (reading the copy, scoring): the calls are
 * ordinary requests and have to finish inside the 150-second limit.
 *
 * A failed plan is not a failed run: the versions are then told apart only by
 * how they open.
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

/**
 * One planned version: the idea it is built around and how it opens. Not what
 * it covers and not what it asks the reader to do: those are the same for all
 * versions, and the writer takes them from the source.
 */
export interface QuickAngle {
  angle: string;
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

/** The angles used when the plan could not be made: no angle, a different opening each. */
export function fallbackAngles(count: number): QuickAngle[] {
  return Array.from({ length: count }, (_, index) => ({ angle: '', open: OPENINGS[index % OPENINGS.length] }));
}

/** A value as the model wrote it, without the quotation marks, comma or emphasis marks around it. */
function planValue(text: string): string {
  let value = text.trim().replace(/,\s*$/, '').trim();
  value = value.replace(/^\*{1,2}(.*)\*{1,2}$/, '$1').trim();
  if (/^["“«].*["”»]$/.test(value) && value.length >= 2) value = value.slice(1, -1).trim();
  return /^(none|n\/a|-|—|\(none\)|\(empty\))$/i.test(value) ? '' : value;
}

/**
 * Reads the plan line by line: "ANGLE: …", "OPEN: …", a new ANGLE line starting
 * the next version. It also reads the same two keys written as JSON with one
 * key per line, valid or not. Any other line is passed over.
 */
function anglesFromLines(raw: string): QuickAngle[] {
  const angles: QuickAngle[] = [];
  for (const line of (raw || '').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:[-*•]|\d+[.)])?\s*["*_]*\s*(angle|open)\s*["*_]*\s*:\s*[*_]{0,2}\s*(.*)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase() as keyof QuickAngle;
    const value = clean(planValue(match[2]), FOCUS_MAX_CHARS);
    if (key === 'angle') angles.push({ angle: value, open: '' });
    else if (angles.length > 0 && !angles[angles.length - 1][key]) angles[angles.length - 1][key] = value;
  }
  return angles;
}

/** Turns the plan's reply into exactly `count` angles. Anything missing or invalid falls back. */
export function parseAngles(raw: string, count: number): QuickAngle[] {
  const fallback = fallbackAngles(count);
  // A reply that came back as a valid JSON object after all is read as one.
  const list = parseJson(raw)?.angles;
  const read: QuickAngle[] = Array.isArray(list)
    ? list
        .filter(item => item && typeof item === 'object')
        .map(item => {
          const entry = item as Record<string, unknown>;
          return { angle: clean(entry.angle, FOCUS_MAX_CHARS), open: clean(entry.open, FOCUS_MAX_CHARS) };
        })
    : anglesFromLines(raw);
  const angles = read.filter(item => item.angle);
  if (angles.length === 0) return fallback;
  // Fewer angles than versions: the remaining versions take the angles again, with another opening.
  return fallback.map((spare, index) => {
    const planned = angles[index % angles.length];
    const reused = index >= angles.length;
    return { angle: planned.angle, open: reused || !planned.open ? spare.open : planned.open };
  });
}

/** What every version covers: what the user asked for, or else what the source covers. */
function coverage(request: QuickFormatRequest): string {
  return request.focus
    ? `what the sender asked for: "${request.focus}"`
    : 'what the source covers: all of its main offers or topics together, as the source presents them';
}

/**
 * The plan is asked for as plain lines, not as JSON. Asked for JSON, the model
 * wrote a name from the page in quotation marks inside a value without escaping
 * them ("focus": "Diplomado "Humanismo y Sentido": …"). That is not valid JSON,
 * so the whole plan was dropped and the versions came out nearly identical
 * (first live run, 2026-10-10). Plain lines have nothing to escape.
 */
function planPrompt(request: QuickFormatRequest): string {
  const { format, variants } = request;
  return `You read a source text, a page or a piece of copy from a business, and plan ${variants} versions of one ${format.noun} that will be written from it. You do not write them.

Every version covers the same thing: ${coverage(request)}. The versions are alternatives to each other: the sender compares them and sends one. So they differ in how they are written, never in what they are about.

Reply with the plan and nothing else, as plain text: two lines for each version and an empty line between versions, in exactly this layout.

ANGLE: the idea this version leads with and is built around, in 15 words or fewer: a way of presenting the whole subject, taken from the source
OPEN: how this version starts, one of: ${OPENINGS.join(' / ')}

Rules:
- Give exactly ${variants} versions. Make the ${variants} angles clearly different from each other, and vary OPEN.
- Do not give each version its own offer, product or topic. When the source presents several, every version presents all of them, and an angle is a way of looking at all of them together: for example who each one is for, what they have in common, or the reason to care now.
- Use only what the source says. Do not invent offers, dates or prices.
- Write what follows ANGLE in the language of the source. Keep the two labels and the OPEN choices exactly as given here.`;
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
      undefined,
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
- It is the one thing the source asks its reader to do about what this ${format.noun} covers, in the source's own words where it has them. When the ${format.noun} covers several offers, the action leads to all of them and not to one.
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
  const lines = [
    `What this ${format.noun} covers: ${coverage(request)}.`,
    focus
      ? 'Stay within that.'
      : 'When the source presents several offers or topics, present them together, each one briefly; do not pick one and leave the others out.',
    angle.angle ? `The angle of this version: ${angle.angle}` : '',
    `How it opens: with ${angle.open}.`,
    `Other versions of this same ${format.noun} are being written with other angles and other openings, and the sender will choose between them. Follow your angle and your opening closely, in the subject line too, so that the versions differ in how they are written and not in what they cover.`,
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
