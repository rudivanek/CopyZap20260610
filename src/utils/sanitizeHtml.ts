import DOMPurify from 'dompurify';
/**
 * Makes HTML safe to insert into the page.
 *
 * Copy shown in the app can come from a fetched web page, from pasted text or
 * from a model, so it is treated as untrusted: scripts, event handlers
 * (onerror, onclick, ...), javascript: links, forms, embedded frames and
 * images are removed. Ordinary formatting (headings, lists, tables, bold,
 * links, inline styles) is kept.
 */
const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: [
    'style', 'form', 'input', 'button', 'textarea', 'select', 'option',
    'img', 'picture', 'source', 'video', 'audio'
  ],
  FORBID_ATTR: ['srcset', 'action', 'formaction', 'background', 'ping'],
  // Links that open in a new tab keep doing so.
  ADD_ATTR: ['target']
};
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}
