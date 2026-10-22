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

/** A stat number on its own line: "+ 2500", "1,200", "~40" (a leading markdown escape is dropped first). */
const COUNTER_NUMBER = /^([+~≈]?) *([0-9][0-9.,]*)$/;
/** A unit a counter widget puts on its own line after the number. */
const COUNTER_UNIT = /^(%|[+]|[kKmMxX]|°)$/;
/** A stat label is short and is not a sentence or a heading. */
const COUNTER_LABEL_MAX_WORDS = 6;
/*
 * The counter code below is written without backslashes on purpose: a
 * backslash in a pasted edit is easily lost, which silently breaks a pattern.
 */
const BACKSLASH = String.fromCharCode(92);
const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);
/** Markdown escapes a leading "+" as a backslash and "+"; the backslash is dropped. */
const unescapeLead = (line: string) => (line.startsWith(BACKSLASH) ? line.slice(1) : line);
const hasLetter = (line: string) => line.toLowerCase() !== line.toUpperCase();

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
  const lines = (text || '').split(CR + LF).join(LF).split(CR).join(LF).split(LF);
  const out: string[] = [];
  const nextFilled = (from: number) => {
    let index = from;
    while (index < lines.length && !nonBlank(lines[index])) index += 1;
    return index;
  };
  for (let i = 0; i < lines.length; i++) {
    const match = unescapeLead(lines[i].trim()).match(COUNTER_NUMBER);
    if (!match || /^0+$/.test(match[2].replace(/[.,]/g, '')) || /^0[0-9]$/.test(match[2])) {
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
        !/^ {0,3}#{1,6} /.test(lines[labelAt]) &&
        !/^([-*+]|[0-9]+[.)]) /.test(label) &&
        !COUNTER_NUMBER.test(unescapeLead(label)) &&
        hasLetter(label) &&
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
  return out.join(LF);
}

/*
 * Section leftovers (2026-10-22). Seen on salesboostconsulting.com.mx: a fetched
 * page brings the small labels a theme prints above its headings
 * ("Certificaciones" above "### Resultados comprobados", "Soluciones" above
 * "## Servicios"), the blog teasers at the foot of a home page (title, a cut-off
 * first line, author and date), a lone menu link ("- ¿Quiénes somos?") and
 * "Leer más »" in front of a course name. Quick kept them and the scorer took
 * Structure points off for "orphaned fragments". A planned rewrite that left
 * them out scored 20 on Structure against Quick's 17.5.
 *
 * Written without backslashes on purpose: a backslash in a pasted edit is
 * easily lost, which silently breaks a pattern (see joinCounterLines).
 */
const SECTION_HEADING = /^ {0,3}#{1,6} /;
const SECTION_LIST_ITEM = /^ *([-*+•]|[0-9]+[.)]) /;
/** A section label has at most this many words. */
const SECTION_LABEL_MAX_WORDS = 4;
/** A link that leads somewhere ("Más sobre el seminario") is a pointer, not a label. */
const POINTER_START =
  /^(más|mas|ver|conoce|descubre|lee|leer|read|see|view|learn|discover|find|explore|explora|mehr|voir|scopri|saiba|veja)( |$)/i;
/** A button that asks for the action ("Agendar", "Book a call") is the call to action, not a label. */
const ACTION_START =
  /^(agenda|agendar|contacta|contáctanos|contactanos|cotiza|cotizar|compra|comprar|reserva|reservar|llama|llámanos|escribe|escríbenos|solicita|inscríbete|inscribete|regístrate|registrate|empieza|comienza|prueba|descarga|book|buy|call|contact|request|order|sign|join|try|start|get|schedule|download|subscribe|jetzt|kontakt|buchen|anfragen|kaufen|réserver|reserver|contactez|acheter|prenota|contatta|acquista|agende|compre|fale)( |$)/i;
/** A short line about an offer or a guarantee ("Envío gratis") is a fact, not a label. */
const OFFER_WORD =
  /(gratis|gratuit|free|sin costo|garant|guarant|descuento|discount|oferta|offer|promo|envío|envio|shipping|kostenlos|rabatt|angebot|offert|sconto|grátis|desconto)/i;
/** Words of the month in the languages Quick writes, for the dates under a blog teaser. */
const MONTH_WORD =
  /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december|januar|februar|märz|juni|juli|oktober|dezember|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|gennaio|febbraio|aprile|maggio|giugno|luglio|settembre|ottobre|dicembre|janeiro|fevereiro|março|maio|junho|julho|setembro|outubro|novembro|dezembro|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|ene|abr|ago|dic)/i;

const sectionWords = (text: string) => {
  const t = text.trim();
  return t ? t.split(/ +/).length : 0;
};
/** The line without list mark, heading marks and emphasis. */
const sectionPlain = (line: string) =>
  line
    .replace(SECTION_HEADING, '')
    .replace(SECTION_LIST_ITEM, '')
    .split('*').join('')
    .split('_').join('')
    .split('`').join('')
    .trim();

/** A short label that is not a sentence, a figure, a pointer or a call to action. */
function isSectionLabel(line: string): boolean {
  // A quote, a table row, or a name after a dash ("—Roberto Yelin", under a testimonial) is not a label.
  if (SECTION_HEADING.test(line) || SECTION_LIST_ITEM.test(line) || /^ *[>|—–-]/.test(line)) return false;
  const text = sectionPlain(line);
  const count = sectionWords(text);
  if (count === 0 || count > SECTION_LABEL_MAX_WORDS) return false;
  if (/[.!?…:;¿¡%$€]/.test(text) || /[0-9]/.test(text)) return false;
  if (POINTER_START.test(text) || ACTION_START.test(text) || OFFER_WORD.test(text)) return false;
  return /[a-záéíóúüñäöß]/i.test(text);
}

