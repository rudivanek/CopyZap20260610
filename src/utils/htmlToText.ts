/**
 * Converts HTML markup to readable plain text while preserving structure
 * - Converts headings to capitalized text with spacing
 * - Converts paragraphs to text with line breaks
 * - Removes all HTML tags
 * - Preserves whitespace and formatting for readability
 */
export function htmlToText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // Check if the content actually contains HTML tags
  const hasHtmlTags = /<[^>]+>/g.test(html);
  if (!hasHtmlTags) {
    return html; // Return as-is if no HTML tags found
  }

  let text = html;

  // Convert headings to text with appropriate spacing
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n$1\n\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n$1\n\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n$1\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n\n$1\n');
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n\n$1\n');
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n\n$1\n');

  // Convert paragraphs to text with line breaks
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert list items
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');

  // Convert divs and sections to text with spacing
  text = text.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');
  text = text.replace(/<section[^>]*>(.*?)<\/section>/gi, '$1\n');

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
  text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
  text = text.replace(/[ \t]+/g, ' '); // Collapse spaces
  text = text.trim();

  return text;
}

/**
 * Checks if a string contains HTML tags
 */
export function containsHtml(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /<[^>]+>/g.test(text);
}
