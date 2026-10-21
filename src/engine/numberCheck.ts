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
  ['13', 'thirteen trece treize tredici treze'],
  ['14', 'fourteen catorce quatorze quattordici'],
  ['15', 'fifteen quince fünfzehn quinze quindici'],
  ['16', 'sixteen dieciséis dieciseis seize sedici dezesseis'],
  ['17', 'seventeen diecisiete diciassette dezessete'],
  ['18', 'eighteen dieciocho diciotto dezoito'],
  ['19', 'nineteen diecinueve diciannove dezenove'],
  ['20', 'twenty veinte zwanzig vingt venti vinte'],
  ['21', 'veintiuno veintiún veintiun veintiuna ventuno'],
  ['22', 'veintidós veintidos'],
  ['23', 'veintitrés veintitres'],
  ['24', 'veinticuatro'],
  ['25', 'veinticinco'],
  ['26', 'veintiséis veintiseis'],
  ['27', 'veintisiete'],
  ['28', 'veintiocho'],
  ['29', 'veintinueve'],
  ['30', 'thirty treinta dreißig dreissig trente trenta trinta'],
  ['40', 'forty cuarenta vierzig quarante quaranta quarenta'],
  ['50', 'fifty cincuenta fünfzig cinquante cinquanta cinquenta'],
  ['60', 'sixty sesenta sechzig soixante sessanta sessenta'],
  ['70', 'seventy setenta siebzig settanta'],
  ['80', 'eighty ochenta achtzig ottanta oitenta'],
  ['90', 'ninety noventa neunzig novanta'],
  ['100', 'hundred cien ciento hundert cent cento cem'],
  ['1000', 'thousand mil tausend mille'],
];
const WORD_VALUE = new Map<string, string>(
  NUMBER_WORDS.flatMap(([value, words]) => words.split(' ').map(word => [word, value] as [string, string]))
);
/** English tens and units written together: "twenty-one", "forty five". */
const TENS_AND_UNIT = /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[-\s](one|two|three|four|five|six|seven|eight|nine)\b/giu;
/** Spanish tens and units: "treinta y cinco". */
const TENS_Y_UNIT = /(?<![\p{L}])(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\s+y\s+(uno|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)(?![\p{L}])/giu;

/** Words after a number that make it a percentage: "50%", "50 por ciento", "50 percent". */
const PERCENT_AFTER = /^\s?(?:%|por\s?ciento|per\s?cent|percent|pour\s?cent|prozent|per\s?cento|por\s?cento)(?![\p{L}])/iu;

/**
 * A line that is only a copyright notice ("© 2021 Todos los derechos
 * reservados…"): its year is not a fact of the copy (Grok, 2026-10-20).
 */
const COPYRIGHT_LINE = /©|\(c\)\s*\d{4}|copyright|all rights reserved|derechos reservados|tous droits réservés|alle rechte vorbehalten/i;

/** A date written with digits: 13/10/2026, 13.10.2026, 2026-10-13, 10/13/26. */
const DIGIT_DATE = /(?<![\p{L}\p{N}/.-])(?:\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})|\d{4}-\d{1,2}-\d{1,2})(?![\p{N}/]|[.-]\d)/gu;

/**
 * A phone number: "+52 442 456 0288", "(205) 555-0134", "442.167.1862",
 * "555-0134". Read as one number, compared on its digits, so a version that
 * writes it differently still has it, and one that drops it shows it once
 * rather than in pieces (Grok, 2026-10-20: "52, 442, 456, 0288").
 */
