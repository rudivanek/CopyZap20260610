/**
 * Quick — takes the copy from a web page.
 *
 * Uses the same Firecrawl path as "Analyze Deep Crawl" in the wizard and
 * converts the result to markdown so headings and lists survive.
 * It costs credits, so the screen calls it only when the user presses the button.
 */
import { User } from '../types';
import { getAdminClaudeModel } from '../constants';
import { analyzeUrlWithFirecrawl } from '../services/api/urlAnalysisFirecrawl';
import { supabase } from '../services/supabaseClient';
import { htmlToMarkdown } from '../utils/htmlToMarkdown';
import { countWords } from '../utils/markdownUtils';
import { QuickPipelineError } from './runQuickPipeline';

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

export async function fetchQuickPage(input: string, user: User, sessionId?: string): Promise<QuickPageCopy> {
  const url = normalizeQuickUrl(input);

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) throw new QuickPipelineError('no_access', 'Your login has expired. Please log in again.');

  let html: string;
  try {
    const result = await analyzeUrlWithFirecrawl(
      url,
      user.id,
      import.meta.env.VITE_SUPABASE_URL,
      session.access_token,
      'fullCopy',
      user.email,
      getAdminClaudeModel(),
      sessionId ?? null
    );
    html = result.mode === 'fullCopy' ? result.data.structuredCopy : '';
  } catch (error) {
    const reason = error instanceof Error && error.message ? error.message : 'The page could not be read.';
    throw new QuickPipelineError('fetch_failed', reason);
  }

  const copy = htmlToMarkdown(html).trim();
  if (!copy) throw new QuickPipelineError('fetch_failed', 'No copy was found on that page.');

  return { url, host: new URL(url).hostname.replace(/^www\./, ''), copy, words: countWords(copy) };
}
