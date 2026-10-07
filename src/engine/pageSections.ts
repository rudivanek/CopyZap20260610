/**
 * Quick — the parts of a page, and what to do with each.
 *
 * A page is split at its own headings, so the parts carry the names the page
 * itself uses. For each part the user chooses one of three things:
 *
 *   improve  the engine rewrites it (the default)
 *   keep     the engine never sees it; it goes back into the new page exactly
 *            as it is, in its place
 *   leave    it is dropped: not read, not written, not part of the comparison
 *
 * Plain text handling: no model call, no cost.
 */
import { lockTestimonials } from './quoteLock';
import type { TestimonialZone } from './quoteLock';

export type SectionChoice = 'improve' | 'keep' | 'leave';

export interface PageSection {
  id: string;
  /** The part's own heading, or a plain label when it has none. */
  title: string;
  /** The part exactly as it is in the copy, heading included. */
  text: string;
  words: number;
  /** What Quick proposes for this part before the user chooses. */
  suggested: SectionChoice;
  /** Why "keep" is proposed, when it is. */
  hint?: string;
  /**
   * Set on a row that holds testimonials Quick found by itself: how many.
   * Such a row is cut out of the part it sat in, so the user can decide about
   * the testimonials apart from the text around them.
   */
  testimonials?: number;
}

export interface SectionPlan {
  /** The copy without the parts that are left out. This is "the original" from here on. */
  copy: string;
  /** The same, with each kept part replaced by a marker line. This is what the engine reads. */
  lockedCopy: string;
  /** The kept parts, to be put back after writing. */
  zones: TestimonialZone[];
  /** Parts kept as they are, not counting rows of testimonials. */
  kept: number;
  /** Testimonials in the rows that are kept as they are. */
  testimonialsKept: number;
  leftOut: number;
  /** Words the engine will actually rewrite. */
  improveWords: number;
}

