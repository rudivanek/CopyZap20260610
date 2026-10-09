/**
 * Quick — numbers a version adds or leaves out.
 *
 * A model asked to improve copy also changes its facts: it adds "more than 15
 * years", turns "$89" into "from $89", or drops the delivery time. The scorer
 * flags some of that as claims, but not reliably. Numbers can be compared
 * exactly, in any language, so Quick compares them itself:
 *
 *   checkNumbers(version, original) -> the numbers the version has that the
 *                                      original does not, and the numbers of
 *                                      the original the version leaves out
 *
 * A number counts as present when it appears as digits in any usual spelling
 * (1,200 = 1.200 = 1200, 3,5 = 3.5, 10K = 10,000, 28M = 28 millones) or, for
 * small numbers, as a word (five = 5, diez = 10). A number written only as a
 * word is never reported: words are too ambiguous ("once", "sei", "mil").
 *
 * Plain text handling: no model call, no cost. Nothing is stored; the screen
 * works it out from the two texts whenever a result is shown.
 */

export interface NumberFinding {
  /** The numbers as they are written, for example ["$12"] or ["3", "5"]. */
  numbers: string[];
  /** The sentence they stand in, shortened. */
  context: string;
}

export interface NumberCheck {
  /** In the version, not in the original. */
  added: NumberFinding[];
  /** In the original, not in the version. */
  dropped: NumberFinding[];
}

/** The longest context shown with a finding. */
const CONTEXT_MAX_CHARS = 110;

/** Small numbers as words, in the languages Quick writes. Used only to recognise a number, never to report one. */
const NUMBER_WORDS: [string, string][] = [
  ['1', 'one un una uno ein eine einen einem einer une um uma'],
  ['2', 'two dos zwei deux due dois duas'],
  ['3', 'three tres drei trois tre três'],
  ['4', 'four cuatro vier quatre quattro quatro'],
  ['5', 'five cinco fünf cinq cinque'],
  ['6', 'six seis sechs sei'],
  ['7', 'seven siete sieben sept sette sete'],
  ['8', 'eight ocho acht huit otto oito'],
  ['9', 'nine nueve neun neuf nove'],
  ['10', 'ten diez zehn dix dieci dez'],
  ['11', 'eleven once elf onze undici'],
  ['12', 'twelve doce zwölf douze dodici doze dozen docena dutzend douzaine dozzina dúzia'],
  ['15', 'fifteen quince fünfzehn quinze quindici'],
  ['20', 'twenty veinte zwanzig vingt venti vinte'],
  ['30', 'thirty treinta dreißig dreissig trente trenta trinta'],
  ['40', 'forty cuarenta vierzig quarante quaranta quarenta'],
  ['50', 'fifty cincuenta fünfzig cinquante cinquanta cinquenta'],
  ['60', 'sixty sesenta sechzig soixante sessanta sessenta'],
  ['100', 'hundred cien ciento hundert cent cento cem'],
  ['1000', 'thousand mil tausend mille'],
];
const WORD_VALUE = new Map<string, string>(
  NUMBER_WORDS.flatMap(([value, words]) => words.split(' ').map(word => [word, value] as [string, string]))
);

/** Words after a number that multiply it: "28 millones", "10 thousand". */
const THOUSAND_WORD = /^\s?(?:thousand|mil|tausend|mille|mila)(?![\p{L}])/iu;
const MILLION_WORD = /^\s?(?:millions?|millón|millones|millionen|million|mio|milioni|milione|milhão|milhões)(?![\p{L}])/iu;

interface NumberToken {
  /** As written, with its currency or percent sign. */
  display: string;
  /** Every value the token can stand for; the first one is the number itself. */
  keys: string[];
  line: number;
  /** Where it starts in its line. */
  at: number;
}

const blank = (length: number) => ' '.repeat(length);

