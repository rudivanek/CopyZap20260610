/**
 * Quick — takes the copy from a web page.
 *
 * Asks the `analyze-url-firecrawl` edge function for the page in `rawCopy`
 * mode: the text exactly as Firecrawl extracted it, with no model re-typing it.
 * (The older `fullCopy` mode has a model rewrite the page, which shortened it
 * and cut it off after 4,000 tokens.) It costs credits, so the screen calls it
 * only when the user presses the button.
 */
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { countWords } from '../utils/markdownUtils';
import { QuickPipelineError } from './runQuickPipeline';

const FETCH_TIMEOUT_MS = 120000;

export interface QuickPageCopy {
  /** The address that was fetched, with https:// added when it was missing. */
  url: string;
  /** Host name, for display. */
  host: string;
  /** The page copy as markdown. */
  copy: string;
  words: number;
  /** Lines of page furniture (cookie notice, repeated labels, counters) that were left out. */
  furnitureRemoved: number;
}

/** Adds https:// when missing and checks the address. Throws QuickPipelineError('bad_url'). */
export function normalizeQuickUrl(input: string): string {
  let url = (input || '').trim();
  if (!url) throw new QuickPipelineError('bad_url', 'Please enter a page address.');
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.')) throw new Error('no dot');
    return parsed.toString();
  } catch {
    throw new QuickPipelineError('bad_url', 'That does not look like a page address.');
  }
}

/** Fewest short links in a row that count as a link bar. Two or three buttons side by side stay. */
const LINK_BAR_MIN_LINKS = 5;
const LINK_BAR_MAX_WORDS = 3;

/**
 * Removes link bars: five or more short links in a row, each on its own line
 * or list item with nothing but the link. That is how a menu, a row of
 * buttons-and-pills in a page's top section, or a footer link column arrives
 * in fetched markdown. The engine treats such a bar as a bullet list and
 * carries it into the new copy.
 *
 * It must run on the raw markdown, while links are still links: once their
 * addresses are stripped, a link bar cannot be told from an ordinary list of
 * benefits, which must stay. A single call-to-action link, or two or three
 * together, are not touched.
 */
