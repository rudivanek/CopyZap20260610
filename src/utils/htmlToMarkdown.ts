/**
 * Converts HTML markup to Markdown so the rendering layer (FormattedContent → markdownToHtml)
 * can reconstruct headings, bold, italics, lists and links from extracted page copy.
 *
 * Mirrors the shape of htmlToText.ts: early return when no HTML tags, entity decoding,
 * and whitespace collapsing. The difference is that tags map to Markdown syntax instead
 * of being stripped to bare text.
 *
 * Input is already-sanitised extraction output, not arbitrary user HTML.
 */
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const hasHtmlTags = /<[^>]+>/g.test(html);
  if (!hasHtmlTags) {
    return html;
  }

  let text = html;

  // Inline links → [text](url) (before stripping tags)
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, url, label) => {
    const cleanLabel = String(label).replace(/<[^>]+>/g, '').trim();
    return cleanLabel ? `[${cleanLabel}](${url})` : '';
  });

  // Inline emphasis
  text = text.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
  text = text.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');

  // Ordered lists → numbered items (numbering resets per <ol>)
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_block, inner: string) => {
    let n = 1;
    const converted = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m: string, item: string) => {
      return `${n++}. ${item.trim()}\n`;
    });
    return `\n\n${converted}\n`;
  });

  // Unordered lists / remaining <li> → dash items
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');

  // Headings → # .. ######
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n');
  text = text.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n\n##### $1\n\n');
  text = text.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n\n###### $1\n\n');

  // Paragraphs → text + blank line
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

  // Line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Block containers → inner text + newline
  text = text.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1\n');
  text = text.replace(/<section[^>]*>([\s\S]*?)<\/section>/gi, '$1\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.trim();

  return text;
}