/** A date line under a blog teaser: "mayo 22, 2026", "22 de mayo de 2026", "2026-05-22". */
function isTeaserDate(text: string): boolean {
  if (sectionWords(text) > 6 || !/(19|20)[0-9][0-9]/.test(text)) return false;
  return MONTH_WORD.test(text) || /[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(text);
}

/** An author line under a blog teaser: a name of one to four words, no figures. */
function isTeaserAuthor(text: string): boolean {
  const count = sectionWords(text);
  return count >= 1 && count <= 4 && !/[0-9.!?:;,]/.test(text) && /^[A-ZÁÉÍÓÚÜÑÄÖ]/.test(text);
}

/**
 * Removes the section leftovers of a fetched page, whole lines only:
 *  - a blog teaser: a list of an author and a date, with the article next to
 *    it (a heading and its cut-off first line, no closing stop) under or over it;
 *  - a section label: one or two short lines straight above a heading, when
 *    the line before them is not a heading (a heading's subtitle stays) and
 *    the label appears only once on the page (a badge repeated above sibling
 *    headings, such as "Soon" above each plan, is information and stays);
 *  - a lone menu link: one list item on its own that is a short question
 *    ("- ¿Quiénes somos?");
 *  - "Leer más »" / "Read more »" in front of other words on the same line
 *    (only those words are taken off; the rest of the line stays).
 * A pointer to another page ("Más sobre el seminario") and a call to action
 * ("Agendar") are never taken as a label.
 */
export function stripSectionLeftovers(input: string[]): string[] {
  const lines = input.map(line =>
    line.replace(
      /^( *(?:[-*+•] +)?)(leer más|leer mas|ver más|ver mas|read more|learn more|weiterlesen|lire la suite|leggi di più|saiba mais|ler mais) *[»›→]+ +(?=[^ ])/i,
      '$1'
    )
  );
  const filled: number[] = [];
  lines.forEach((line, index) => {
    if (line.trim()) filled.push(index);
  });
  const textAt = (position: number) => (position >= 0 && position < filled.length ? lines[filled[position]] : '');
  const isHeadingAt = (position: number) => SECTION_HEADING.test(textAt(position));
  const isListAt = (position: number) => SECTION_LIST_ITEM.test(textAt(position));
  const gone = new Set<number>();
  const counts = new Map<string, number>();
  for (const index of filled) {
    const key = sectionPlain(lines[index]).toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Blog teasers.
  for (let position = 0; position < filled.length; position++) {
    if (!isListAt(position)) continue;
    let end = position;
    while (end + 1 < filled.length && isListAt(end + 1)) end += 1;
    const items: string[] = [];
    for (let k = position; k <= end; k++) items.push(sectionPlain(textAt(k)));
    const dates = items.filter(isTeaserDate).length;
    const authors = items.filter(item => !isTeaserDate(item) && isTeaserAuthor(item)).length;
    const teaser = items.length <= 3 && dates === 1 && dates + authors === items.length;
    if (teaser) {
      // The author and date sit under one article or above the next one,
      // depending on the theme: take the article on either side whose first
      // line is cut off.
      const cutOff = (k: number) => {
        const text = sectionPlain(textAt(k));
        return k >= 0 && k < filled.length && !isHeadingAt(k) && !isListAt(k) && sectionWords(text) <= 30 && !/[.!?…”»)]$/.test(text) && !text.endsWith(String.fromCharCode(34));
      };
      const found: number[] = [];
      if (cutOff(position - 1) && isHeadingAt(position - 2)) found.push(position - 2, position - 1);
      if (isHeadingAt(end + 1) && cutOff(end + 2)) found.push(end + 1, end + 2);
      if (found.length > 0) {
        for (let k = position; k <= end; k++) gone.add(filled[k]);
        for (const k of found) gone.add(filled[k]);
      }
    }
    position = end;
  }

  // Section labels straight above a heading, and the label above a teaser that is gone.
  for (let position = 0; position < filled.length; position++) {
    const nextKept = (() => {
      let k = position + 1;
      while (k < filled.length && gone.has(filled[k])) k += 1;
      return k;
    })();
    const aboveHeading = nextKept < filled.length && isHeadingAt(nextKept);
    const aboveGoneTeaser = position + 1 < filled.length && gone.has(filled[position + 1]);
    if (gone.has(filled[position]) || !isSectionLabel(textAt(position)) || !(aboveHeading || aboveGoneTeaser)) continue;
    const labels = [position];
    if (position - 1 >= 0 && !gone.has(filled[position - 1]) && isSectionLabel(textAt(position - 1))) labels.unshift(position - 1);
    const before = labels[0] - 1;
    if (before >= 0 && isHeadingAt(before)) continue;
    if (labels.some(k => (counts.get(sectionPlain(textAt(k)).toLowerCase()) ?? 0) > 1)) continue;
    for (const k of labels) gone.add(filled[k]);
  }

  // A lone menu link.
  for (let position = 0; position < filled.length; position++) {
    if (!isListAt(position) || isListAt(position - 1) || isListAt(position + 1)) continue;
    const text = sectionPlain(textAt(position));
    if (sectionWords(text) <= 3 && text.endsWith('?')) gone.add(filled[position]);
  }

  return gone.size === 0 ? lines : lines.filter((_, index) => !gone.has(index));
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

  // 2c — section labels above headings, blog teasers, a lone menu link,
  // and "Leer más »" in front of a name (see stripSectionLeftovers).
  lines = stripSectionLeftovers(lines);

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
    if (/^[+-]? *0 *%?$/.test(unescapeLead(key))) return false;
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