/** Hides what looks like a number but is not a fact of the copy: list numbering, footnote marks, links, marker lines. */
function maskLine(line: string): string {
  return line
    .replace(/(?:https?:\/\/|www\.)\S+|\S+@\S+\.\S+/g, match => blank(match.length))
    .replace(/\[\[[^\]]*\]\]|\[(?:\\?\[)?\d{1,3}(?:\\?\])?\]/g, match => blank(match.length))
    .replace(/^(\s{0,3}(?:#{1,6}\s+)?(?:[-*+]\s+)?)(\d{1,3}[.)])(?=\s)/, (_, lead: string, mark: string) => lead + blank(mark.length));
}

/** "1,200" and "1.200" are 1200; "14.99" and "14,99" are 14.99; "442.167.1862" is three numbers. */
function valuesOf(raw: string): string[] {
  const clean = (whole: string, fraction = '') => {
    const integer = whole.replace(/^0+(?=\d)/, '');
    const rest = fraction.replace(/0+$/, '');
    return rest ? `${integer}.${rest}` : integer;
  };
  const groups = raw.split(/[.,]/);
  if (groups.length === 1) return [clean(groups[0])];

  const separators = raw.replace(/\d/g, '').split('');
  const head = groups[0];
  const tail = groups.slice(1);
  const allThrees = (items: string[]) => items.every(item => item.length === 3);
  const oneKind = (items: string[]) => new Set(items).size === 1;

  // Thousands: 1,200 · 62,170 · 1.200.000
  if (head.length <= 3 && !head.startsWith('0') && allThrees(tail) && oneKind(separators)) {
    return [clean(groups.join(''))];
  }
  // A decimal, with or without thousands in front: 14.99 · 3,5 · 0.125 · 1,234.56
  const middle = tail.slice(0, -1);
  const last = tail[tail.length - 1];
  const lastSeparator = separators[separators.length - 1];
  if (
    middle.length === 0 ||
    (head.length <= 3 && allThrees(middle) && oneKind(separators.slice(0, -1)) && lastSeparator !== separators[0])
  ) {
    return [clean(head + middle.join(''), last)];
  }
  // Anything else is a row of separate numbers: a phone number, a date.
  return groups.map(group => clean(group));
}

function scaled(value: string, factor: number): string {
  const result = Math.round(parseFloat(value) * factor * 1000) / 1000;
  return Number.isFinite(result) ? String(result) : value;
}

function numbersIn(text: string): { tokens: NumberToken[]; lines: string[] } {
  const lines = (text || '').replace(/\r\n?/g, '\n').split('\n');
  const tokens: NumberToken[] = [];

  lines.forEach((line, lineIndex) => {
    const masked = maskLine(line);
    for (const match of masked.matchAll(/(?<![\p{L}\p{N}_])\d+(?:[.,]\d+)*/gu)) {
      const raw = match[0];
      const at = match.index ?? 0;
      const before = masked.slice(0, at);
      const after = masked.slice(at + raw.length);
      const values = valuesOf(raw);

      // One written number, one value: it can carry a sign and a multiplier.
      if (values.length === 1) {
        const keys = [values[0]];
        let display = raw;
        const short = after.match(/^(?:[kK]|M{1,2})(?![\p{L}\p{N}])/u);
        if (short) {
          keys.push(scaled(values[0], /^k$/i.test(short[0]) ? 1000 : 1000000));
          display += short[0];
        } else if (THOUSAND_WORD.test(after)) {
          keys.push(scaled(values[0], 1000));
        } else if (MILLION_WORD.test(after)) {
          keys.push(scaled(values[0], 1000000));
        }
        const percent = after.slice(short ? short[0].length : 0).match(/^\s?%/);
        const currencyAfter = !short && after.match(/^\s?[€$£¥]/);
        const currencyBefore = before.match(/(?:US\$|[$€£¥])\s?$/);
        if (percent) display += '%';
        else if (currencyAfter) display += currencyAfter[0].trim();
        if (currencyBefore) display = currencyBefore[0].trim() + display;
        tokens.push({ display, keys, line: lineIndex, at });
      } else {
        // A row of numbers written with dots or commas: each one counts by itself.
        let offset = at;
        raw.split(/[.,]/).forEach((part, index) => {
          tokens.push({ display: part, keys: [values[index]], line: lineIndex, at: offset });
          offset += part.length + 1;
        });
      }
    }
  });

  return { tokens, lines };
}

/** The values of the number words in a text. */
function wordValuesIn(text: string): Set<string> {
  const values = new Set<string>();
  for (const match of (text || '').toLowerCase().matchAll(/\p{L}+/gu)) {
    const value = WORD_VALUE.get(match[0]);
    if (value) values.add(value);
  }
  return values;
}

/** Where the sentence around a position begins and ends, within one line. */
function sentenceBounds(line: string, at: number): [number, number] {
  let start = 0;
  let end = line.length;
  for (const match of line.matchAll(/[.!?…]["”»)]?\s+(?=[\p{Lu}\p{N}¿¡"“«($€£])/gu)) {
    const boundary = (match.index ?? 0) + match[0].length;
    if (boundary <= at) start = boundary;
    else {
      end = (match.index ?? 0) + match[0].trimEnd().length;
      break;
    }
  }
  return [start, end];
}

const plain = (text: string) =>
  text
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)+/, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** The sentence, cut to a readable length around the number it is shown for. */
function contextFor(sentence: string, display: string): string {
  const text = plain(sentence);
  if (text.length <= CONTEXT_MAX_CHARS) return text;
  const at = Math.max(0, text.indexOf(display));
  let from = Math.max(0, at - 45);
  let to = Math.min(text.length, from + CONTEXT_MAX_CHARS);
  if (to === text.length) from = Math.max(0, to - CONTEXT_MAX_CHARS);
  if (from > 0) from = text.indexOf(' ', from) + 1 || from;
  if (to < text.length) to = text.lastIndexOf(' ', to) > from ? text.lastIndexOf(' ', to) : to;
  return `${from > 0 ? '…' : ''}${text.slice(from, to).trim()}${to < text.length ? '…' : ''}`;
}

/** The tokens of one text that the other text does not have, one finding per sentence. */
function missingFrom(
  source: { tokens: NumberToken[]; lines: string[] },
  otherKeys: Set<string>,
  otherWords: Set<string>
): NumberFinding[] {
  const findings: (NumberFinding & { place: string })[] = [];
  const reported = new Set<string>();

  for (const token of source.tokens) {
    const known = token.keys.some(key => otherKeys.has(key) || otherWords.has(key));
    if (known || reported.has(token.keys[0])) continue;
    reported.add(token.keys[0]);

    const line = source.lines[token.line];
    const [start, end] = sentenceBounds(line, token.at);
    const place = `${token.line}:${start}`;
    const existing = findings.find(finding => finding.place === place);
    if (existing) {
      existing.numbers.push(token.display);
      continue;
    }
    let sentence = line.slice(start, end);
    // A fragment says too little: show the whole line instead.
    if (plain(sentence).length < 25) sentence = line;
    // A number on a line of its own (a counter): the next line says what it counts.
    if (plain(sentence).length < 12) {
      const next = source.lines.slice(token.line + 1).find(item => item.trim());
      if (next) sentence = `${sentence} ${next}`;
    }
    findings.push({ numbers: [token.display], context: contextFor(sentence, token.display), place });
  }

  return findings.map(({ numbers, context }) => ({ numbers, context }));
}

/**
 * The numbers that are stuck to a word. A fetched page often arrives with its
 * words run together ("Oct9Keeping TrackFriday"), and a version then writes
 * "Oct 9" properly. Such a number is not read as a number of its own (it could
 * be part of a name, like "B2B"), but it is there: it counts as present in the
 * text, so the other text is not reported for having it. Never reported itself.
 */
function gluedValuesIn(text: string): string[] {
  const values: string[] = [];
  for (const line of (text || '').replace(/\r\n?/g, '\n').split('\n')) {
    for (const match of maskLine(line).matchAll(/(?<=\p{L})\d+(?:[.,]\d+)*|\d+(?:[.,]\d+)*(?=\p{L})/gu)) {
      values.push(...valuesOf(match[0]));
    }
  }
  return values;
}

export function checkNumbers(versionText: string, originalText: string): NumberCheck {
  const version = numbersIn(versionText);
  const original = numbersIn(originalText);
  const keysOf = (tokens: NumberToken[], text: string) =>
    new Set([...tokens.flatMap(token => token.keys), ...gluedValuesIn(text)]);

  return {
    added: missingFrom(version, keysOf(original.tokens, originalText), wordValuesIn(originalText)),
    dropped: missingFrom(original, keysOf(version.tokens, versionText), wordValuesIn(versionText)),
  };
}
