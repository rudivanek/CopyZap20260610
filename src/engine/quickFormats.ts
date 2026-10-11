/**
 * Quick — "Turn it into…": the output formats.
 *
 * An ordinary run improves copy and gives back the same kind of text. A format
 * run writes another kind of text from it: the page is the source, an email
 * newsletter is the result. Everything a format needs is one entry in
 * QUICK_FORMATS, so a further format is a further entry plus test runs, not a
 * new build. The form, the writer, the result screen and the checks read the
 * entry; none of them knows a format by name.
 *
 * A format's text starts with its labelled lines (for an email: subject and
 * preview), then an empty line, then the body:
 *
 *   **Subject:** …
 *   **Preview:** …
 *
 *   The body, as markdown.
 *
 * It is one text on purpose: copying, editing by hand, changing by request,
 * scoring and History all handle a version as one text and need no change.
 *
 * Plain text handling in this file: no model call, no cost.
 */

export type QuickFormatKey = 'email_newsletter';

/** A labelled line a format's text starts with. */
export interface QuickFormatLine {
  key: string;
  /** As written in the text, always English: "Subject". */
  label: string;
  /** What the writer is told to put there. */
  brief: string;
  /** Longest sensible length in characters; a longer line is pointed out. */
  maxChars: number;
}

export interface QuickFormat {
  key: QuickFormatKey;
  /** On the form and in the result's first line: "Email newsletter". */
  label: string;
  /** In running text, after "a" or "the": "newsletter". */
  noun: string;
  /** More than one: "newsletters". */
  nounPlural: string;
  /** In front of a result's name: "Newsletter". */
  titlePrefix: string;
  /** One line under the choice on the form. */
  description: string;
  /** Words of the body: fewest, most, and the number the writer aims at. */
  minWords: number;
  maxWords: number;
  targetWords: number;
  /** Fewest words the source needs. Below it there is too little to write from without inventing. */
  minSourceWords: number;
  lines: QuickFormatLine[];
  /** What this format is, for the writer. Plain sentences, one rule per line. */
  writingRules: string[];
}

/** Longest "what should it be about?" the form accepts. */
export const QUICK_FOCUS_MAX_CHARS = 200;

export const QUICK_FORMATS: QuickFormat[] = [
  {
    key: 'email_newsletter',
    label: 'Email newsletter',
    noun: 'newsletter',
    nounPlural: 'newsletters',
    titlePrefix: 'Newsletter',
    description: 'A short email written from this copy: one topic, one action.',
    minWords: 150,
    maxWords: 350,
    targetWords: 250,
    minSourceWords: 100,
    lines: [
      {
        key: 'subject',
        label: 'Subject',
        brief: 'the subject line: 60 characters or fewer, specific to this email, no emoji, not in capitals',
        maxChars: 70,
      },
      {
        key: 'preview',
        label: 'Preview',
        brief:
          'the preview text an inbox shows after the subject: 40 to 110 characters that add something to the subject and do not repeat it',
        maxChars: 130,
      },
    ],
    writingRules: [
      'One topic and one main action. An email that covers everything on the page is skimmed and not acted on, so write about the focus you are given and leave the rest of the source out, however good it is.',
      'Open with the point. Do not call the email a newsletter, an edition or a bulletin, and do not announce what it contains.',
      'Short paragraphs. At most one short list and at most one sub-heading; neither is needed. No FAQ, no table, no row of links.',
      'End with the main action on a line of its own.',
      'No sign-off block, no postal address and no unsubscribe line: the email tool adds those.',
    ],
  },
];

/** The format with this key, or null: for a missing key, an ordinary run, or a key from a newer version. */
export function getQuickFormat(key: string | null | undefined): QuickFormat | null {
  return (key && QUICK_FORMATS.find(format => format.key === key)) || null;
}

/** The name of a result: the copy's own label, with the format in front of it for a format run. */
export function formatTitle(key: string | null | undefined, label: string): string {
  const format = getQuickFormat(key);
  return format ? `${format.titlePrefix}: ${label}` : label;
}

