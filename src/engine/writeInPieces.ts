/**
 * Quick — writing a long page piece by piece.
 *
 * Asked to rewrite a long page in one go, the writing step tends to drop whole
 * blocks of it. Up to about 1,250 words it is reliable, and only there does the
 * engine check the length of what comes back. So a longer page is cut into
 * pieces of that size, at its own headings, each piece is rewritten by itself,
 * and the rewrites are joined again in order:
 *
 *   cutIntoPieces(copy)             -> the pieces, in order
 *   writeQuickVersionsInPieces(...) -> the versions, each put together from
 *                                      one rewrite of every piece
 *
 * A page of up to QUICK_PIECES_FROM_WORDS words is one piece and is written
 * exactly as before.
 *
 * The whole thing sits behind a switch that is off unless turned on (see
 * writesInPieces). Cutting and joining are plain text handling: no model call.
 */
import { v4 as uuidv4 } from 'uuid';
import { FormState, GeneratedContentItem, GeneratedContentItemType, User } from '../types';
import { generateCopy } from '../services/api/copyGeneration';
import { contentToText } from '../services/api/contentText';
import { keepInstructions, restoreTestimonials, testimonialInstructions } from './quoteLock';
import type { TestimonialZone } from './quoteLock';

/** The switch for all users. Off: every page is written in one go, as before. */
export const QUICK_PIECES_DEFAULT = false;
/** One browser can be switched by itself: localStorage cz_quick_pieces = "on" or "off". */
export const QUICK_PIECES_STORAGE_KEY = 'cz_quick_pieces';
/** Copy up to this many words is written in one go. The same number as LONG_COPY_WORDS in outputBudget.ts. */
export const QUICK_PIECES_FROM_WORDS = 1250;
/** The size a piece aims at. */
export const QUICK_PIECE_WORDS = 1000;
/** No piece is longer than this, unless a single paragraph is. */
export const QUICK_PIECE_MAX_WORDS = QUICK_PIECES_FROM_WORDS;
/** How many pieces are written at the same time, over all versions. */
export const QUICK_PIECES_AT_ONCE = 6;

/** A piece with fewer real words than this is not sent to be rewritten: it goes through as it is. */
const PIECE_MIN_WORDS = 5;
/** Words of the neighbouring pieces shown to the writing step for orientation. */
const NEIGHBOUR_WORDS = 30;
const OUTLINE_MAX_HEADINGS = 30;
const OUTLINE_HEADING_MAX_CHARS = 70;

const HEADING = /^\s{0,3}(#{1,6})\s+(.*\S)\s*$/;
const MARKER_LINE = /^\s*\[\[(?:TESTIMONIALS|KEEP)-\d+\]\]\s*$/;

export interface CopyPiece {
  /** The piece exactly as it is in the copy. */
  text: string;
  /** Its words, not counting marker lines. */
  words: number;
}

/** True when long pages are written piece by piece. */
export function writesInPieces(): boolean {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(QUICK_PIECES_STORAGE_KEY) : null;
    if (stored === 'on') return true;
    if (stored === 'off') return false;
  } catch {
    // Storage not available: use the setting for all users.
  }
  return QUICK_PIECES_DEFAULT;
}