const HEADING = /^\s{0,3}(#{1,6})\s+(.*\S)\s*$/;
/** Headings that announce testimonials, in the languages Quick writes. */
const TESTIMONIAL_TITLE =
  /testimoni|reseñ|rese[nñ]as|opiniones|lo que dicen|reviews?\b|what (our )?(clients|customers) say|kundenstimmen|referenzen|erfahrungsberichte|témoignages|avis clients|recensioni|depoimentos|avaliações/i;

/** Text in front of the first heading shorter than this joins the first part. */
/** Text left behind a group of testimonials needs this many words to be a row of its own. */
const TRAILING_PIECE_MIN_WORDS = 8;
const LEADING_PART_MIN_WORDS = 15;

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
const plainTitle = (text: string) => text.replace(/[*_`]/g, '').replace(/\s+#+\s*$/, '').replace(/\s+/g, ' ').trim();
const tidy = (text: string) => text.replace(/\n{3,}/g, '\n\n').trim();

function suggest(title: string, text: string): { suggested: SectionChoice; hint?: string } {
  // A part announced as testimonials is proposed as "keep". Testimonials inside
  // other parts need no proposal: the automatic lock already keeps them word
  // for word while the rest of that part is improved.
  if (TESTIMONIAL_TITLE.test(title) && wordCount(text) > wordCount(title) + 5) {
    return { suggested: 'keep', hint: 'Looks like testimonials' };
  }
  return { suggested: 'improve' };
}

/**
 * Splits copy into its parts at the page's main headings: the highest heading
 * level that occurs at least twice. Smaller headings stay inside their part.
 * Copy with fewer than two such headings comes back as one part.
 */
export function splitIntoSections(copy: string): PageSection[] {
  const lines = (copy || '').replace(/\r\n?/g, '\n').split('\n');
  const levels = new Map<number, number>();
  for (const line of lines) {
    const match = line.match(HEADING);
    if (match) levels.set(match[1].length, (levels.get(match[1].length) ?? 0) + 1);
  }
  const splitLevel = [...levels.entries()].filter(([, count]) => count >= 2).map(([level]) => level).sort((a, b) => a - b)[0];

  const chunks: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } = { title: '', lines: [] };
  for (const line of lines) {
    const match = line.match(HEADING);
    if (splitLevel !== undefined && match && match[1].length <= splitLevel && current.lines.some(item => item.trim())) {
      chunks.push(current);
      current = { title: '', lines: [] };
    }
    if (match && !current.title) current.title = plainTitle(match[2]);
    current.lines.push(line);
  }
  chunks.push(current);

  // A few words in front of the first heading (a label above the title) are
  // not a part of their own: they go with the part that follows.
  if (chunks.length > 1 && !chunks[0].title && wordCount(chunks[0].lines.join(' ')) < LEADING_PART_MIN_WORDS) {
    const lead = chunks.shift() as { title: string; lines: string[] };
    chunks[0].lines = [...lead.lines, ...chunks[0].lines];
  }

  const parts = chunks
    .map(chunk => ({ title: chunk.title, text: tidy(chunk.lines.join('\n')) }))
    .filter(chunk => chunk.text);

  // Testimonials Quick finds inside a part become a row of their own, right
  // where they stand, so the user decides about them as about any other part.
  // A part that is announced as testimonials by its heading is already such a row.
  const rows: Omit<PageSection, 'id'>[] = [];
  parts.forEach((part, index) => {
    const title = part.title || (parts.length === 1 ? 'Whole text' : index === 0 ? 'Start of the page' : 'Untitled part');
    const proposal = suggest(title, part.text);
    const lock = proposal.suggested === 'keep' ? null : lockTestimonials(part.text);
    if (!lock || lock.count === 0) {
      rows.push({ title, text: part.text, words: wordCount(part.text), ...proposal });
      return;
    }
    // The part with its testimonials replaced by marker lines, cut at those lines.
    const pieces = lock.lockedCopy.split(/^\[\[TESTIMONIALS-\d+\]\]$/m).map(tidy);
    let lastText: Omit<PageSection, 'id'> | null = null;
    pieces.forEach((piece, position) => {
      if (piece && lastText && wordCount(piece) < TRAILING_PIECE_MIN_WORDS) {
        // A few words left behind the testimonials (a stray label) are not a row
        // of their own: they go with the text of the same part before them.
        lastText.text = `${lastText.text}\n\n${piece}`;
        lastText.words = wordCount(lastText.text);
      } else if (piece) {
        lastText = {
          title: position === 0 ? title : `${title} (continued)`,
          text: piece,
          words: wordCount(piece),
          suggested: 'improve',
        };
        rows.push(lastText);
      }
      const zone = lock.zones[position];
      if (zone) {
        rows.push({
          title: zone.count === 1 ? 'Testimonial' : `Testimonials (${zone.count})`,
          text: zone.text,
          words: wordCount(zone.text),
          suggested: 'keep',
          hint: 'Looks like testimonials',
          testimonials: zone.count,
        });
      }
    });
  });

  return rows.map((row, index) => ({ id: `part-${index + 1}`, ...row }));
}

export function defaultChoices(sections: PageSection[]): Record<string, SectionChoice> {
  // A single part cannot be kept or left out: there would be nothing to improve.
  if (sections.length < 2) return Object.fromEntries(sections.map(section => [section.id, 'improve' as SectionChoice]));
  return Object.fromEntries(sections.map(section => [section.id, section.suggested]));
}

/** Turns the user's choices into what the engine reads and what gets put back afterwards. */
export function planSections(sections: PageSection[], choices: Record<string, SectionChoice>): SectionPlan {
  const choiceOf = (section: PageSection): SectionChoice => choices[section.id] ?? 'improve';
  const used = sections.filter(section => choiceOf(section) !== 'leave');
  const zones: TestimonialZone[] = [];

  const locked = used.map(section => {
    if (choiceOf(section) !== 'keep') return section.text;
    const marker = `[[KEEP-${zones.length + 1}]]`;
    zones.push({ marker, text: section.text, count: section.testimonials ?? 1 });
    return marker;
  });
  const keptRows = used.filter(section => choiceOf(section) === 'keep');

  return {
    copy: used.map(section => section.text).join('\n\n'),
    lockedCopy: locked.join('\n\n'),
    zones,
    kept: keptRows.filter(section => !section.testimonials).length,
    testimonialsKept: keptRows.reduce((sum, section) => sum + (section.testimonials ?? 0), 0),
    leftOut: sections.length - used.length,
    improveWords: used.filter(section => choiceOf(section) === 'improve').reduce((sum, section) => sum + section.words, 0),
  };
}