export function stripLinkBars(markdown: string): { text: string; removed: number } {
  const lines = (markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const isShortLink = (line: string) => {
    const match = line.trim().match(/^(?:[-*+]\s+)?[*_]*\[([^\]!]+)\]\([^)]*\)[*_]*$/);
    if (!match) return false;
    const label = match[1].replace(/[*_`>]/g, '').trim();
    return label.length > 0 && label.split(/\s+/).length <= LINK_BAR_MAX_WORDS;
  };
  // Blank lines and list items left empty sit between the links of one bar.
  const isSpacer = (line: string) => /^\s*[-*+]?\s*$/.test(line);

  const drop = new Set<number>();
  let run: number[] = [];
  const flush = () => {
    if (run.length >= LINK_BAR_MIN_LINKS) run.forEach(index => drop.add(index));
    run = [];
  };
  lines.forEach((line, index) => {
    if (isShortLink(line)) run.push(index);
    else if (!isSpacer(line)) flush();
  });
  flush();

  return { text: lines.filter((_, index) => !drop.has(index)).join('\n'), removed: drop.size };
}

/**
 * Tidies page markdown for use as copy. It removes what is not copy (images,
 * link addresses, leftover HTML) and never changes the words themselves.
 */
export function cleanPageMarkdown(markdown: string): string {
  let text = (markdown || '').replace(/\r\n?/g, '\n');

  // Images, including images wrapped in links: no copy in them.
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  // Links: keep the visible text, drop the address. Links left empty are removed.
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Bare addresses in angle brackets.
  text = text.replace(/<https?:\/\/[^>\s]+>/gi, '');
  // Leftover HTML: line breaks become new lines, other tags go.
  text = text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[a-z][^>]*>/gi, '');
  // Markdown hard line breaks written as a trailing backslash.
  text = text.replace(/\\+(?=[ \t\u00a0*_]*$)/gm, '');

  const lines = text
    .split('\n')
    .map(line => line.replace(/[ \t\u00a0]+$/g, ''))
    .filter(line => {
      const bare = line.trim();
      if (/^https?:\/\/\S+$/i.test(bare)) return false; // a line that is only an address
      if (/^#{1,6}$/.test(bare)) return false; // a heading left empty
      if (/^([-*+]|\d+\.)$/.test(bare)) return false; // a list item left empty
      return true;
    });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const nonBlank = (line: string) => line.trim() !== '';
const wordsIn = (line: string) => (line.trim() ? line.trim().split(/\s+/).length : 0);
/** A horizontal rule: structure, not furniture. */
const isRuleLine = (line: string) => /^\s*([-*_])(\s*\1){2,}\s*$/.test(line);

/** How often a label must repeat before it counts as furniture. A call to action repeated two or three times stays. */
const REPEATED_LABEL_MIN = 5;
/** A repeated run of lines this long is a duplicate block, not a repeated call to action. */
const REPEATED_BLOCK_MIN_WORDS = 25;
const COOKIE_TAIL_LINES = 12;
/** The accessibility link most sites put first: "Skip to content", in the languages Quick writes. */
const SKIP_LINK =
  /^(skip to (the )?(main )?content|ir al contenido( principal)?|saltar al contenido( principal)?|zum inhalt (springen|wechseln)|aller au contenu( principal)?|vai al contenuto( principale)?|(ir|saltar|pular) para o conteúdo( principal)?)$/i;
/**
 * Lines a map widget, a "show more" counter or a details button brings along
 * (seen 2026-10-19 on longtimeplumb.com: "© Mapbox © OpenStreetMap Improve
 * this map", "Use two fingers to move the map", "List viewMap view", "+1 more",
 * and "View Drain Cleaning details" under each of eleven services). They are
 * controls, not copy. Only short lines: a sentence that mentions a map stays.
 */
const WIDGET_LINE =
  /(©\s*(mapbox|openstreetmap|google)|improve this map|mapbox homepage|map data ©|report a map error|use (two fingers|ctrl \+ scroll|⌘ \+ scroll|cmd \+ scroll) to (move|zoom)( the map)?|^list ?view ?map ?view$|^(vista de )?lista ?(vista de )?mapa$)/i;
const MORE_COUNTER = /^\+\s?\d+\s+(more|más|mas|mehr|plus|altri|mais)$/i;
const DETAILS_BUTTON = /^(view|see|ver|veja|voir|vedi|mehr zu|details zu)\s+(.{1,60}\s+)?(details|detalles|detalhes|détails|dettagli)(\s+(de|del|de la|of|von|du|des|di)\s+.{1,60})?$/i;
const WIDGET_MAX_WORDS = 12;
const COOKIE_MAX_LINE_WORDS = 45;
const COOKIE_MAX_TOTAL_WORDS = 150;

/** A stat number on its own line: "+ 2500", "\+ 25", "1,200", "~40". */
const COUNTER_NUMBER = /^\?([+~≈]?)\s*(\d[\d.,]*)$/;
/** A unit a counter widget puts on its own line after the number. */
const COUNTER_UNIT = /^(%|\+|[kKmMxX]|°)$/;
/** A stat label is short and is not a sentence or a heading. */
const COUNTER_LABEL_MAX_WORDS = 6;

/**
 * Joins a stat block back into one line per stat.
 *
 * Counter widgets put the number, its unit and its label in separate elements,
 * so a fetched page arrives as "+ 25" / "%" / "Aumento de Ventas" on three
 * lines. The lone "%" was then dropped as furniture and the number lost its
 * meaning. Joined, it reads "+25% Aumento de Ventas".
 *
 * The page's real numbers come from the server: analyze-url-firecrawl sets each
 * animated counter to its target value before the page is read (2026-10-21,
 * seen on salesboostconsulting.com.mx, where every counter read "+ 0"). A
 * counter still at 0 is not joined, so the "+ 0" rule below removes it.
 */
export function joinCounterLines(text: string): string {
  const lines = (text || '').replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  const nextFilled = (from: number) => {
    let index = from;
    while (index < lines.length && !nonBlank(lines[index])) index += 1;
    return index;
  };
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].trim().match(COUNTER_NUMBER);
    if (!match || /^0+$/.test(match[2].replace(/[.,]/g, '')) || /^0\d$/.test(match[2])) {
      out.push(lines[i]);
      continue;
    }
    let stat = `${match[1]}${match[2]}`;
    let last = i;
    const unitAt = nextFilled(i + 1);
    if (unitAt < lines.length && COUNTER_UNIT.test(lines[unitAt].trim())) {
      stat += lines[unitAt].trim();
      last = unitAt;
    }
    const labelAt = nextFilled(last + 1);
    if (labelAt < lines.length) {
      const label = lines[labelAt].trim();
      const isLabel =
        !/^\s{0,3}#{1,6}\s/.test(lines[labelAt]) &&
        !/^([-*+]|\d+[.)])\s/.test(label) &&
        !COUNTER_NUMBER.test(label) &&
        /\p{L}/u.test(label) &&
        wordsIn(label) <= COUNTER_LABEL_MAX_WORDS &&
        !/[.!?…:;]$/.test(label);
      if (isLabel) {
        stat += ` ${label}`;
        last = labelAt;
      }
    }
    // A bare number with neither unit nor label stays as it was.
    if (last === i) {
      out.push(lines[i]);
      continue;
    }
    out.push(stat);
    i = last;
  }
  return out.join('\n');
}

/**
 * Removes page furniture that a fetch brings along with the copy:
 *
 *  - a cookie notice at the end (or at the very start) of the page
 *  - a short label repeated five times or more ("Ver testimonio", "- Web")
 *  - ordinal counters on their own line ("01", "03 — 07")
 *  - lines with no letters or digits at all (a "%" whose number was animated in)
 *  - a counter that never started ("+ 0", "+ 0 %"): the number is animated in on the live page
 *  - a "skip to content" link at the top
 *  - a block the page contains twice (a slider's second copy of its slides)
 *  - the same label twice in a row
 *  - map widget controls, "+1 more" counters and "View … details" buttons
 *
 * It only ever removes whole lines of that kind. Sentences are never touched.
 * Used for fetched pages only; pasted text is left exactly as the user gave it.
 */
export function stripPageFurniture(text: string): { text: string; removed: number } {
  const before = (text || '').replace(/\r\n?/g, '\n').split('\n').filter(nonBlank).length;
  // 0 — stat blocks back to one line per stat, before a lone "%" is dropped below.
  let lines = joinCounterLines(text).split('\n');

  // 1 — cookie notice at the end: short lines from the first mention of cookies to the end.
  const filled = lines.map((line, index) => ({ line, index })).filter(item => nonBlank(item.line));
  const tail = filled.slice(-COOKIE_TAIL_LINES);
  const firstCookie = tail.find(item => /cookie/i.test(item.line));
  if (firstCookie) {
    const block = filled.filter(item => item.index >= firstCookie.index);
    const total = block.reduce((sum, item) => sum + wordsIn(item.line), 0);
    const inSecondHalf = filled.indexOf(firstCookie) >= Math.max(1, Math.floor(filled.length / 2));
    const plainLines = block.every(
      item => wordsIn(item.line) <= COOKIE_MAX_LINE_WORDS && !/^\s{0,3}#{1,6}\s/.test(item.line)
    );
    if (inSecondHalf && plainLines && total <= COOKIE_MAX_TOTAL_WORDS) {
      lines = lines.slice(0, firstCookie.index);
    }
  }

  // 2 — cookie notice at the very start: only when the page opens with it.
  const head = lines.map((line, index) => ({ line, index })).filter(item => nonBlank(item.line)).slice(0, 8);
  if (head.length > 0 && /cookie/i.test(head[0].line)) {
    let last = -1;
    let total = 0;
    for (const item of head) {
      if (/^\s{0,3}#{1,6}\s/.test(item.line) || wordsIn(item.line) > COOKIE_MAX_LINE_WORDS) break;
      total += wordsIn(item.line);
      if (total > COOKIE_MAX_TOTAL_WORDS) break;
      if (/cookie|accept|acept|akzept|accetta|aceitar|consent/i.test(item.line)) last = item.index;
    }
    if (last >= 0) lines = lines.slice(last + 1);
  }

  // 2b — a block the page contains twice. A slider keeps a second copy of its
  // slides in the page, so a row of testimonials arrives two times over. The
  // second copy goes. Only a repeat of REPEATED_BLOCK_MIN_WORDS words or more
  // counts: a call to action said twice is copy, not a duplicate.
  {
    const kept = lines.map((line, index) => ({ line, index, key: line.trim() })).filter(item => item.key !== '');
    const gone = new Set<number>();
    for (let i = 0; i < kept.length; i++) {
      if (gone.has(kept[i].index)) continue;
      for (let j = i + 1; j < kept.length; j++) {
        if (gone.has(kept[j].index) || kept[j].key !== kept[i].key) continue;
        let length = 0;
        let words = 0;
        while (
          i + length < j &&
          j + length < kept.length &&
          !gone.has(kept[j + length].index) &&
          kept[i + length].key === kept[j + length].key
        ) {
          words += wordsIn(kept[i + length].key);
          length += 1;
        }
        if (words >= REPEATED_BLOCK_MIN_WORDS) {
          for (let k = 0; k < length; k++) gone.add(kept[j + k].index);
          j += length - 1;
        }
      }
    }
    if (gone.size > 0) lines = lines.filter((_, index) => !gone.has(index));
  }

  // 3 — labels that repeat all over the page, and ordinal counters.
  const counts = new Map<string, number>();
  for (const line of lines) {
    const key = line.trim();
    if (key && !isRuleLine(line) && wordsIn(key.replace(/^([-*+]|\d+[.)])\s+/, '')) <= 4 && !/[.!?…:;"”»]$/.test(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  lines = lines.filter(line => {
    const key = line.trim();
    if (!key) return true;
    if ((counts.get(key) ?? 0) >= REPEATED_LABEL_MIN) return false;
    if (/^0\d$/.test(key) || /^\d{1,2}\s*[—–\-/]\s*\d{1,2}$/.test(key)) return false;
    if (!isRuleLine(line) && !/[\p{L}\p{N}]/u.test(key)) return false;
    if (/^\\?[+-]?\s*0\s*%?$/.test(key)) return false;
    if (SKIP_LINK.test(key)) return false;
    const plain = key.replace(/^([-*+]|\d+[.)])\s+/, '').replace(/[*_`]/g, '').trim();
    if (wordsIn(plain) <= WIDGET_MAX_WORDS && !/[.!?]$/.test(plain)) {
      if (WIDGET_LINE.test(plain) || MORE_COUNTER.test(key) || DETAILS_BUTTON.test(plain)) return false;
    }
    return true;
  });

  // 4 — the same short line twice in a row (a button rendered twice).
  const deduped: string[] = [];
  let previous = '';
  for (const line of lines) {
    const key = line.trim();
    if (key && key === previous && wordsIn(key) <= 6 && !isRuleLine(line)) continue;
    deduped.push(line);
    if (key) previous = key;
  }

  const result = deduped.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text: result, removed: Math.max(0, before - result.split('\n').filter(nonBlank).length) };
}

