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
  text = text.replace(/\\[ \t]*$/gm, '');

  const lines = text
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
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
const COOKIE_TAIL_LINES = 12;
/** The accessibility link most sites put first: "Skip to content", in the languages Quick writes. */
const SKIP_LINK =
  /^(skip to (the )?(main )?content|ir al contenido( principal)?|saltar al contenido( principal)?|zum inhalt (springen|wechseln)|aller au contenu( principal)?|vai al contenuto( principale)?|(ir|saltar|pular) para o conteúdo( principal)?)$/i;
const COOKIE_MAX_LINE_WORDS = 45;
const COOKIE_MAX_TOTAL_WORDS = 150;

/**
 * Removes page furniture that a fetch brings along with the copy:
 *
 *  - a cookie notice at the end (or at the very start) of the page
 *  - a short label repeated five times or more ("Ver testimonio", "- Web")
 *  - ordinal counters on their own line ("01", "03 — 07")
 *  - lines with no letters or digits at all (a "%" whose number was animated in)
 *  - a "skip to content" link at the top
 *  - the same label twice in a row
 *
 * It only ever removes whole lines of that kind. Sentences are never touched.
 * Used for fetched pages only; pasted text is left exactly as the user gave it.
 */
export function stripPageFurniture(text: string): { text: string; removed: number } {
  let lines = (text || '').replace(/\r\n?/g, '\n').split('\n');
  const before = lines.filter(nonBlank).length;

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
    if (SKIP_LINK.test(key)) return false;
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

  const cleaned = stripPageFurniture(cleanPageMarkdown(result.data.markdown));
  const copy = cleaned.text;
  if (!copy) throw new QuickPipelineError('fetch_failed', 'No copy was found on that page.');

  return {
    url,
    host: new URL(url).hostname.replace(/^www\./, ''),
    copy,
    words: countWords(copy),
    furnitureRemoved: cleaned.removed,
  };
}