/**
 * What the rewrite step is told when a version of this format is changed by
 * request ("shorter", "warmer"). That step was built for pages: without this
 * it gives an email page headings and may drop its labelled lines.
 */
export function formatChangeInstructions(format: QuickFormat): string {
  const labels = format.lines.map(line => `"${line.label}:"`).join(' and ');
  return [
    `Kind of text: ${format.label}. It is not a web page.`,
    labels ? `Keep the ${labels} lines at the top, each on a line of its own, and change them only if the request is about them.` : '',
    `Keep it to one topic and one main action, and keep the body between ${format.minWords} and ${format.maxWords} words unless the request asks for another length.`,
    'Do not add section headings. Do not add facts, numbers, prices, dates or offers that are not already in the text.',
  ]
    .filter(Boolean)
    .join(' ');
}

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** The text of a labelled line: "**Subject:** text", "**Subject**: text" or "Subject: text". Null when the line is not that label's. */
function lineValue(line: string, label: string): string | null {
  const match = line.match(new RegExp(`^\\s*[*_]{0,2}${label}[*_]{0,2}\\s*:\\s*[*_]{0,2}\\s*(.*)$`, 'i'));
  return match ? match[1].trim() : null;
}

export interface QuickFormatParts {
  /** The labelled lines found at the top of the text, by key. */
  lines: Record<string, string>;
  /** Everything after them. */
  body: string;
}

/** Puts a format's parts together as the one text a version is. */
export function joinFormatText(format: QuickFormat, lines: Record<string, string>, body: string): string {
  const head = format.lines
    .map(line => ({ line, value: (lines[line.key] || '').replace(/\s+/g, ' ').trim() }))
    .filter(item => item.value)
    .map(item => `**${item.line.label}:** ${item.value}`);
  return [head.join('\n'), body.trim()].filter(Boolean).join('\n\n');
}

/** Reads a format's parts back out of a version's text. Lines that are missing are simply absent. */
export function splitFormatText(format: QuickFormat, text: string): QuickFormatParts {
  const all = (text || '').replace(/\r\n?/g, '\n').split('\n');
  const lines: Record<string, string> = {};
  let at = 0;
  // The labelled lines stand at the top, in any order, with empty lines allowed between them.
  while (at < all.length) {
    const current = all[at];
    if (!current.trim()) {
      at += 1;
      continue;
    }
    const found = format.lines.find(line => !(line.key in lines) && lineValue(current, line.label) !== null);
    if (!found) break;
    lines[found.key] = lineValue(current, found.label) as string;
    at += 1;
  }
  return { lines, body: all.slice(at).join('\n').trim() };
}

/** Words of the body: the labelled lines do not count. */
export function formatBodyWords(format: QuickFormat, text: string): number {
  return wordCount(splitFormatText(format, text).body);
}

/**
 * What to check in a version before it is used, as far as the format goes:
 * a labelled line that is missing or too long, a body outside the format's
 * length. Exact, in any language, no model call.
 */
export function checkFormatText(format: QuickFormat, text: string): string[] {
  const parts = splitFormatText(format, text);
  const notes: string[] = [];
  for (const line of format.lines) {
    const value = parts.lines[line.key];
    if (!value) {
      notes.push(`No ${line.label.toLowerCase()} line. Add one before you send it.`);
    } else if (value.length > line.maxChars) {
      notes.push(
        `The ${line.label.toLowerCase()} line has ${value.length} characters. Inboxes cut it off; keep it under ${line.maxChars}.`
      );
    }
  }
  const words = wordCount(parts.body);
  if (words > format.maxWords) {
    notes.push(
      `The body has ${words.toLocaleString('en-US')} words. A ${format.noun} works best at ${format.minWords} to ${format.maxWords}.`
    );
  } else if (words > 0 && words < format.minWords) {
    notes.push(
      `The body has ${words.toLocaleString('en-US')} words, short for a ${format.noun} (${format.minWords} to ${format.maxWords}).`
    );
  }
  return notes;
}