const PHONE = /(?<![\p{L}\p{N}+])(?:\+\s?\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d{2,4}(?:[\s.-]\d{2,5}){1,4}(?![\p{N}]|[.,]\d)/gu;
const PHONE_WORDS = /tel|phone|call|llam|whats|móvil|movil|celular|fax|cel\b|contact/i;

/** Words after a number that multiply it: "28 millones", "10 thousand". */
const THOUSAND_WORD = /^\s?(?:thousand|mil|tausend|mille|mila)(?![\p{L}])/iu;
const MILLION_WORD = /^\s?(?:millions?|millón|millones|millionen|million|mio|milioni|milione|milhão|milhões)(?![\p{L}])/iu;

interface NumberToken {
  /** As written, with its currency or percent sign. */
  display: string;
  /** Every value the token can stand for; the first one is the number itself. */
  keys: string[];
  /**
   * Values that count as present in this text because of this token, but are
   * not enough for the token itself: "50%" makes a plain 50 present, while a
   * plain "50 idiomas" does not make "50%" present.
   */
  alsoCounts?: string[];
  /** For a date: the day and the year, enough when the other text writes the month as a word. */
  dateParts?: [string, string];
  line: number;
  /** Where it starts in its line. */
  at: number;
}

const blank = (length: number) => ' '.repeat(length);

/** A list number at the start of a line: "3. ", "3) ", "3\\. " (as a fetched page writes it), also in bold or after a heading mark. */
const LIST_NUMBER = /^(\s{0,3}(?:#{1,6}\s+)?(?:[-*+]\s+)?(?:\*{1,2}|_{1,2})?)(\d{1,3}\\?[.)])(?=[\s*_])/;

/**
 * Hides what looks like a number but is not a fact of the copy: list
 * numbering, footnote marks, links, marker lines; and, since 2026-10-19, page
 * leftovers that kept showing as "missing" on fetched pages: list numbers the
 * fetch wrote as "06\\. Vestavia Hills", step labels ("05 · They keep it",
 * "01 Paste02 Web address"), the minutes of a time ("10:55am"), file sizes
 * ("1.86 MB") and calendar grids ("2829301234 567891011").
 * Since 2026-10-20 (numbersIn): copyright lines and lines that are only a
 * date are skipped; dates and phone numbers are read whole; a percentage only
 * counts as kept when the other text has the same percentage.
 */
function maskLine(line: string): string {
  return line
    .replace(/(?:https?:\/\/|www\.)\S+|\S+@\S+\.\S+/g, match => blank(match.length))
    .replace(/\[\[[^\]]*\]\]|\[(?:\\?\[)?\d{1,3}(?:\\?\])?\]/g, match => blank(match.length))
    .replace(LIST_NUMBER, (_, lead: string, mark: string) => lead + blank(mark.length))
    // A step label: "05 · They keep it" at the start of a line, or a zero-padded "01".."09" anywhere.
    .replace(/^(\s{0,3})(\d{1,2}\s?[·•|]\s)/, (_, lead: string, mark: string) => lead + blank(mark.length))
    .replace(/(?<![\d.,:/-])0\d(?![\d.,:/-]?\d)/g, match => blank(match.length))
    // The minutes of a time: "10:55" counts as the hour only.
    .replace(/(?<=\b\d{1,2}):\d{2}\b/g, match => blank(match.length))
    // A file size: "1.86 MB", "640KB".
    .replace(/\d+(?:[.,]\d+)?\s?(?:KB|MB|GB|kB)\b/g, match => blank(match.length))
    // A calendar grid: day numbers run together ("567891011", "2829301234").
    .replace(/\d{6,}/g, match => (isDayRun(match) ? blank(match.length) : match));
}

/** True when the digits are day numbers written one after another (28 29 30 1 2 …), at least four of them. */
function isDayRun(digits: string): boolean {
  const walk = (at: number, previous: number, count: number): boolean => {
    if (at === digits.length) return count >= 4;
    for (const size of [1, 2]) {
      const part = digits.slice(at, at + size);
      if (part.length < size || part.startsWith('0')) continue;
      const value = Number(part);
      const follows = previous === 0 || value === previous + 1 || (value === 1 && previous >= 28);
      if (value >= 1 && value <= 31 && follows && walk(at + size, value, count + 1)) return true;
    }
    return false;
  };
  return walk(0, 0, 0);
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

/** A phone number compared on its last ten digits, so "+52 442 456 0288" and "442 456 0288" match. */
function phoneKey(digits: string): string {
  return `tel:${digits.slice(-10)}`;
}

/** True when a line holds a date and nothing else (markdown and a time allowed). */
function isDateOnlyLine(line: string): boolean {
  if (!line.match(DIGIT_DATE)) return false;
  const rest = line.replace(DIGIT_DATE, '').replace(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)?\b/gi, '');
  return !/[\p{L}\p{N}]/u.test(rest.replace(/[*_#>|-]/g, ''));
}

function numbersIn(text: string): { tokens: NumberToken[]; lines: string[] } {
  const lines = (text || '').replace(/\r\n?/g, '\n').split('\n');
  const tokens: NumberToken[] = [];

  lines.forEach((line, lineIndex) => {
    // A copyright line and a line that is only a date (the date of an article
    // in a list) say nothing a reader acts on.
    if (COPYRIGHT_LINE.test(line) && line.length < 200) return;
    let masked = maskLine(line);
    if (isDateOnlyLine(masked)) return;
    // Dates and phone numbers: one token each, then hidden from the number search.
    masked = masked.replace(DIGIT_DATE, (date, at: number) => {
      const parts = date.split(/[/.-]/).map(part => part.replace(/^0+(?=\d)/, ''));
      const [day, year] = parts[0].length === 4 ? [parts[2], parts[0]] : [parts[0], parts[2]];
      tokens.push({ display: date, keys: [`date:${parts.join('-')}`], dateParts: [day, year], line: lineIndex, at });
      return blank(date.length);
    });
    masked = masked.replace(PHONE, (phone, at: number) => {
      const digits = phone.replace(/\D/g, '');
      const groups = phone.trim().split(/[\s.()-]+/).filter(Boolean).length;
      const looksLikePhone =
        digits.length >= 7 &&
        digits.length <= 15 &&
        groups >= 2 &&
        (/^\s?[+(]/.test(phone) || digits.length >= 10 || PHONE_WORDS.test(line));
      if (!looksLikePhone) return phone;
      tokens.push({ display: phone.trim(), keys: [phoneKey(digits)], line: lineIndex, at });
      return blank(phone.length);
    });
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
        const percent = after.slice(short ? short[0].length : 0).match(PERCENT_AFTER);
        const currencyAfter = !short && after.match(/^\s?[€$£¥]/);
        const currencyBefore = before.match(/(?:US\$|[$€£¥])\s?$/);
        if (percent) display += '%';
        else if (currencyAfter) display += currencyAfter[0].trim();
        if (currencyBefore) display = currencyBefore[0].trim() + display;
        // A percentage is its own fact: "50% de descuento" is not kept by "50 idiomas".
        if (percent) {
          tokens.push({ display, keys: [`${values[0]}%`], alsoCounts: [values[0]], line: lineIndex, at });
        } else {
          tokens.push({ display, keys, line: lineIndex, at });
        }
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
  const lower = (text || '').toLowerCase();
  for (const match of lower.matchAll(/\p{L}+/gu)) {
    const value = WORD_VALUE.get(match[0]);
    if (value) values.add(value);
  }
  for (const match of [...lower.matchAll(TENS_AND_UNIT), ...lower.matchAll(TENS_Y_UNIT)]) {
    const tens = Number(WORD_VALUE.get(match[1]));
    const unit = Number(WORD_VALUE.get(match[2]));
    if (tens && unit) values.add(String(tens + unit));
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
    const known =
      token.keys.some(key => otherKeys.has(key) || otherWords.has(key)) ||
      (token.dateParts !== undefined && token.dateParts.every(part => otherKeys.has(part)));
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

/**
 * The numbers of a numbered list. Never reported, but they count as present:
 * a list of seven steps in the original backs "7 steps" in a version.
 */
function listValuesIn(text: string): string[] {
  const values: string[] = [];
  for (const line of (text || '').replace(/\r\n?/g, '\n').split('\n')) {
    const match = LIST_NUMBER.exec(line);
    if (match) values.push(String(Number(match[2].replace(/\D/g, ''))));
  }
  return values;
}

/**
 * Numbers a version strengthens with a prefix the source does not use for that
 * number: "over 500" when the source says only "500", "more than 200" when the
 * source says "200", "at least 50" when the source says "50", "100+" when the
 * source says "100". Only the upgrade prefixes "over", "more than", "at least"
 * and a "+" suffix are checked — these make a number larger or a floor, so a
 * version that adds them states more than the source. The prefix is allowed
 * when a source passage has the same prefix phrase (or the same "+") for the
 * same number.
 *
 * Each finding's "numbers" field holds the prefix + number as written in the
 * version, so stripStrengtheners can drop the prefix and keep the number.
 */
const UPGRADE_PREFIX = /(over|more\s+than|at\s+least)\s+$/i;

export function strengthenedNumbers(versionText: string, sourceText: string): NumberFinding[] {
  const version = numbersIn(versionText);
  const source = numbersIn(sourceText);
  const findings: (NumberFinding & { place: string })[] = [];
  const reported = new Set<string>();

  // For each number value in the source, collect the same upgrade prefix phrase
  // (and a "+") when the source uses it before that number, so "over 200" in the
  // source allows "over 200" in the version.
  const sourcePrefixByValue = new Map<string, Set<string>>();
  for (const token of source.tokens) {
    const line = source.lines[token.line];
    const before = line.slice(0, token.at);
    const after = line.slice(token.at + token.display.length);
    const prefixPhrase = before.match(UPGRADE_PREFIX);
    const plusSuffix = /^\+/.test(after);
    const sourcePrefixes = new Set<string>();
    if (prefixPhrase) sourcePrefixes.add(prefixPhrase[1].toLowerCase().replace(/\s+/g, ' '));
    if (plusSuffix) sourcePrefixes.add('+');
    if (sourcePrefixes.size === 0) continue;
    for (const key of [...token.keys, ...(token.alsoCounts ?? [])]) {
      if (!sourcePrefixByValue.has(key)) sourcePrefixByValue.set(key, new Set());
      for (const prefix of sourcePrefixes) sourcePrefixByValue.get(key)!.add(prefix);
    }
  }

  // Every number value the source holds (so a number not in the source is left
  // for the plain added-number check, not this one).
  const sourceKeys = new Set(source.tokens.flatMap(token => [...token.keys, ...(token.alsoCounts ?? [])]));

  for (const token of version.tokens) {
    const line = version.lines[token.line];
    const before = line.slice(0, token.at);
    const after = line.slice(token.at + token.display.length);
    const prefixPhrase = before.match(UPGRADE_PREFIX);
    const plusSuffix = /^\+/.test(after);
    if (!prefixPhrase && !plusSuffix) continue;

    const prefixText = prefixPhrase ? prefixPhrase[1].toLowerCase().replace(/\s+/g, ' ') : '';
    const versionPrefix = plusSuffix ? '+' : prefixText;
    const display = (prefixPhrase ? prefixPhrase[0] : '') + token.display + (plusSuffix ? '+' : '');

    for (const key of token.keys) {
      if (reported.has(key)) continue;
      if (!sourceKeys.has(key)) continue;
      const allowed = sourcePrefixByValue.get(key);
      if (allowed && allowed.has(versionPrefix)) continue;
      reported.add(key);

      const [start, end] = sentenceBounds(line, token.at);
      const place = `${token.line}:${start}`;
      const existing = findings.find(finding => finding.place === place);
      if (existing) {
        existing.numbers.push(display);
      } else {
        let sentence = line.slice(start, end);
        if (plain(sentence).length < 25) sentence = line;
        findings.push({ numbers: [display], context: contextFor(sentence, display), place });
      }
    }
  }

  return findings.map(({ numbers, context }) => ({ numbers, context }));
}

/**
 * Drops the strengthening prefix (or "+") the source does not use from each
 * number flagged by strengthenedNumbers, keeping the number itself as written:
 * "over 500" → "500", "more than 200" → "200", "500+" → "500". Marker lines
 * are never touched.
 */
export function stripStrengtheners(text: string, allowed: string): string {
  const findings = strengthenedNumbers(text, allowed);
  if (findings.length === 0) return text;
  let result = text;
  for (const finding of findings) {
    for (const number of finding.numbers) {
      // "over 500", "more than 200", "at least 50", "500+"
      const bare = number.replace(/^(over|more\s+than|at\s+least)\s+/i, '').replace(/\+$/, '');
      if (bare === number) continue;
      // Replace the prefixed/plus form with the bare number, once per occurrence.
      // Keep it to the line level to avoid touching a marker line.
      result = result.replace(number, bare);
    }
  }
  return result;
}

export function checkNumbers(versionText: string, originalText: string): NumberCheck {
  const version = numbersIn(versionText);
  const original = numbersIn(originalText);
  const keysOf = (tokens: NumberToken[], text: string) =>
    new Set([
      ...tokens.flatMap(token => [...token.keys, ...(token.alsoCounts ?? []), ...(token.dateParts ?? [])]),
      ...gluedValuesIn(text),
      ...listValuesIn(text),
    ]);

  return {
    added: missingFrom(version, keysOf(original.tokens, originalText), wordValuesIn(originalText)),
    dropped: missingFrom(original, keysOf(version.tokens, versionText), wordValuesIn(versionText)),
  };
}
