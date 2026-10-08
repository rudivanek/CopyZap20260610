/**
 * Quick — keeps testimonials word for word.
 *
 * A model asked to improve a page also "improves" the testimonials on it: it
 * shortens them, merges them, rewords them inside the quotation marks and
 * drops customers. Real people's words must not be edited, so Quick takes the
 * testimonials out before writing and puts them back afterwards:
 *
 *   lockTestimonials(copy)        -> the copy with each group of testimonials
 *                                    replaced by one marker line
 *   restoreTestimonials(text)     -> the written version with the original
 *                                    testimonials back in place, unchanged
 *   findUnverifiedQuotes(v, orig) -> quoted passages in a version that are not
 *                                    in the original (invented or altered)
 *
 * Everything here is plain text handling: no model call, no dependencies.
 */

/** Longest testimonial body that is still taken as one testimonial. */
const MAX_BODY_WORDS = 400;
const MAX_BODY_PARAGRAPHS = 10;
const MIN_BODY_WORDS = 3;
/** A line standing alone with at most this many words and no sentence ending reads as a heading. */
const HEADING_LIKE_MAX_WORDS = 10;
/** A quoted passage must be at least this long to be checked. */
const MIN_QUOTE_WORDS = 6;

export interface TestimonialZone {
  /** The line that stands in for this group while the copy is rewritten. */
  marker: string;
  /** The group exactly as it is in the original, without link labels between testimonials. */
  text: string;
  /** How many testimonials the group holds. */
  count: number;
}

export interface TestimonialLock {
  /** The copy with every group of testimonials replaced by its marker line. */
  lockedCopy: string;
  zones: TestimonialZone[];
  /** Testimonials found in total. 0 means nothing was locked and lockedCopy equals the input. */
  count: number;
}

const markerFor = (index: number) => `[[TESTIMONIALS-${index}]]`;
const ANY_MARKER_LINE = /^.*\[\[\s*(?:TESTIMONIALS|KEEP)[-\s_]?\d+\s*\]\].*$/gim;

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
const isBlank = (line: string) => line.trim() === '';
const isHeading = (line: string) => /^\s{0,3}#{1,6}\s+\S/.test(line);
const isRule = (line: string) => /^\s*([-*_])(\s*\1){2,}\s*$/.test(line);
const isBlockquote = (line: string) => /^\s*>/.test(line);
/** Leading blockquote and emphasis marks do not count as content. */
const bare = (line: string) => line.replace(/^[\s>*_]+/, '').replace(/[\s*_]+$/, '');

/**
 * A line that names who said something: a dash followed by a name, for example
 * "—Roberto Yelin", "– D. Piller" or "-Rolando Molina, Líderes Mexicanos".
 * A list item ("- text", hyphen then space) is not an attribution.
 */
export function isAttributionLine(line: string): boolean {
  const match = bare(line).match(/^(?:[—–]\s*|--\s*|-(?=[^\s-]))(.+)$/u);
  if (!match) return false;
  const name = match[1].replace(/[*_]/g, '').trim();
  if (name.length < 2 || name.length > 80) return false;
  if (!/^\p{Lu}/u.test(name)) return false;
  if (/[!?:;…]$/.test(name)) return false;
  if (/\.$/.test(name) && !/(^|\s)\p{L}{1,4}\.$/u.test(name)) return false; // a sentence, not a name
  return wordCount(name) <= 10;
}

/** A whole testimonial on one line: "Quoted words." — Name */
function isOneLineTestimonial(line: string): boolean {
  return /^["“«].{20,}["”»][\s*_]*(?:[—–]|--|-)\s*\p{Lu}.{1,80}$/u.test(bare(line)) && !/[!?:;]$/.test(line.trim());
}