const tidy = (text: string) => text.replace(/\n{3,}/g, '\n\n').trim();
const plainTitle = (text: string) => text.replace(/[*_`]/g, '').replace(/\s+#+\s*$/, '').replace(/\s+/g, ' ').trim();

/** Words of a text, not counting marker lines. */
function realWords(text: string): number {
  const kept = text
    .split('\n')
    .filter(line => !MARKER_LINE.test(line))
    .join(' ')
    .trim();
  return kept ? kept.split(/\s+/).length : 0;
}

/** True when a block holds headings only, so it must stay with the text that follows it. */
function isHeadingOnly(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.length > 0 && lines.every(line => HEADING.test(line));
}

/** How much worse a cut is in front of a small heading, or between two paragraphs, than in front of a main heading. In words. */
const CUT_BEFORE_SMALL_HEADING = 100;
const CUT_BETWEEN_PARAGRAPHS = 250;
/** A page this little over a whole number of pieces does not get one more piece for it. */
const PIECE_SLACK_WORDS = 100;

/** What it costs to start a piece with this text. Nothing in front of a main heading. */
function cutCost(text: string): number {
  const match = text.split('\n', 1)[0].match(HEADING);
  if (!match) return CUT_BETWEEN_PARAGRAPHS ** 2;
  return match[1].length <= 2 ? 0 : CUT_BEFORE_SMALL_HEADING ** 2;
}

/**
 * Cuts copy into pieces of about QUICK_PIECE_WORDS words, as even as the copy
 * allows. It cuts in front of headings; a stretch without headings that is too
 * long by itself is cut between paragraphs, never inside one. Nothing is added,
 * dropped or reordered: the pieces joined with a blank line are the copy again.
 */
export function cutIntoPieces(copy: string): CopyPiece[] {
  const whole = tidy((copy || '').replace(/\r\n?/g, '\n'));
  const total = realWords(whole);
  if (total <= QUICK_PIECES_FROM_WORDS) return [{ text: whole, words: total }];

  // 1 — blocks: each heading with the text under it.
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of whole.split('\n')) {
    if (HEADING.test(line) && current.some(item => item.trim())) {
      blocks.push(tidy(current.join('\n')));
      current = [];
    }
    current.push(line);
  }
  blocks.push(tidy(current.join('\n')));

  // 2 — units, the smallest things a piece is made of: a block, or the
  // paragraphs of a block that is too long to be a piece by itself.
  const loose = blocks
    .filter(Boolean)
    .flatMap(block => (realWords(block) <= QUICK_PIECE_MAX_WORDS ? [block] : block.split(/\n{2,}/).filter(Boolean)));

  // 3 — a heading with nothing under it goes with what follows.
  const units: string[] = [];
  let pending = '';
  for (const unit of loose) {
    const text = pending ? `${pending}\n\n${unit}` : unit;
    if (isHeadingOnly(text)) {
      pending = text;
    } else {
      units.push(text);
      pending = '';
    }
  }
  if (pending) {
    if (units.length > 0) units[units.length - 1] = `${units[units.length - 1]}\n\n${pending}`;
    else units.push(pending);
  }

  // 4 — the most even way to put the units into pieces, each no longer than
  // QUICK_PIECE_MAX_WORDS (a single unit may be). Tried with the smallest
  // number of pieces first.
  const sizes = units.map(realWords);
  const starts = units.map(cutCost);
  const upTo = [0];
  sizes.forEach(size => upTo.push(upTo[upTo.length - 1] + size));
  const fewest = Math.max(
    Math.ceil(total / QUICK_PIECE_MAX_WORDS),
    Math.ceil((total - PIECE_SLACK_WORDS) / QUICK_PIECE_WORDS)
  );

  let cuts: number[] | null = null;
  for (let count = Math.min(fewest, units.length); count <= units.length && !cuts; count += 1) {
    // best[k][i]: the lowest cost of putting the first i units into k pieces.
    const best = Array.from({ length: count + 1 }, () => new Array<number>(units.length + 1).fill(Infinity));
    const from = Array.from({ length: count + 1 }, () => new Array<number>(units.length + 1).fill(-1));
    best[0][0] = 0;
    for (let k = 1; k <= count; k += 1) {
      for (let end = k; end <= units.length; end += 1) {
        for (let start = k - 1; start < end; start += 1) {
          if (best[k - 1][start] === Infinity) continue;
          const size = upTo[end] - upTo[start];
          if (size > QUICK_PIECE_MAX_WORDS && end - start > 1) continue;
          const cost = best[k - 1][start] + size * size + (start > 0 ? starts[start] : 0);
          if (cost < best[k][end]) {
            best[k][end] = cost;
            from[k][end] = start;
          }
        }
      }
    }
    if (best[count][units.length] === Infinity) continue;
    cuts = [];
    for (let k = count, end = units.length; k > 0; k -= 1) {
      cuts.unshift(from[k][end]);
      end = from[k][end];
    }
  }
  const begins = cuts ?? units.map((_, index) => index);

  return begins.map((begin, index) => {
    const text = units.slice(begin, begins[index + 1] ?? units.length).join('\n\n');
    return { text, words: realWords(text) };
  });
}

/** Joins rewritten pieces, in order, into one text. */
export function joinPieces(texts: string[]): string {
  return tidy(texts.map(text => tidy(text || '')).filter(Boolean).join('\n\n'));
}

function headingLevels(text: string): number[] {
  return text
    .split('\n')
    .map(line => line.match(HEADING))
    .filter((match): match is RegExpMatchArray => !!match)
    .map(match => match[1].length);
}

/**
 * A rewritten piece must not carry bigger headings than the piece it was made
 * from: a "# Title" in the middle of a page would read as a second page title.
 * When it does, all its headings are moved down by the same number of levels.
 */
export function fitHeadings(rewritten: string, piece: string, before: string): string {
  const got = headingLevels(rewritten);
  if (got.length === 0) return rewritten;
  const own = headingLevels(piece);
  const earlier = headingLevels(before);
  // The piece's own top level; without headings of its own, one below the last heading before it.
  const floor = own.length > 0 ? Math.min(...own) : earlier.length > 0 ? Math.min(6, earlier[earlier.length - 1] + 1) : 2;
  const shift = floor - Math.min(...got);
  if (shift <= 0) return rewritten;
  return rewritten
    .split('\n')
    .map(line => {
      const match = line.match(HEADING);
      return match ? `${'#'.repeat(Math.min(6, match[1].length + shift))} ${match[2]}` : line;
    })
    .join('\n');
}

const firstWords = (text: string, count: number) => text.replace(/\s+/g, ' ').trim().split(' ').slice(0, count).join(' ');
const lastWords = (text: string, count: number) => text.replace(/\s+/g, ' ').trim().split(' ').slice(-count).join(' ');
const withoutMarkers = (text: string) =>
  text
    .split('\n')
    .filter(line => !MARKER_LINE.test(line))
    .join('\n');

/** What the writing step is told about one piece: where it sits in the page and what not to do because of that. */
export function pieceInstructions(pieces: CopyPiece[], index: number): string {
  const count = pieces.length;
  const first = index === 0;
  const last = index === count - 1;

  const outline = pieces
    .flatMap((item, at) =>
      item.text
        .split('\n')
        .map(line => line.match(HEADING))
        .filter((match): match is RegExpMatchArray => !!match)
        .map(match => `${at === index ? '[this part] ' : ''}${plainTitle(match[2]).slice(0, OUTLINE_HEADING_MAX_CHARS)}`)
    )
    .slice(0, OUTLINE_MAX_HEADINGS);

  const lines = [
    `The text you are given is part ${index + 1} of ${count} of one longer page. The other parts are rewritten separately and joined with this one, in order.`,
    'Rewrite this part only. Cover everything it covers: do not drop a section, a list item, a name, a price or a figure.',
    'Keep its headings in the same order and at the same level (#, ##, ###). Do not add a heading above them.',
    first
      ? 'This part is the start of the page.'
      : 'The page has already begun before this part: do not open with a page title, an introduction or a greeting. Start where this part starts.',
    last
      ? 'This part is the end of the page.'
      : 'The page goes on after this part: do not end with a summary, a sign-off or a closing call to action unless this part already ends with one.',
  ];
  if (outline.length > 1) lines.push(`For orientation only, the headings of the whole page: ${outline.join(' / ')}`);
  if (!first) lines.push(`The part before this one ends with: "${lastWords(withoutMarkers(pieces[index - 1].text), NEIGHBOUR_WORDS)}"`);
  if (!last) lines.push(`The part after this one starts with: "${firstWords(withoutMarkers(pieces[index + 1].text), NEIGHBOUR_WORDS)}"`);
  if (!first || !last) lines.push('Those neighbouring lines are not yours to rewrite or repeat.');
  return lines.join('\n');
}

export interface PiecesZones {
  /** Parts the user keeps as they are, each replaced by a [[KEEP-n]] line. */
  keep: TestimonialZone[];
  /** Testimonials Quick took out by itself, each group replaced by a [[TESTIMONIALS-n]] line. */
  testimonials: TestimonialZone[];
}

export interface PiecesOutcome {
  items: GeneratedContentItem[];
  failed: number;
  firstError?: string;
  /** Versions in which a kept part lost its place and was put back at the end of its piece. */
  movedIds: string[];
}

type PiecesProgress = (progress: { stage: 'writing'; done: number; total: number }) => void;

/** Runs the tasks with at most `limit` of them under way at any time. Never rejects: each task settles by itself. */
async function runLimited<T>(tasks: (() => Promise<T>)[], limit: number): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const at = next;
      next += 1;
      try {
        results[at] = { status: 'fulfilled', value: await tasks[at]() };
      } catch (reason) {
        results[at] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, worker));
  return results;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return typeof error === 'string' ? error : 'Unknown error';
}

/**
 * Writes the versions of a page that has been cut into pieces. Every version
 * is one rewrite of each piece, joined in order. The parts taken out of the
 * copy (kept parts, testimonials) are put back here, piece by piece, so each
 * returns to the piece it came from: the versions come back complete.
 *
 * `formState` is the settings object of the whole page; only the copy, its
 * length and the special instructions differ from piece to piece.
 */
export async function writeQuickVersionsInPieces(
  formState: FormState,
  pieces: CopyPiece[],
  zones: PiecesZones,
  user: User,
  sessionId: string,
  versions: number,
  onProgress?: PiecesProgress
): Promise<PiecesOutcome> {
  let done = 0;
  onProgress?.({ stage: 'writing', done, total: versions });

  const inPiece = (list: TestimonialZone[], piece: CopyPiece) => list.filter(zone => piece.text.includes(zone.marker));

  /** One rewrite of one piece, with the parts taken out of it put back. */
  const writePiece = async (index: number): Promise<{ text: string; moved: boolean }> => {
    const piece = pieces[index];
    const keep = inPiece(zones.keep, piece);
    const testimonials = inPiece(zones.testimonials, piece);
    const mine = [...testimonials, ...keep];

    let text = piece.text;
    if (piece.words >= PIECE_MIN_WORDS) {
      const settings: FormState = {
        ...formState,
        originalCopy: piece.text,
        customWordCount: piece.words,
        specialInstructions: [pieceInstructions(pieces, index), keepInstructions(keep), testimonialInstructions(testimonials)]
          .filter(Boolean)
          .join('\n\n'),
      };
      let result;
      try {
        result = await generateCopy({ ...settings }, user, sessionId);
      } catch {
        // One more try: a single failed call must not cost the whole version.
        result = await generateCopy({ ...settings }, user, sessionId);
      }
      if (!result || result.validationFailed || !result.improvedCopy) {
        throw new Error(`Part ${index + 1} of ${pieces.length} could not be written.`);
      }
      const before = pieces
        .slice(0, index)
        .map(item => item.text)
        .join('\n\n');
      text = fitHeadings(contentToText(result.improvedCopy), piece.text, before);
    }
    if (mine.length === 0) return { text, moved: false };
    const restored = restoreTestimonials(text, mine);
    return { text: restored.text, moved: restored.moved };
  };

  // Every piece of every version is a task of its own; a version is done when all its pieces are.
  const left = Array.from({ length: versions }, () => pieces.length);
  const tasks = Array.from({ length: versions * pieces.length }, (_, at) => {
    const version = Math.floor(at / pieces.length);
    const index = at % pieces.length;
    return async () => {
      const written = await writePiece(index);
      left[version] -= 1;
      if (left[version] === 0) {
        done += 1;
        onProgress?.({ stage: 'writing', done, total: versions });
      }
      return written;
    };
  });
  const settled = await runLimited(tasks, QUICK_PIECES_AT_ONCE);

  const items: GeneratedContentItem[] = [];
  const movedIds: string[] = [];
  let firstError: string | undefined;
  for (let version = 0; version < versions; version += 1) {
    const mine = settled.slice(version * pieces.length, (version + 1) * pieces.length);
    const broken = mine.find((outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected');
    if (broken) {
      if (!firstError) firstError = errorMessage(broken.reason);
      continue;
    }
    const written = mine.map(outcome => (outcome as PromiseFulfilledResult<{ text: string; moved: boolean }>).value);
    const id = uuidv4();
    items.push({
      id,
      type: GeneratedContentItemType.Improved,
      content: joinPieces(written.map(part => part.text)),
      sourceText: formState.originalCopy,
      generatedAt: new Date().toISOString(),
      sourceDisplayName: `Generated Copy ${version + 1}`,
      analysisMode: 'on_demand',
    });
    if (written.some(part => part.moved)) movedIds.push(id);
  }

  return { items, failed: versions - items.length, firstError, movedIds };
}
