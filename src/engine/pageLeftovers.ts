/**
 * Quick — page leftovers: the bits of a web page that are not copy.
 *
 * A page brings along lines that only make sense on the live site: a row of
 * client or project names from a portfolio grid, "LEER MÁS" under a heading,
 * "Ver portafolio completo", the names on testimonial tabs. Kept in the text,
 * the writer treats them as copy and keeps them, and the scorer takes points
 * off Structure for them. Measured 2026-10-14 on sharpen.studio: Quick's
 * versions kept the 13-name portfolio list and scored 17/25 on Structure;
 * Copy Maker's, which dropped it, 21-22/25.
 *
 * This file only finds them. pageSections.ts turns each run it finds into a
 * row of its own, proposed as "Leave out", and the user can switch it back.
 * A part left out is not read, not written and not compared, so the original
 * is scored without the leftovers too: the comparison stays like for like.
 *
 * Plain text handling: no model call, no cost.
 */

/** A line of this many words or fewer can be a label. */
const STUB_MAX_WORDS = 5;
/** Fewest labels in a row that make a list of names or links. */
const RUN_MIN_LINES = 4;

/** Link labels that stand for a button or a link, in the languages Quick writes. */
const LINK_LABEL =
  /^(leer|ver|saber|conoce|descubre|read|see|view|learn|discover|find out|mehr|weiterlesen|alle|en savoir|voir|lire|scopri|leggi|vedi|saiba|ler|veja)(\s+\S+){0,3}$/i;

const MARKER = /\[\[\s*[A-Z]+[-\s_]?\d+\s*\]\]/;
const BULLET = /^\s*([-*+•]|\d+[.)])\s+/;

/** The line without heading marks, bullets and emphasis. */
function bare(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(BULLET, '')
    .replace(/[*_`]/g, '')
    .trim();
}

const words = (text: string) => (text ? text.split(/\s+/).filter(Boolean).length : 0);

/** A short line that is not a sentence: a name, a label, a button. */
function isStub(line: string): boolean {
  if (MARKER.test(line)) return false;
  const text = bare(line);
  const count = words(text);
  if (count === 0 || count > STUB_MAX_WORDS) return false;
  // A sentence or a question is copy, however short.
  if (/[.!?:;…¿¡]/.test(text)) return false;
  // A number on its own line is a figure the page states ("+200 proyectos").
  if (/^[+~]?\d/.test(text)) return false;
  return true;
}

/** A label in capitals ("LEER MÁS", "NUESTRO EXPERTISE") or a link label ("Ver portafolio completo"). */
function isLinkLabel(line: string): boolean {
  if (/^\s{0,3}#/.test(line)) return false;
  const text = bare(line);
  if (!isStub(line)) return false;
  const letters = text.replace(/[^\p{L}]/gu, '');
  const capitals = letters.length >= 4 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
  return capitals || LINK_LABEL.test(text);
}

export interface TextPiece {
  text: string;
  /** True for a run of page leftovers. */
  leftover: boolean;
  /** For a leftover: its lines, plain. */
  items: string[];
}

/**
 * Cuts text into pieces: ordinary text, and runs of page leftovers. A run is
 * four or more labels in a row (blank lines between them do not matter) where
 * at least half are not list items, so an ordinary bulleted list stays copy,
 * and the others are all headings or all plain lines, so a grid of features
 * with short headings and taglines stays copy; or a link label on its own
 * ("LEER MÁS", "Ver portafolio completo"). Returns one ordinary piece when
 * there is nothing to cut.
 */
export function splitLeftovers(text: string): TextPiece[] {
  const lines = (text || '').replace(/\r\n?/g, '\n').split('\n');
  const filled = lines.map((line, index) => ({ line, index })).filter(item => item.line.trim());

  // A heading followed by a sentence introduces copy: it is not a label, however short.
  const label = (position: number): boolean => {
    const { line } = filled[position];
    if (!isStub(line)) return false;
    const next = filled[position + 1];
    return !(/^\s{0,3}#/.test(line) && next && !isStub(next.line));
  };

  // Runs of consecutive labels among the lines that have text.
  const runs: { start: number; end: number }[] = [];
  let at = 0;
  while (at < filled.length) {
    if (!label(at)) {
      at += 1;
      continue;
    }
    let stop = at;
    while (stop + 1 < filled.length && label(stop + 1)) stop += 1;
    const run = filled.slice(at, stop + 1);
    const listItems = run.filter(item => BULLET.test(item.line)).length;
    // The lines that are not list items are all headings or all plain lines.
    // A grid of features ("### Rápido" / "Sin esperas" / "### A medida" / ...)
    // mixes the two and is copy; a list of names or links does not.
    const others = run.filter(item => !BULLET.test(item.line) && !isLinkLabel(item.line));
    const headings = others.filter(item => /^\s{0,3}#/.test(item.line)).length;
    const uniform = headings === 0 || headings === others.length;
    const nameList = run.length >= RUN_MIN_LINES && listItems * 2 <= run.length && uniform;
    if (nameList) {
      runs.push({ start: run[0].index, end: run[run.length - 1].index });
    } else {
      // Link labels inside a shorter run are cut one by one.
      for (const item of run) {
        if (isLinkLabel(item.line)) runs.push({ start: item.index, end: item.index });
      }
    }
    at = stop + 1;
  }

  if (runs.length === 0) return [{ text: text.trim(), leftover: false, items: [] }];

  // Neighbouring runs with only blank lines between them are one run.
  const merged: { start: number; end: number }[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && lines.slice(last.end + 1, run.start).every(line => !line.trim())) {
      last.end = run.end;
    } else {
      merged.push({ ...run });
    }
  }

  const pieces: TextPiece[] = [];
  let from = 0;
  for (const run of merged) {
    const before = lines.slice(from, run.start).join('\n').trim();
    if (before) pieces.push({ text: before, leftover: false, items: [] });
    const block = lines.slice(run.start, run.end + 1);
    pieces.push({
      text: block.join('\n').trim(),
      leftover: true,
      items: block.filter(line => line.trim()).map(bare),
    });
    from = run.end + 1;
  }
  const after = lines.slice(from).join('\n').trim();
  if (after) pieces.push({ text: after, leftover: false, items: [] });
  return pieces;
}

/** A short name for a row of leftovers: its first few lines. */
export function leftoverTitle(items: string[]): string {
  const unique = [...new Set(items)];
  const shown = unique.slice(0, 3).join(', ');
  return unique.length > 3 ? `${shown}, …` : shown;
}
