/**
 * Shared helpers for turning generated content into readable text and for
 * cleaning model output that accidentally comes back as JSON.
 *
 * Previously each generation service (blend, boost, modify) reimplemented these,
 * and the implementations had drifted — notably blend did NOT handle structured
 * { headline, sections } objects and fed raw JSON into its prompt. Centralizing
 * keeps every output path consistent.
 */
import { cleanJsonResponse } from './utils';

/**
 * Convert any content shape (string, string[], or a structured
 * { headline, sections } object, possibly wrapped in { content: ... })
 * into clean, readable text.
 */
export function contentToText(content: any): string {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(contentToText).join('\n');

  if (typeof content === 'object') {
    // Unwrap { content: ... } wrappers (e.g. Alternative Copy with SEO metadata)
    if (content.content !== undefined && content.headline === undefined) {
      return contentToText(content.content);
    }

    // Structured { headline, sections } object
    if (content.headline) {
      const sections = Array.isArray(content.sections) ? content.sections : [];
      const body = sections
        .map((s: any) => {
          const heading = s?.title ? `${s.title}\n` : '';
          const text = s?.content || (Array.isArray(s?.listItems) ? s.listItems.join('\n') : '');
          return `${heading}${text}`;
        })
        .join('\n\n');
      return `${content.headline}\n\n${body}`.trim();
    }
  }

  return JSON.stringify(content);
}

/**
 * Strip accidental ```json / ``` code fences from model output, and if the model
 * returned a { headline, sections } JSON object despite being told not to, convert
 * it back into clean markdown. Returns readable text either way.
 */
export function stripToMarkdown(raw: string): string {
  let text = (raw || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (text.startsWith('{') && text.includes('"headline"')) {
    try {
      const parsed = JSON.parse(cleanJsonResponse(text));
      let md = `# ${parsed.headline}\n\n`;
      if (Array.isArray(parsed.sections)) {
        md += parsed.sections
          .map((s: any) => `## ${s.title}\n\n${s.content}`)
          .join('\n\n');
      }
      text = md.trim();
    } catch {
      // Not valid JSON after all — leave the text as-is.
    }
  }

  return text;
}