/** A short line with no sentence ending, such as a "Read testimonial" link label or a section label. */
function isLabelLine(line: string): boolean {
  const text = bare(line);
  if (!text || isAttributionLine(line) || isHeading(line)) return false;
  if (/^([-*+]|\d+[.)])\s/.test(text)) return false; // a list item
  if (/[.!?…"”»:;]$/.test(text)) return false;
  return wordCount(text) <= 4;
}

/**
 * A short line standing alone, with no sentence ending: what a page uses as a
 * heading even when the text carries no heading mark, for example "Lo que
 * dicen nuestros pacientes" or "What our clients say:". Such a line is not
 * part of what someone said, so a testimonial does not reach past it.
 */
function isHeadingLikeLine(lines: string[], index: number): boolean {
  const line = lines[index];
  if (isBlank(line) || isBlockquote(line) || isAttributionLine(line)) return false;
  if (index > 0 && !isBlank(lines[index - 1])) return false;
  if (index + 1 < lines.length && !isBlank(lines[index + 1])) return false;
  const text = bare(line);
  if (/^([-*+]|\d+[.)])\s/.test(text)) return false; // a list item
  if (/^["“«]/.test(text) || /[.!?…"”»;]$/.test(text)) return false;
  return wordCount(text) <= HEADING_LIKE_MAX_WORDS;
}