export async function fetchQuickPage(input: string, user: User, sessionId?: string): Promise<QuickPageCopy> {
  const url = normalizeQuickUrl(input);

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) throw new QuickPipelineError('no_access', 'Your login has expired. Please log in again.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let result: { success?: boolean; mode?: string; data?: { markdown?: unknown }; error?: string } | null;
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-url-firecrawl`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        user_id: user.id,
        user_email: user.email,
        extractMode: 'rawCopy',
        session_id: sessionId ?? null,
      }),
      signal: controller.signal,
    });

    result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new QuickPipelineError('fetch_failed', result?.error || `The page could not be read (${response.status}).`);
    }
  } catch (error) {
    if (error instanceof QuickPipelineError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new QuickPipelineError('fetch_failed', 'The page took too long to load. Please try again.');
    }
    const reason = error instanceof Error && error.message ? error.message : 'The page could not be read.';
    throw new QuickPipelineError('fetch_failed', reason);
  } finally {
    clearTimeout(timer);
  }

  // An older version of the server function does not know `rawCopy` and answers
  // in another shape. Say so plainly instead of showing an empty page.
  if (!result || result.mode !== 'rawCopy' || typeof result.data?.markdown !== 'string') {
    throw new QuickPipelineError(
      'fetch_failed',
      'Page fetching needs a server update that is not live yet (the analyze-url-firecrawl function).'
    );
  }

  // Link bars go first, while links are still links; then the text is tidied.
  const withoutBars = stripLinkBars(result.data.markdown);
  const cleaned = stripPageFurniture(cleanPageMarkdown(withoutBars.text));
  const copy = cleaned.text;
  if (!copy) throw new QuickPipelineError('fetch_failed', 'No copy was found on that page.');

  return {
    url,
    host: new URL(url).hostname.replace(/^www\./, ''),
    copy,
    words: countWords(copy),
    furnitureRemoved: cleaned.removed + withoutBars.removed,
  };
}
