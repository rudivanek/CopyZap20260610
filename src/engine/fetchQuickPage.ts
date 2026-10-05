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
  text = text.replace(/\\$/gm, '');

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

  const copy = cleanPageMarkdown(result.data.markdown);
  if (!copy) throw new QuickPipelineError('fetch_failed', 'No copy was found on that page.');

  return { url, host: new URL(url).hostname.replace(/^www\./, ''), copy, words: countWords(copy) };
}