const startsWithQuoteMark = (line: string) => /^["“«]/.test(bare(line));

interface Found {
  start: number;
  end: number;
  /** True when the form itself says "this is a quote": quotation marks or a blockquote. */
  strong: boolean;
  /**
   * Where each paragraph of what was said begins, nearest to the name first.
   * Only for testimonials found by the name under them.
   */
  paragraphStarts?: number[];
  /**
   * True when nothing on the page showed where the words begin: the search ran
   * to the top of the text, or to the most a testimonial may hold.
   */
  open?: boolean;
}

function findTestimonials(lines: string[]): Found[] {
  const found: Found[] = [];
  let floor = 0; // lines before this belong to an earlier testimonial

  for (let i = 0; i < lines.length; i++) {
    if (isOneLineTestimonial(lines[i])) {
      found.push({ start: i, end: i, strong: true });
      floor = i + 1;
      continue;
    }
    if (!isAttributionLine(lines[i])) continue;

    // Walk back over the paragraphs that make up what was said.
    let start = -1;
    let words = 0;
    let inParagraph = false;
    const paragraphStarts: number[] = [];
    // Open until something on the page shows where the words begin.
    let open = floor === 0;
    for (let j = i - 1; j >= floor; j--) {
      const line = lines[j];
      // A heading, a rule or a label ("Testimonials", "Read testimonial") ends what was said.
      // So does a line that reads as a heading, once there is something below it.
      if (isHeading(line) || isRule(line) || isLabelLine(line) || (start !== -1 && isHeadingLikeLine(lines, j))) {
        open = false;
        break;
      }
      if (isBlank(line)) {
        inParagraph = false;
        continue;
      }
      const lineWords = wordCount(line);
      if ((!inParagraph && paragraphStarts.length >= MAX_BODY_PARAGRAPHS) || words + lineWords > MAX_BODY_WORDS) {
        open = true;
        break;
      }
      if (!inParagraph) {
        paragraphStarts.push(j);
        inParagraph = true;
      } else {
        paragraphStarts[paragraphStarts.length - 1] = j;
      }
      words += lineWords;
      start = j;
    }
    if (start === -1) continue;

    const body = lines.slice(start, i).join(' ');
    if (wordCount(body) < MIN_BODY_WORDS) continue;

    found.push({ start, end: i, strong: startsWithQuoteMark(lines[start]) || isBlockquote(lines[start]), paragraphStarts, open });
    floor = i + 1;
  }

  // Where nothing showed the beginning, do not take everything above the name:
  // that swallows the copy in front of the first testimonial. Start at an
  // opening quotation mark when there is one. Otherwise take as many paragraphs
  // as the page's other testimonials have, and one when there is none to go by.
  const settled = found.filter(item => item.paragraphStarts && !item.open).map(item => (item.paragraphStarts as number[]).length);
  const usual = settled.length > 0 ? Math.max(...settled) : 1;
  for (const item of found) {
    const starts = item.paragraphStarts;
    if (!item.open || !starts || starts.length < 2) continue;
    let quoted = starts.findIndex(index => startsWithQuoteMark(lines[index]));
    while (quoted >= 0 && quoted + 1 < starts.length && startsWithQuoteMark(lines[starts[quoted + 1]])) quoted += 1;
    const keep = quoted >= 0 ? quoted + 1 : Math.min(usual, starts.length);
    item.start = starts[keep - 1];
    item.strong = startsWithQuoteMark(lines[item.start]) || isBlockquote(lines[item.start]);
  }

  // Blockquotes with no name under them are still someone's words.
  for (let i = 0; i < lines.length; i++) {
    if (!isBlockquote(lines[i]) || found.some(item => i >= item.start && i <= item.end)) continue;
    let end = i;
    while (end + 1 < lines.length && isBlockquote(lines[end + 1])) end += 1;
    if (wordCount(lines.slice(i, end + 1).map(bare).join(' ')) >= MIN_BODY_WORDS) {
      found.push({ start: i, end, strong: true });
    }
    i = end;
  }

  return found.sort((a, b) => a.start - b.start);
}

/** Testimonials that follow one another, with nothing but blank lines and labels between them, form one group. */
function groupIntoZones(lines: string[], found: Found[]): Found[][] {
  const zones: Found[][] = [];
  for (const item of found) {
    const zone = zones[zones.length - 1];
    const previous = zone ? zone[zone.length - 1] : undefined;
    const gap = previous ? lines.slice(previous.end + 1, item.start) : [];
    if (previous && gap.every(line => isBlank(line) || isLabelLine(line))) {
      zone.push(item);
    } else {
      zones.push([item]);
    }
  }
  // One dash-and-name line alone is too weak a sign (it could be a signature).
  return zones.filter(zone => zone.length >= 2 || zone.some(item => item.strong));
}

const tidy = (text: string) => text.replace(/\n{3,}/g, '\n\n').trim();

export function lockTestimonials(copy: string): TestimonialLock {
  const source = (copy || '').replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  const zones = groupIntoZones(lines, findTestimonials(lines));
  if (zones.length === 0) return { lockedCopy: copy, zones: [], count: 0 };

  const result: TestimonialZone[] = [];
  const output: string[] = [];
  let cursor = 0;

  zones.forEach((zone, index) => {
    const first = zone[0];
    const last = zone[zone.length - 1];
    const marker = markerFor(index + 1);

    // Short lines between testimonials are usually a repeated link label
    // ("Read testimonial"). The same label often sits in front of the first one.
    const seen = new Map<string, number>();
    const note = (line: string) => {
      if (!isBlank(line)) seen.set(bare(line), (seen.get(bare(line)) ?? 0) + 1);
    };
    zone.forEach((item, position) => {
      if (position > 0) lines.slice(zone[position - 1].end + 1, item.start).forEach(note);
    });
    let before = first.start;
    while (before > cursor && (isBlank(lines[before - 1]) || seen.has(bare(lines[before - 1])))) {
      before -= 1;
      note(lines[before]);
    }
    // A label that repeats is page furniture and is left out. One that appears
    // only once may be a short line someone actually wrote, so it stays.
    const isFurniture = (line: string) => (seen.get(bare(line)) ?? 0) >= 2;

    // The group's own text: every testimonial exactly as written.
    const kept: string[] = [];
    zone.forEach((item, position) => {
      if (position > 0) {
        kept.push('');
        const between = lines.slice(zone[position - 1].end + 1, item.start).filter(line => !isBlank(line) && !isFurniture(line));
        if (between.length > 0) kept.push(...between, '');
      }
      kept.push(...lines.slice(item.start, item.end + 1));
    });
    // The label in front of the group goes only if it is furniture; otherwise it stays in the copy.
    while (before < first.start && !isBlank(lines[before]) && !isFurniture(lines[before])) before += 1;

    result.push({ marker, text: tidy(kept.join('\n')), count: zone.length });
    output.push(...lines.slice(cursor, before), '', marker, '');
    cursor = last.end + 1;
  });
  output.push(...lines.slice(cursor));

  return {
    lockedCopy: tidy(output.join('\n')),
    zones: result,
    count: result.reduce((sum, zone) => sum + zone.count, 0),
  };
}

/** What the writing step is told about the marker lines. Goes into the special instructions. */
export function testimonialInstructions(zones: TestimonialZone[]): string {
  if (zones.length === 0) return '';
  const markers = zones.map(zone => zone.marker).join(', ');
  return [
    'This page has client testimonials that must stay exactly as their authors wrote them.',
    `They have been taken out of the text. Each group is represented by a marker line: ${markers}.`,
    'Keep every marker line exactly as it is, on its own line, once, at the point where the testimonials belong. A heading above it is fine.',
    'Do not write, quote, paraphrase, summarise or invent testimonials or customer quotes, and do not put words in quotation marks as if a customer had said them.',
  ].join('\n');
}

/** What the writing step is told about parts of the page the user chose to keep as they are. */
export function keepInstructions(zones: TestimonialZone[]): string {
  if (zones.length === 0) return '';
  const markers = zones.map(zone => zone.marker).join(', ');
  return [
    'Some parts of this page must stay exactly as they are and are not yours to rewrite.',
    `They have been taken out of the text. Each one is represented by a marker line: ${markers}.`,
    'Keep every marker line exactly as it is, on its own line, once, at the point where that part belongs.',
    'Do not add a heading for a marker (the part brings its own) and do not write a replacement or a summary of it.',
  ].join('\n');
}

export interface RestoredText {
  text: string;
  /** True when a marker was missing and its testimonials had to be put back before the last section. */
  moved: boolean;
}

export function restoreTestimonials(text: string, zones: TestimonialZone[]): RestoredText {
  if (zones.length === 0) return { text, moved: false };

  let output = (text || '').replace(/\r\n?/g, '\n');
  const missing: TestimonialZone[] = [];

  zones.forEach(zone => {
    // Each zone is found by its own marker: [[TESTIMONIALS-1]], [[KEEP-2]], ...
    const [, name = 'TESTIMONIALS', number = '1'] = zone.marker.match(/\[\[\s*([A-Z]+)[-\s_]?(\d+)\s*\]\]/) ?? [];
    const line = new RegExp(`^.*\\[\\[\\s*${name}[-\\s_]?${number}\\s*\\]\\].*$`, 'im');
    if (!line.test(output)) {
      missing.push(zone);
      return;
    }
    let placed = false;
    output = output.replace(new RegExp(line.source, 'gim'), () => {
      if (placed) return '';
      placed = true;
      return `\n${zone.text}\n`;
    });
  });

  // Markers the writing step made up, or repeated, never reach the reader.
  output = output.replace(ANY_MARKER_LINE, '');

  if (missing.length > 0) {
    const block = missing.map(zone => zone.text).join('\n\n');
    const lines = output.split('\n');
    const headings = lines.map((line, index) => (isHeading(line) ? index : -1)).filter(index => index >= 0);
    if (headings.length >= 2) {
      lines.splice(headings[headings.length - 1], 0, block, '');
      output = lines.join('\n');
    } else {
      output = `${output.trim()}\n\n${block}`;
    }
  }

  return { text: tidy(output), moved: missing.length > 0 };
}

const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Passages a version puts in quotation marks that do not appear in the original.
 * They are either invented or an edited form of something a real person said.
 */
export function findUnverifiedQuotes(versionText: string, originalText: string): string[] {
  const original = ` ${normalise(originalText || '')} `;
  const seen = new Set<string>();
  const flagged: string[] = [];

  for (const match of (versionText || '').matchAll(/["“«]([^"“”«»\n]{20,600})["”»]/g)) {
    const quote = match[1].trim();
    const key = normalise(quote);
    if (wordCount(key) < MIN_QUOTE_WORDS || seen.has(key)) continue;
    seen.add(key);
    if (!original.includes(` ${key} `)) {
      flagged.push(quote.length > 160 ? `${quote.slice(0, 157).trim()}…` : quote);
    }
  }
  return flagged;
}
