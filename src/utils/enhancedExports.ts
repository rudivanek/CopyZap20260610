import { FormState, GeneratedContentItem, GeneratedContentItemType, StructuredCopyOutput, VersionDeepAnalysis, ComparisonDeepAnalysisMeta, ScoringContext } from '../types';
import { PromptEvaluation } from '../types';
import { ComparisonResult } from '../services/api/comprehensiveScoring';
import { structuredToPlainText, markdownToHtml } from './copyFormatter';
import { getScoreLabel } from './scoreColors';
import { stripMarkdown } from './markdownUtils';
import { getComparisonDelta } from './comparisonDelta';
import {
  calculateMultiScoreDisplay,
  computeEditorialQuality,
  computeConversionPotential,
  computePersuasionBreakdown,
  computeAudienceFit,
  computeRiskFactors,
  computeWordCountAndReadingLevel,
  classifyWinnerType,
  computeEvaluationConfidence,
  computeConversionStrategy,
  computeCommercialIntensity,
  computeMostLikelyConversionDriver,
} from './multiScoreDisplay';
import { getDecisionBadgeForVersion, getBadgeStyles, DecisionBadge } from './decisionBadges';
import { formatLocalDateTime } from './dateFormatting';
import { generateExportAnalysis } from './contentAnalysisForExport';
import { calculateTargetWordCount } from '../services/api/utils';
import jsPDF from 'jspdf';

function formatExportTimestamp(d: Date = new Date()): string {
  // Use toLocaleString() to get full date and time in user's locale
  return d.toLocaleString();
}

/**
 * Normalize copy content for LLM evaluation export.
 * Converts all formats (markdown, plain text, HTML, structured) into consistent clean HTML.
 * Removes UI noise, normalizes spacing, preserves meaning exactly.
 *
 * @param content - Any copy content (string, structured object, or HTML)
 * @returns Clean normalized HTML string
 */
function normalizeCopyForLLMExport(content: any): string {
  if (!content) return '';

  let htmlContent = '';

  // Handle structured content (headline + sections)
  if (typeof content === 'object' && content !== null && 'headline' in content && 'sections' in content) {
    const structured = content as StructuredCopyOutput;

    // Add headline as H1
    if (structured.headline) {
      htmlContent += `<h1>${escapeHtml(stripMarkdown(structured.headline))}</h1>\n`;
    }

    // Process sections
    structured.sections.forEach(section => {
      if (section && section.title) {
        // Add section title as H2
        htmlContent += `<h2>${escapeHtml(stripMarkdown(section.title))}</h2>\n`;

        // Add section content
        if (section.content) {
          const cleanContent = stripMarkdown(section.content).trim();
          if (cleanContent) {
            htmlContent += `<p>${escapeHtml(cleanContent)}</p>\n`;
          }
        }

        // Add list items
        if (section.listItems && section.listItems.length > 0) {
          htmlContent += '<ul>\n';
          section.listItems.forEach(item => {
            const cleanItem = stripMarkdown(item).trim();
            if (cleanItem) {
              htmlContent += `  <li>${escapeHtml(cleanItem)}</li>\n`;
            }
          });
          htmlContent += '</ul>\n';
        }
      }
    });
  }
  // Handle plain string content
  else if (typeof content === 'string') {
    htmlContent = convertMarkdownToCleanHtml(content);
  }
  // Handle nested content object
  else if (typeof content === 'object' && content !== null && 'content' in content) {
    return normalizeCopyForLLMExport((content as any).content);
  }
  // Fallback for other types
  else {
    htmlContent = `<p>${escapeHtml(String(content))}</p>\n`;
  }

  // Remove UI labels and structural noise
  htmlContent = removeUILabels(htmlContent);

  // Normalize spacing
  htmlContent = normalizeSpacing(htmlContent);

  return htmlContent.trim();
}

/**
 * Convert markdown text to clean HTML.
 * Handles headings, bold, italic, lists, paragraphs.
 */
function convertMarkdownToCleanHtml(text: string): string {
  if (!text || !text.trim()) return '';

  let html = text;

  // Remove common UI labels before processing
  html = removeUILabels(html);

  // Convert markdown headings to HTML
  // ### Heading → <h3>Heading</h3>
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Convert markdown lists to HTML
  // Process unordered lists (-, *, •)
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a list item
    const listMatch = trimmed.match(/^[-*•]\s+(.+)$/);

    if (listMatch) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      // Remove markdown formatting from list item content
      const itemContent = listMatch[1]
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      processedLines.push(`  <li>${itemContent}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Convert markdown bold/italic to HTML
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Split into paragraphs (double newline separated)
  const paragraphs = html.split(/\n\s*\n/);
  const htmlParagraphs: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Skip if already HTML tagged
    if (trimmed.startsWith('<h1>') || trimmed.startsWith('<h2>') ||
        trimmed.startsWith('<h3>') || trimmed.startsWith('<ul>')) {
      htmlParagraphs.push(trimmed);
    } else if (!trimmed.includes('<li>')) {
      // Wrap non-heading, non-list content in <p>
      htmlParagraphs.push(`<p>${trimmed}</p>`);
    } else {
      htmlParagraphs.push(trimmed);
    }
  }

  return htmlParagraphs.join('\n');
}

/**
 * Remove common UI labels that aren't part of actual copy.
 * Examples: "Hero:", "Benefits:", "CTA:", "Section:", etc.
 */
function removeUILabels(text: string): string {
  // Common section labels to remove
  const labelPatterns = [
    /^Hero:\s*/gim,
    /^Headline:\s*/gim,
    /^Subheadline:\s*/gim,
    /^Benefits:\s*/gim,
    /^Features:\s*/gim,
    /^CTA:\s*/gim,
    /^Call to Action:\s*/gim,
    /^Section:\s*/gim,
    /^Section \d+:\s*/gim,
    /^Body:\s*/gim,
    /^Content:\s*/gim,
    /^Main Copy:\s*/gim,
    /^Opening:\s*/gim,
    /^Closing:\s*/gim,
    /^Introduction:\s*/gim,
    /^Conclusion:\s*/gim,
    /^\[.*?\]:\s*/gim, // [Label]: format
  ];

  let cleaned = text;
  labelPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  return cleaned;
}

/**
 * Normalize spacing in HTML content.
 * Removes excessive line breaks, ensures proper paragraph separation.
 */
function normalizeSpacing(html: string): string {
  let normalized = html;

  // Remove excessive whitespace within lines
  normalized = normalized.replace(/[ \t]+/g, ' ');

  // Normalize line breaks (max 2 consecutive)
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  // Clean up spacing around HTML tags
  normalized = normalized.replace(/>\s+</g, '>\n<');

  // Remove leading/trailing whitespace from each line
  normalized = normalized.split('\n')
    .map(line => line.trim())
    .join('\n');

  // Remove empty lines between closing and opening tags
  normalized = normalized.replace(/<\/(h[123]|p|li)>\n+</g, '</$1>\n<');

  return normalized;
}

/**
 * Escape HTML special characters to prevent injection.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalize copy content for Markdown export.
 * Converts all formats (markdown, plain text, structured) into consistent clean markdown.
 * Removes UI noise, normalizes spacing, preserves meaning exactly.
 * Produces the SAME structure as HTML export and visible app UI.
 *
 * @param content - Any copy content (string, structured object, etc.)
 * @returns Clean normalized markdown string
 */
export function normalizeCopyForMarkdownExport(content: any): string {
  if (!content) return '';

  let markdown = '';

  // Handle structured content (headline + sections)
  if (typeof content === 'object' && content !== null && 'headline' in content && 'sections' in content) {
    const structured = content as StructuredCopyOutput;

    // Add headline as H1
    if (structured.headline) {
      const cleanHeadline = stripMarkdown(structured.headline).trim();
      markdown += `# ${cleanHeadline}\n\n`;
    }

    // Process sections
    structured.sections.forEach(section => {
      if (section && section.title) {
        // Add section title as H2
        const cleanTitle = stripMarkdown(section.title).trim();
        markdown += `## ${cleanTitle}\n\n`;

        // Add section content
        if (section.content) {
          const cleanContent = stripMarkdown(section.content).trim();
          if (cleanContent) {
            markdown += `${cleanContent}\n\n`;
          }
        }

        // Add list items
        if (section.listItems && section.listItems.length > 0) {
          section.listItems.forEach(item => {
            const cleanItem = stripMarkdown(item).trim();
            if (cleanItem) {
              markdown += `- ${cleanItem}\n`;
            }
          });
          markdown += `\n`;
        }
      }
    });
  }
  // Handle plain string content
  else if (typeof content === 'string') {
    markdown = convertToCleanMarkdown(content);
  }
  // Handle nested content object
  else if (typeof content === 'object' && content !== null && 'content' in content) {
    return normalizeCopyForMarkdownExport((content as any).content);
  }
  // Fallback for other types
  else {
    markdown = String(content);
  }

  // Remove UI labels and structural noise
  markdown = removeUILabelsFromMarkdown(markdown);

  // Normalize spacing
  markdown = normalizeMarkdownSpacing(markdown);

  return markdown.trim();
}

/**
 * Convert text to clean markdown format.
 * Preserves markdown syntax but removes UI labels.
 */
function convertToCleanMarkdown(text: string): string {
  if (!text || !text.trim()) return '';

  let markdown = text;

  // Remove UI labels before processing
  markdown = removeUILabelsFromMarkdown(markdown);

  // Normalize spacing
  markdown = normalizeMarkdownSpacing(markdown);

  return markdown;
}

/**
 * Remove common UI labels from markdown content.
 * Examples: "Hero:", "Benefits:", "CTA:", "Section:", etc.
 */
function removeUILabelsFromMarkdown(text: string): string {
  // Common section labels to remove
  const labelPatterns = [
    /^Hero:\s*/gim,
    /^Headline:\s*/gim,
    /^Subheadline:\s*/gim,
    /^Benefits:\s*/gim,
    /^Features:\s*/gim,
    /^CTA:\s*/gim,
    /^Call to Action:\s*/gim,
    /^Section:\s*/gim,
    /^Section \d+:\s*/gim,
    /^Body:\s*/gim,
    /^Content:\s*/gim,
    /^Main Copy:\s*/gim,
    /^Opening:\s*/gim,
    /^Closing:\s*/gim,
    /^Introduction:\s*/gim,
    /^Conclusion:\s*/gim,
    /^\[.*?\]:\s*/gim, // [Label]: format
  ];

  let cleaned = text;
  labelPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  return cleaned;
}

/**
 * Normalize spacing in markdown content.
 * Removes excessive line breaks, ensures proper paragraph separation.
 */
function normalizeMarkdownSpacing(markdown: string): string {
  let normalized = markdown;

  // Remove excessive whitespace within lines
  normalized = normalized.replace(/[ \t]+/g, ' ');

  // Normalize line breaks (max 2 consecutive for paragraph separation)
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  // Remove leading/trailing whitespace from each line
  normalized = normalized.split('\n')
    .map(line => line.trim())
    .join('\n');

  // Ensure proper spacing after headings
  normalized = normalized.replace(/(#{1,6}\s+.+)\n([^\n#])/g, '$1\n\n$2');

  // Ensure proper spacing after lists
  normalized = normalized.replace(/(-\s+.+)\n([^-\n])/g, '$1\n\n$2');

  return normalized;
}

// Helper functions for comprehensive score explanations
function getConversionExplanation(score: number): string {
  if (score >= 80) {
    return "Strong persuasive elements and clear value proposition drive action effectively.";
  } else if (score >= 60) {
    return "Moderate persuasiveness with room to strengthen urgency and call-to-action.";
  } else if (score >= 40) {
    return "Value is present but lacks compelling urgency or strong motivators for action.";
  } else {
    return "Limited persuasive elements; needs stronger value proposition and clearer call-to-action.";
  }
}

function getTrustExplanation(score: number): string {
  if (score >= 80) {
    return "Highly credible with authentic tone, strong proof points, and trustworthy language.";
  } else if (score >= 60) {
    return "Generally credible but could benefit from more proof or softer claims.";
  } else if (score >= 40) {
    return "Some credibility concerns; claims may feel exaggerated or lack supporting evidence.";
  } else {
    return "Credibility issues detected; tone or claims may seem untrustworthy or overly aggressive.";
  }
}

function getRiskExplanation(risk: string): string {
  if (risk === 'Low') {
    return "Safe, professional tone with no red flags for spam or compliance issues.";
  } else if (risk === 'Medium') {
    return "Generally safe but contains elements that could raise minor concerns in certain contexts.";
  } else {
    return "Contains language patterns that may trigger spam filters or compliance concerns.";
  }
}

interface SeoMetadata {
  urlSlugs?: string[];
  metaDescriptions?: string[];
  h1Variants?: string[];
  h2Headings?: string[];
  h3Headings?: string[];
  ogTitles?: string[];
  ogDescriptions?: string[];
}

/**
 * Convert HTML string to readable plain-text markdown.
 * Handles headings, lists, links, bold/italic, paragraphs.
 */
const htmlToMarkdownText = (html: string): string => {
  if (!html || !html.trim()) return '';

  const stripInlineTags = (s: string) => s.replace(/<[^>]+>/g, '');

  let text = html;

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...');

  // Links: <a href="url">text</a> → text (url)
  // Same-page anchors (#, #section) or empty hrefs → just the anchor text
  text = text.replace(/<a[^>]+href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_match, url, linkText) => {
    const clean = stripInlineTags(linkText).trim();
    if (!url || url === '#' || url.startsWith('#') || url.startsWith('javascript')) return clean;
    return clean ? `${clean} (${url})` : url;
  });

  // Headings → markdown headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t) => `\n## ${stripInlineTags(t).trim()}\n\n`);
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => `\n### ${stripInlineTags(t).trim()}\n\n`);
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, t) => `\n#### ${stripInlineTags(t).trim()}\n\n`);
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_m, t) => `\n**${stripInlineTags(t).trim()}**\n\n`);
  text = text.replace(/<h[56][^>]*>([\s\S]*?)<\/h[56]>/gi, (_m, t) => `\n**${stripInlineTags(t).trim()}**\n\n`);

  // Bold / italic
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, t) => `**${t}**`);
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_m, t) => `**${t}**`);
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_m, t) => `*${t}*`);
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_m, t) => `*${t}*`);

  // List items
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => `- ${stripInlineTags(t).trim()}\n`);
  text = text.replace(/<\/?[uo]l[^>]*>/gi, '\n');

  // Paragraphs and block elements
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');

  // Strip any remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Normalize whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
};

/**
 * Wrap multi-line text as a markdown blockquote (> prefix on each line).
 */
const toBlockquote = (text: string): string => {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n');
};

const MAX_EXPORT_TESTIMONIALS = 3;

/**
 * Remove lines that are purely navigation noise (Previous, Next, page numbers, bare arrows, etc.)
 */
const removeNavNoise = (text: string): string => {
  const NAV_LINE_RE = /^(previous|next|prev|back|forward|home|menu|breadcrumb|skip to (?:content|main)|read more|see more|learn more|click here|continue reading?|view all|show more|load more|[←→‹›«»<>]+|\d+(\s*of\s*\d+)?|page\s*\d+(\s+of\s+\d+)?|→|←|›|‹)$/i;
  return text
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      return !NAV_LINE_RE.test(trimmed);
    })
    .join('\n');
};

/**
 * If a paragraph ends mid-word (last word < 5 chars, no terminal punctuation), append "…"
 */
const fixTruncatedFragments = (text: string): string => {
  const TERMINAL_PUNCT = /[.!?;:\u2026)\]"'»›—\-]$/;
  return text
    .split(/\n\n+/)
    .map(para => {
      const trimmed = para.trimEnd();
      if (!trimmed) return para;
      if (TERMINAL_PUNCT.test(trimmed)) return para;
      const lastWord = trimmed.split(/\s+/).pop() ?? '';
      if (lastWord.length > 0 && lastWord.length < 5 && /[a-zA-ZÀ-ÿ]$/.test(lastWord)) {
        return trimmed + '…';
      }
      return para;
    })
    .join('\n\n');
};

/**
 * Limit the Testimonials section to MAX_EXPORT_TESTIMONIALS entries.
 * Counts testimonial "units" as double-newline-separated blocks inside the section.
 */
const limitTestimonials = (text: string): string => {
  const headingRe = /^(#{1,4})\s*(testimonials?|reviews?|what (?:our )?(?:clients?|customers?|people) (?:say|think)|client feedback)\s*$/im;
  const match = headingRe.exec(text);
  if (!match) return text;

  const headingStart = match.index;
  const headingLine = match[0];
  const afterHeading = text.slice(headingStart + headingLine.length).replace(/^\n+/, '\n\n');
  const headingDepth = match[1].length;

  const nextHeadingRe = new RegExp(`^#{1,${headingDepth}}\\s`, 'm');
  const nextMatch = nextHeadingRe.exec(afterHeading);
  const sectionBody = nextMatch ? afterHeading.slice(0, nextMatch.index) : afterHeading;
  const remainder = nextMatch ? afterHeading.slice(nextMatch.index) : '';

  const units = sectionBody.split(/\n\n+/).filter(u => u.trim().length > 0);
  if (units.length <= MAX_EXPORT_TESTIMONIALS) return text;

  const kept = units.slice(0, MAX_EXPORT_TESTIMONIALS);
  const hidden = units.length - MAX_EXPORT_TESTIMONIALS;
  const trimmedBody = kept.join('\n\n') + `\n\n*(... +${hidden} more testimonials not shown)*`;

  return text.slice(0, headingStart) + headingLine + '\n\n' + trimmedBody + '\n\n' + remainder;
};

/**
 * Full pipeline: HTML → plain text → remove nav noise → fix truncation → limit testimonials.
 */
const cleanSourceContent = (raw: string): string => {
  if (!raw || !raw.trim()) return '';
  const asText = htmlToMarkdownText(raw);
  const noNav = removeNavNoise(asText);
  const fixedTrunc = fixTruncatedFragments(noNav);
  return limitTestimonials(fixedTrunc);
};

/** Strip emoji characters from display labels for clean editorial output */
const stripEmoji = (text: string): string =>
  text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}]/gu, '').replace(/\s{2,}/g, ' ').trim();

/** Strip colored span wrappers from copy body HTML — preserves inner text, removes color styling */
const stripColoredSpans = (html: string): string =>
  html.replace(/<span[^>]*style="[^"]*color\s*:[^"]*"[^>]*>(.*?)<\/span>/gs, '$1');

/**
 * Get score color based on value (matches app's getScoreTextClass utility)
 */
const getScoreColor = (score: number): string => {
  if (score >= 90) return '#374151'; // gray-700
  if (score >= 75) return '#4b5563'; // gray-600
  if (score >= 60) return '#6b7280'; // gray-500
  return '#9ca3af'; // gray-400
};

/**
 * Generate premium document-style HTML for a single variant card.
 */
export const generateFullHtmlExportForCard = (
  card: GeneratedContentItem,
  targetWordCount?: number,
  winnerVersionId?: string,
  scoringContext?: ScoringContext,
  allComparison?: ComparisonResult
): string => {
  let html = '';

  // Extract content
  let actualContent = card.content;
  if (typeof card.content === 'object' && card.content !== null && 'content' in card.content) {
    actualContent = (card.content as any).content;
  }
  const isStructured = typeof actualContent === 'object' && actualContent !== null && 'headline' in actualContent && 'sections' in actualContent;

  // Copy kind and label for data attributes
  let copyKind = 'generated';
  if (card.type === GeneratedContentItemType.Original) copyKind = 'original';
  else if (card.persona) copyKind = 'voice';
  else if (card.modificationInstruction) copyKind = 'modified';
  const copyLabel = stripEmoji(card.sourceDisplayName || card.type);

  // Variant type label
  let variantTypeLabel = 'GENERATED';
  if (card.type === GeneratedContentItemType.Original) variantTypeLabel = 'ORIGINAL';
  else if (card.persona) variantTypeLabel = 'VOICE ADAPTATION';
  else if (card.sourceDisplayName?.toLowerCase().includes('geo')) variantTypeLabel = 'GEO PACKAGE';
  else if (card.blendInstructions) variantTypeLabel = 'BLENDED';
  else if (card.modificationInstruction) variantTypeLabel = 'MODIFIED';
  else if (card.boostIteration) variantTypeLabel = 'BOOSTED';

  const isWinner = card.id === winnerVersionId;

  // Score color
  const scoreVal = card.score?.overall ?? 0;
  let scoreColor = '#dc2626';
  if (scoreVal >= 90) scoreColor = '#16a34a';
  else if (scoreVal >= 80) scoreColor = '#111827';
  else if (scoreVal >= 70) scoreColor = '#d97706';

  // Section with page-break-before for print
  html += `<section id="output-${card.id}" data-copy-id="${card.id}" data-copy-kind="${copyKind}" data-copy-label="${escapeHtml(copyLabel)}" style="page-break-before: always; margin-bottom: 0; padding-top: 16px;">\n`;

  // Section header
  html += `<span style="display:inline-block;background:#374151;color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding:2px 10px;border-radius:999px;margin-bottom:10px;">${variantTypeLabel}</span>\n`;
  html += '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;">\n';
  html += '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;">\n';
  html += `<h2 style="font-size:22px;font-weight:700;color:#111827;margin:0;">${escapeHtml(copyLabel)}</h2>\n`;
  if (isWinner) {
    html += '<span style="color:#f97316;font-size:13px;font-weight:700;">&#9733; Winner</span>\n';
  }
  if (card.persona) {
    html += `<span style="color:#374151;font-size:12px;font-weight:500;background:#f3f4f6;border:1px solid #d1d5db;padding:2px 8px;border-radius:4px;">${card.persona}</span>\n`;
  }
  html += '</div>\n';
  if (card.score) {
    html += `<div style="display:inline-flex;align-items:baseline;gap:4px;border:1px solid #e5e7eb;border-radius:8px;padding:8px 16px;">\n`;
    html += `<span style="font-size:32px;font-weight:700;color:${scoreColor};line-height:1;">${card.score.overall}</span>\n`;
    html += `<span style="font-size:14px;font-weight:400;color:#9ca3af;">/100</span>\n`;
    html += `</div>\n`;
  }
  html += '</div>\n';
  html += '<div style="border-top:1px solid #e5e7eb;margin:12px 0 28px;"></div>\n';

  // Copy body
  html += '<div data-copy-body="true" style="background:#ffffff;border-left:1px solid #e5e7eb;padding:24px 28px;border-radius:0 6px 6px 0;font-size:15px;line-height:1.8;color:#374151;margin-bottom:36px;">\n';
  if (isStructured && actualContent) {
    const structured = actualContent as StructuredCopyOutput;
    html += `<p style="font-size:18px;font-weight:700;color:#111827;margin:0 0 16px 0;">${stripMarkdown(structured.headline)}</p>\n`;
    structured.sections.forEach(section => {
      if (section && section.title) {
        html += `<p style="font-weight:600;color:#374151;margin:16px 0 6px 0;">${stripMarkdown(section.title)}</p>\n`;
        if (section.content) html += `<p style="white-space:pre-wrap;margin:0 0 12px 0;">${stripMarkdown(section.content)}</p>\n`;
        if (section.listItems?.length) {
          html += '<ul style="margin:8px 0 12px 0;padding-left:20px;">\n';
          section.listItems.forEach(item => { html += `<li style="margin:4px 0;">${stripMarkdown(item)}</li>\n`; });
          html += '</ul>\n';
        }
      }
    });
  } else {
    const plainText = typeof actualContent === 'string' ? actualContent : JSON.stringify(actualContent);
    html += `<div>${stripColoredSpans(markdownToHtml(plainText))}</div>\n`;
  }
  html += '</div>\n';

  // Quality Score block
  if (card.score) {
    html += '<div style="margin-bottom:32px;">\n';
    html += `<p style="font-size:11px;letter-spacing:0.1em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 12px 0;">QUALITY SCORE</p>\n`;

    if (card.score.improvementExplanation) {
      html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 6px 0;">WHY IT\'S IMPROVED</p>\n';
      html += `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px 0;">${card.score.improvementExplanation}</p>\n`;
    }

    html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 10px 0;">SCORE BREAKDOWN</p>\n';
    html += '<dl style="margin:0 0 20px 0;">\n';
    html += `<dt style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 2px 0;">Clarity</dt><dd style="color:#374151;font-size:14px;margin:0 0 12px 0;">${card.score.clarity}</dd>\n`;
    html += `<dt style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 2px 0;">Persuasiveness</dt><dd style="color:#374151;font-size:14px;margin:0 0 12px 0;">${card.score.persuasiveness}</dd>\n`;
    html += `<dt style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 2px 0;">Tone Match</dt><dd style="color:#374151;font-size:14px;margin:0 0 12px 0;">${card.score.toneMatch}</dd>\n`;
    html += `<dt style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 2px 0;">Engagement</dt><dd style="color:#374151;font-size:14px;margin:0 0 12px 0;">${card.score.engagement}</dd>\n`;

    // Word Count + Reading Level — computed from actual content text
    const cardPlainText = isStructured
      ? structuredToPlainText(actualContent as StructuredCopyOutput)
      : (typeof actualContent === 'string' ? actualContent : Array.isArray(actualContent) ? (actualContent as string[]).join('\n') : '');
    const cardWcrl = cardPlainText ? computeWordCountAndReadingLevel(cardPlainText) : null;
    if (cardWcrl) {
      html += `<dt style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 2px 0;">Word Count</dt><dd style="color:#374151;font-size:14px;margin:0 0 12px 0;">${cardWcrl.wordCount} words</dd>\n`;
      html += `<dt style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 2px 0;">Reading Level</dt><dd style="color:#374151;font-size:14px;margin:0 0 12px 0;">${cardWcrl.readingLevel}</dd>\n`;
    } else {
      html += `<dt style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 2px 0;">Word Count</dt><dd style="color:#374151;font-size:14px;margin:0 0 12px 0;">—</dd>\n`;
    }
    // Word Count Accuracy vs target (kept separately when available)
    if (typeof card.score.wordCountAccuracy === 'number') {
      const wca = card.score.wordCountAccuracy;
      const wcaLabel = wca >= 90 ? 'Excellent match' : wca >= 75 ? 'Good match' : wca >= 60 ? 'Acceptable match' : 'Poor match';
      html += `<dt style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 2px 0;">Word Count vs Target</dt><dd style="color:#374151;font-size:14px;margin:0 0 12px 0;">${wca}/100 — ${wcaLabel}</dd>\n`;
    }
    html += '</dl>\n';

    if (card.score.suggestions && card.score.suggestions.length > 0) {
      html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 8px 0;">OPTIMIZATION SUGGESTIONS</p>\n';
      html += '<ul style="margin:0 0 0 0;padding-left:20px;color:#374151;">\n';
      card.score.suggestions.forEach(s => { html += `<li style="font-size:14px;line-height:1.6;margin:4px 0;">${s}</li>\n`; });
      html += '</ul>\n';
    }
    html += '</div>\n';
  }

  // Sub-scores (Conversion / Trust / Risk) — computed on the fly
  const contentForScoring = typeof actualContent === 'string'
    ? actualContent
    : (actualContent && typeof actualContent === 'object' && 'headline' in actualContent)
      ? structuredToPlainText(actualContent as StructuredCopyOutput) : '';

  if (contentForScoring.trim()) {
    const sub = calculateMultiScoreDisplay(contentForScoring);
    const analysis = generateExportAnalysis(contentForScoring);

    html += '<div style="margin-bottom:32px;">\n';
    html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 8px 0;">SUB-SCORES</p>\n';
    html += `<p style="font-size:13px;color:#6b7280;margin:0 0 8px 0;">Conversion: <strong style="color:#111827;">${sub.conversion}/100</strong> &nbsp;·&nbsp; Trust: <strong style="color:#111827;">${sub.trust}/100</strong> &nbsp;·&nbsp; Risk: <strong style="color:#111827;">${sub.risk}</strong></p>\n`;

    const convExp = sub.conversion >= 60 ? 'Moderate persuasiveness with room to strengthen urgency and CTA.'
      : sub.conversion >= 45 ? 'Value present but lacks compelling urgency or strong motivators.'
      : 'Limited persuasive elements; needs stronger value proposition and clearer CTA.';
    const trustExp = sub.trust >= 60 ? 'Generally credible but could benefit from more proof or softer claims.'
      : sub.trust >= 40 ? 'Some credibility concerns; claims may feel exaggerated or lack evidence.'
      : 'Credibility issues detected; tone or claims may seem untrustworthy.';
    const riskExp = sub.risk === 'Low' ? 'Safe, professional tone — no red flags for spam or compliance.'
      : sub.risk === 'Medium' ? 'Generally safe but contains elements that could raise minor concerns.'
      : 'Contains language patterns that may trigger spam filters or compliance concerns.';
    html += `<p style="font-size:13px;color:#6b7280;font-style:italic;margin:2px 0;">Conversion: ${convExp}</p>\n`;
    html += `<p style="font-size:13px;color:#6b7280;font-style:italic;margin:2px 0;">Trust: ${trustExp}</p>\n`;
    html += `<p style="font-size:13px;color:#6b7280;font-style:italic;margin:2px 0;">Risk: ${riskExp}</p>\n`;

    // Absolute Score breakdown removed — scores shown in rankings table only

    if (analysis.keyStrengths?.length || analysis.suggestedImprovements?.length) {
      html += '<div style="border-top:1px solid #e5e7eb;margin:16px 0;"></div>\n';
      if (analysis.keyStrengths?.length) {
        html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 8px 0;">KEY STRENGTHS</p>\n';
        html += '<ul style="margin:0 0 16px 0;padding-left:0;list-style:none;">\n';
        analysis.keyStrengths.forEach(s => { html += `<li style="font-size:14px;color:#374151;line-height:1.6;margin:4px 0;"><span style="color:#16a34a;">&#10003;</span> ${s}</li>\n`; });
        html += '</ul>\n';
      }
      if (analysis.suggestedImprovements?.length) {
        const validDeltas = analysis.suggestedImprovements
          .filter((item: any) => typeof item === 'object' && item.points_delta && item.points_delta > 0)
          .map((item: any) => item.points_delta);
        const totalDeltaPoints = validDeltas.reduce((sum: number, delta: number) => sum + delta, 0);

        html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 8px 0;">SUGGESTED IMPROVEMENTS';
        if (totalDeltaPoints > 0) {
          html += ` <span style="color:#9ca3af;font-weight:400;letter-spacing:normal;">— Potential +${totalDeltaPoints} pts</span>`;
        }
        html += '</p>\n';
        html += '<ul style="margin:0 0 0 0;padding-left:0;list-style:none;">\n';
        analysis.suggestedImprovements.forEach((item: any) => {
          const isStructured = typeof item === 'object';
          const text = isStructured ? item.text : item;
          const pointsDelta = isStructured ? item.points_delta : null;
          let badge = '';
          if (pointsDelta && pointsDelta > 0) {
            badge = ` <span style="display:inline-block;background:#fed7aa;color:#92400e;border:1px solid #fdba74;padding:2px 6px;border-radius:12px;font-size:11px;font-weight:600;margin-left:8px;">+${pointsDelta} pts</span>`;
          }
          html += `<li style="font-size:14px;color:#374151;line-height:1.6;margin:4px 0;"><span style="color:#374151;">&rarr;</span> ${text}${badge}</li>\n`;
        });
        html += '</ul>\n';
        if (totalDeltaPoints > 0 && card.score?.finalScore) {
          const cardProjScore = Math.min(92, card.score.finalScore + totalDeltaPoints);
          html += `<p style="font-size:13px;color:#6b7280;margin-top:8px;">Apply all suggestions &rarr; estimated score: ${cardProjScore}/100</p>\n`;
        }
      }
    }
    html += '</div>\n';
  }

  // GEO Score block
  if (card.geoScore) {
    let geoScoreColor = '#dc2626';
    if (card.geoScore.overall >= 80) geoScoreColor = '#16a34a';
    else if (card.geoScore.overall >= 60) geoScoreColor = '#111827';
    else if (card.geoScore.overall >= 50) geoScoreColor = '#d97706';

    html += '<div style="margin-bottom:32px;page-break-inside:avoid;">\n';
    html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 4px 0;">GEO SCORE</p>\n';
    html += `<span style="font-size:32px;font-weight:900;color:${geoScoreColor};">${card.geoScore.overall} <span style="font-size:15px;font-weight:400;color:#9ca3af;">/ 100</span></span>\n`;
    html += '<div style="border-top:1px solid #e5e7eb;margin:8px 0 16px;"></div>\n';

    if (card.geoScore.breakdown?.length) {
      html += '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">\n';
      html += '<thead><tr style="border-bottom:2px solid #111827;"><th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Criterion</th><th style="text-align:center;padding:6px 8px;color:#6b7280;font-weight:600;">Status</th><th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">Score</th></tr></thead>\n';
      html += '<tbody>\n';
      card.geoScore.breakdown.forEach((item, i) => {
        const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
        const statusIcon = item.detected ? `<span style="color:#16a34a;">&#10003;</span>` : `<span style="color:#dc2626;">&#10007;</span>`;
        html += `<tr style="background:${rowBg};border-bottom:1px solid #e5e7eb;"><td style="padding:8px;color:#374151;">${item.criterion}<br><span style="font-size:11px;color:#9ca3af;">${item.explanation}</span></td><td style="padding:8px;text-align:center;">${statusIcon}</td><td style="padding:8px;text-align:right;font-weight:600;color:#111827;">${item.score}</td></tr>\n`;
      });
      html += '</tbody></table>\n';
    }

    if (card.geoScore.suggestions?.length) {
      html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 8px 0;">GEO OPTIMIZATION SUGGESTIONS</p>\n';
      html += '<ul style="margin:0;padding-left:20px;color:#374151;">\n';
      card.geoScore.suggestions.forEach(s => { html += `<li style="font-size:13px;line-height:1.6;margin:4px 0;">${s}</li>\n`; });
      html += '</ul>\n';
    }
    html += '</div>\n';
  }

  // SEO Metadata
  if (card.seoMetadata) {
    const renderSeoGroup = (label: string, items: string[], charLimit: number) => {
      if (!items?.length) return '';
      let out = `<p style="font-size:12px;letter-spacing:0.06em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:12px 0 6px 0;">${label}</p>\n`;
      items.forEach((item, idx) => {
        out += `<div style="margin:4px 0;padding:8px 12px;background:#f9fafb;border-radius:4px;"><code style="font-family:'Courier New',monospace;font-size:13px;color:#111827;">${item}</code><span style="color:#9ca3af;font-size:11px;margin-left:8px;">${item.length}/${charLimit} chars</span></div>\n`;
      });
      return out;
    };

    html += '<div style="margin-bottom:32px;page-break-inside:avoid;">\n';
    html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 12px 0;">SEO METADATA</p>\n';
    html += renderSeoGroup('URL Slugs', card.seoMetadata.urlSlugs ?? [], 60);
    html += renderSeoGroup('Meta Descriptions', card.seoMetadata.metaDescriptions ?? [], 160);
    html += renderSeoGroup('H1 Variants', card.seoMetadata.h1Variants ?? [], 60);
    html += renderSeoGroup('H2 Headings', card.seoMetadata.h2Headings ?? [], 70);
    html += renderSeoGroup('H3 Headings', card.seoMetadata.h3Headings ?? [], 70);
    html += renderSeoGroup('Open Graph Titles', card.seoMetadata.ogTitles ?? [], 60);
    html += renderSeoGroup('Open Graph Descriptions', card.seoMetadata.ogDescriptions ?? [], 160);
    html += '</div>\n';
  }

  // FAQ Schema
  if (card.faqSchema && Object.keys(card.faqSchema).length > 0) {
    html += '<div style="margin-bottom:32px;page-break-inside:avoid;">\n';
    html += '<p style="font-size:11px;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;font-weight:600;margin:0 0 8px 0;">FAQ SCHEMA (JSON-LD)</p>\n';
    html += `<pre style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:6px;overflow-x:auto;font-size:12px;font-family:'Courier New',monospace;color:#374151;"><code>${JSON.stringify(card.faqSchema, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>\n`;
    html += '</div>\n';
  }

  html += '</section>\n';
  html += '<hr style="border:none;border-top:1px solid #e5e7eb;margin:56px 0;">\n';

  return html;
};

/**
 * Extract table data from markdown content
 */
const extractTableDataFromContent = (contentText: string): { headers: string[]; rows: string[][] } | null => {
  const lines = contentText.split('\n');
  const tableLines: string[] = [];

  // Find table lines (lines containing |)
  for (const line of lines) {
    if (line.includes('|')) {
      tableLines.push(line);
    }
  }

  if (tableLines.length === 0) return null;

  // Find header (first line with | that has actual content)
  const headerLine = tableLines.find(l => {
    if (!l.includes('|')) return false;
    // Skip separator lines (only contains -, |, and spaces)
    if (l.match(/^[\s|:\-]+$/)) return false;
    // Must have at least one alphanumeric character
    return /[a-zA-Z0-9]/.test(l);
  });

  if (!headerLine) return null;

  // Parse headers
  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter((h, idx, arr) => {
      if (h === '' && (idx === 0 || idx === arr.length - 1)) return false;
      return h !== '' || h.match(/^-+$/);
    });

  // Parse data rows
  const dataRows: string[][] = [];
  let foundHeader = false;

  for (const line of tableLines) {
    if (line === headerLine) {
      foundHeader = true;
      continue;
    }

    if (!foundHeader) continue;

    // Skip separator lines
    if (line.match(/^[\s|:\-]+$/)) continue;

    // Must have at least one alphanumeric character
    if (!/[a-zA-Z0-9]/.test(line)) continue;

    // Parse row
    const cells = line
      .split('|')
      .map(c => c.trim())
      .filter((c, idx, arr) => {
        if (c === '' && (idx === 0 || idx === arr.length - 1)) return false;
        return true;
      });

    // Ensure row has same number of cells as headers
    while (cells.length < headers.length) {
      cells.push('');
    }
    if (cells.length > headers.length) {
      cells.length = headers.length;
    }

    // Skip rows that are duplicate headers (first cell is "Option")
    if (cells.length > 0 && cells[0]?.trim().toLowerCase() === 'option') {
      continue;
    }

    if (cells.length > 0 && cells.some(c => c !== '')) {
      dataRows.push(cells);
    }
  }

  if (dataRows.length === 0) return null;

  return { headers, rows: dataRows };
};

/**
 * Extract and merge all tables from multiple comparison contents
 */
const extractAndMergeAllTables = (allContents: string[]): { headers: string[]; rows: string[][] } | null => {
  if (allContents.length === 0) return null;

  // Extract table data from each content
  const tables = allContents.map(c => extractTableDataFromContent(c)).filter(t => t !== null);

  if (tables.length === 0) return null;

  // Use the first table's headers as the base
  const baseTable = tables[0]!;
  const mergedHeaders = baseTable.headers;
  const mergedRows: string[][] = [];
  const seenOptions = new Set<string>(); // Track unique option names

  // Add all rows from all tables, deduplicating by first column (option name)
  for (const table of tables) {
    // Verify headers match (or are compatible)
    if (table.headers.length === mergedHeaders.length) {
      for (const row of table.rows) {
        const optionName = row[0]?.trim() || '';

        // Skip rows that are duplicate headers (first cell is "Option")
        if (optionName.toLowerCase() === 'option') {
          continue;
        }

        // Only add if we haven't seen this option yet
        if (!seenOptions.has(optionName)) {
          seenOptions.add(optionName);
          mergedRows.push(row);
        }
      }
    }
  }

  return { headers: mergedHeaders, rows: mergedRows };
};

/**
 * Generate HTML for Comparison - Comprehensive Analysis (matches ComparisonTable component)
 * Supports merging multiple comparison tables into one with combined rows
 */
export const generateComparisonHtml = (
  comparisonContent: string,
  allCards: GeneratedContentItem[],
  allComparisonContents: string[] = []
): string => {
  let html = '';

  html += '<div id="comparison-table" style="background: #ffffff; border: 2px solid #374151; border-radius: 8px; padding: 24px; margin-bottom: 24px;">\n';
  html += '<h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 700; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">Comparison &mdash; Comprehensive Analysis</h2>\n';

  // Merge all comparison contents (main + all others)
  const allContents = [comparisonContent, ...allComparisonContents].filter(c => c && c.trim());

  // Extract table data from all contents and merge them
  const allTableData = extractAndMergeAllTables(allContents);

  // If we have merged table data, render it first
  if (allTableData && allTableData.rows.length > 0) {
    html += '<div style="margin: 20px 0; overflow-x: auto;">\n';
    html += '<table style="width: 100%; border-collapse: collapse; border: 2px solid #111827;">\n';
    html += '<thead><tr style="background: #f3f4f6;">';
    allTableData.headers.forEach(header => {
      html += `<th style="border: 2px solid #111827; padding: 12px; text-align: left; font-size: 14px; font-weight: 700; color: #111827;">${header}</th>`;
    });
    html += '</tr></thead>\n<tbody>';

    allTableData.rows.forEach((row, rowIdx) => {
      html += `<tr style="background: ${rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb'};">`;
      row.forEach((cell, cellIdx) => {
        if (cellIdx === 0) {
          const matchingCard = allCards.find(c => c.sourceDisplayName === cell.trim() || c.type === cell.trim());
          if (matchingCard) {
            html += `<td style="border: 1px solid #111827; padding: 12px; font-weight: 600;"><a href="#output-${matchingCard.id}" style="color: #2563eb; text-decoration: underline;">${cell}</a><br><a href="#analysis-${matchingCard.id}" style="font-size: 12px; color: #6b7280; text-decoration: none;">→ View Analysis</a></td>`;
          } else {
            html += `<td style="border: 1px solid #111827; padding: 12px; font-weight: 600;">${cell}</td>`;
          }
        } else {
          const scoreMatch = cell.match(/(\d+)/);
          if (scoreMatch) {
            const score = parseInt(scoreMatch[1]);
            const scoreColor = getScoreColor(score);
            html += `<td style="border: 1px solid #111827; padding: 12px; font-size: 14px;"><span style="color: ${scoreColor}; font-weight: 600;">${cell}</span></td>`;
          } else {
            html += `<td style="border: 1px solid #111827; padding: 12px; font-size: 14px;">${cell}</td>`;
          }
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table>\n</div>\n';
  }

  // If we already rendered merged tables, skip all remaining content parsing
  // This prevents empty "Updated Analysis" sections from being rendered
  if (allTableData && allTableData.rows.length > 0) {
    html += '</div>\n';
    return html;
  }

  // Parse the markdown-like content and convert to styled HTML (no merged tables, so render everything)
  const lines = comparisonContent.split('\n');
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();

    // Table detection
    if (trimmed.includes('|')) {
      if (!inTable) {
        inTable = true;
        // First line with | is headers
        tableHeaders = trimmed.split('|').map(h => h.trim()).filter(h => h && !h.match(/^-+$/));
      } else if (trimmed.match(/^[\s|:\-]+$/)) {
        // Skip separator line
        return;
      } else {
        // Data row
        const cells = trimmed.split('|').map(c => c.trim()).filter((c, idx, arr) => {
          if (c === '' && (idx === 0 || idx === arr.length - 1)) return false;
          return true;
        });
        if (cells.length > 0 && cells.some(c => c !== '')) {
          tableRows.push(cells);
        }
      }
    } else if (inTable) {
      // End of table - render it
      if (tableHeaders.length > 0 && tableRows.length > 0) {
        html += '<div style="margin: 20px 0; overflow-x: auto;">\n';
        html += '<table style="width: 100%; border-collapse: collapse; border: 2px solid #111827;">\n';
        html += '<thead><tr style="background: #f3f4f6;">';
        tableHeaders.forEach(header => {
          html += `<th style="border: 2px solid #111827; padding: 12px; text-align: left; font-size: 14px; font-weight: 700; color: #111827;">${header}</th>`;
        });
        html += '</tr></thead>\n<tbody>';

        tableRows.forEach((row, rowIdx) => {
          html += `<tr style="background: ${rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb'};">`;
          row.forEach((cell, cellIdx) => {
            // For first column (Option), create clickable link
            if (cellIdx === 0) {
              const matchingCard = allCards.find(c => c.sourceDisplayName === cell.trim() || c.type === cell.trim());
              if (matchingCard) {
                html += `<td style="border: 1px solid #111827; padding: 12px; font-weight: 600;"><a href="#output-${matchingCard.id}" style="color: #2563eb; text-decoration: underline;">${cell}</a><br><a href="#analysis-${matchingCard.id}" style="font-size: 12px; color: #6b7280; text-decoration: none;">→ View Analysis</a></td>`;
              } else {
                html += `<td style="border: 1px solid #111827; padding: 12px; font-weight: 600;">${cell}</td>`;
              }
            } else {
              // Color-code scores
              const scoreMatch = cell.match(/(\d+)/);
              if (scoreMatch) {
                const score = parseInt(scoreMatch[1]);
                const scoreColor = getScoreColor(score);
                html += `<td style="border: 1px solid #111827; padding: 12px; font-size: 14px;"><span style="color: ${scoreColor}; font-weight: 600;">${cell}</span></td>`;
              } else {
                html += `<td style="border: 1px solid #111827; padding: 12px; font-size: 14px;">${cell}</td>`;
              }
            }
          });
          html += '</tr>';
        });

        html += '</tbody></table>\n</div>\n';
      }

      inTable = false;
      tableRows = [];
      tableHeaders = [];
    }

    // Horizontal rules (---)
    if (trimmed.match(/^-{3,}$/)) {
      html += '<hr style="border: 0; border-top: 2px solid #e5e7eb; margin: 24px 0;">\n';
    }
    // Headers
    else if (trimmed.startsWith('###')) {
      html += '<div style="border-top: 2px solid #d1d5db; margin: 24px 0 16px 0; padding-top: 16px;"></div>\n';
      html += `<h3 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 12px 0;">${trimmed.replace(/^###\s*/, '')}</h3>\n`;
    } else if (trimmed.startsWith('##')) {
      html += `<h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 24px 0 12px 0;">${trimmed.replace(/^##\s*/, '')}</h2>\n`;
    } else if (trimmed.startsWith('#')) {
      html += `<h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 32px 0 16px 0;">${trimmed.replace(/^#\s*/, '')}</h1>\n`;
    } else if (trimmed === '') {
      html += '<br>\n';
    } else if (!inTable) {
      html += `<div style="margin: 8px 0; color: #374151; line-height: 1.6;">${trimmed}</div>\n`;
    }
  });

  // Render any remaining table
  if (inTable && tableHeaders.length > 0 && tableRows.length > 0) {
    html += '<div style="margin: 20px 0; overflow-x: auto;">\n';
    html += '<table style="width: 100%; border-collapse: collapse; border: 2px solid #111827;">\n';
    html += '<thead><tr style="background: #f3f4f6;">';
    tableHeaders.forEach(header => {
      html += `<th style="border: 2px solid #111827; padding: 12px; text-align: left; font-size: 14px; font-weight: 700; color: #111827;">${header}</th>`;
    });
    html += '</tr></thead>\n<tbody>';

    tableRows.forEach((row, rowIdx) => {
      html += `<tr style="background: ${rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb'};">`;
      row.forEach((cell, cellIdx) => {
        if (cellIdx === 0) {
          const matchingCard = allCards.find(c => c.sourceDisplayName === cell.trim() || c.type === cell.trim());
          if (matchingCard) {
            html += `<td style="border: 1px solid #111827; padding: 12px; font-weight: 600;"><a href="#output-${matchingCard.id}" style="color: #2563eb; text-decoration: underline;">${cell}</a><br><a href="#analysis-${matchingCard.id}" style="font-size: 12px; color: #6b7280; text-decoration: none;">→ View Analysis</a></td>`;
          } else {
            html += `<td style="border: 1px solid #111827; padding: 12px; font-weight: 600;">${cell}</td>`;
          }
        } else {
          const scoreMatch = cell.match(/(\d+)/);
          if (scoreMatch) {
            const score = parseInt(scoreMatch[1]);
            const scoreColor = getScoreColor(score);
            html += `<td style="border: 1px solid #111827; padding: 12px; font-size: 14px;"><span style="color: ${scoreColor}; font-weight: 600;">${cell}</span></td>`;
          } else {
            html += `<td style="border: 1px solid #111827; padding: 12px; font-size: 14px;">${cell}</td>`;
          }
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table>\n</div>\n';
  }

  html += '</div>\n';

  return html;
};

/**
 * Generate HTML for Overall Recommendation (Overall Verdict section)
 */
export const generateOverallRecommendationHtml = (
  comparison: ComparisonResult,
  allCards: GeneratedContentItem[]
): string => {
  const rec = comparison.finalRecommendation;
  const winnerRow = (comparison.rows ?? []).find(r => r.isWinner);
  if (!winnerRow) return '';

  const winnerCard = allCards.find(c => c.id === winnerRow.versionId);
  const whyText = rec?.why || winnerRow.bestUseCase;
  const scoreColor = getScoreColor(winnerRow.finalScore);

  let html = '';
  html += '<div id="overall-recommendation" style="background:#ffffff;border:2px solid #16a34a;border-radius:8px;overflow:hidden;margin-bottom:24px;">\n';
  html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:#16a34a;">\n';
  html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>\n';
  html += '<span style="font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:0.1em;">Best Performing Version</span>\n';
  html += '</div>\n';

  html += '<div style="padding:16px;background:#f0fdf4;">\n';
  html += '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px;">\n';
  if (winnerCard) {
    html += `<a href="#output-${winnerCard.id}" style="font-weight:800;color:#111827;font-size:18px;text-decoration:none;">${winnerRow.optionLabel}</a>`;
  } else {
    html += `<span style="font-weight:800;color:#111827;font-size:18px;">${winnerRow.optionLabel}</span>`;
  }
  html += `<span style="font-size:22px;font-weight:700;color:${scoreColor};">${winnerRow.finalScore}<span style="font-size:13px;font-weight:400;color:#9ca3af;">/100</span></span>`;
  html += '</div>\n';
  if (winnerRow.decisionSummary) {
    html += `<p style="font-size:15px;font-weight:600;color:#111827;line-height:1.6;margin:0 0 8px 0;">${winnerRow.decisionSummary}</p>\n`;
  }
  if (winnerRow.decisionReason) {
    html += `<p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">${winnerRow.decisionReason}</p>\n`;
  }

  // View winning copy button
  if (winnerCard) {
    html += '<div style="margin-top:16px;padding-top:12px;border-top:1px solid #d1d5db;">\n';
    html += `<a href="#output-${winnerCard.id}" style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;background:#22c55e;color:#ffffff;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;"><span>View winning copy</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>\n`;
    html += '</div>\n';
  }

  html += '</div>\n';
  html += '</div>\n';
  return html;
};

/**
 * Generate HTML for Comprehensive Analysis — matches ComprehensiveComparisonTable exactly.
 * Uses comparison.rows[] (ComparisonResult from comprehensiveScoring).
 */
export const generateBestVersionAnalysisHtml = (
  comparison: ComparisonResult,
  allCards: GeneratedContentItem[],
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>,
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta
): string => {
  if (!comparison?.rows?.length) return '';

  const sortedRows = [...comparison.rows].sort((a, b) => {
    if (a.isWinner) return -1;
    if (b.isWinner) return 1;
    return b.finalScore - a.finalScore;
  });

  const winnerRow = sortedRows.find(r => r.isWinner);

  let html = '<div id="best-version-analysis" style="margin-bottom:24px;">\n';

  // ── A. Final Decision block — winner + why + actions + breakdown (MATCHES WinnerHeroCard UI) ───────────
  const rec = comparison.finalRecommendation;
  const actionSteps: string[] = rec?.nextSteps?.slice(0, 3) ?? [];
  const fallbackActions: string[] = Array.isArray(comparison.priorityActions)
    ? comparison.priorityActions.slice(0, 3).map((p: { title: string; reason: string }) => p.title)
    : [];
  const actions = actionSteps.length > 0 ? actionSteps : fallbackActions;

  if (winnerRow) {
    const scoreColor = getScoreColor(winnerRow.finalScore);
    const secondBest = sortedRows.find(r => !r.isWinner);
    const gap = secondBest ? winnerRow.finalScore - secondBest.finalScore : 0;

    // Confidence level based on gap
    const confidenceLevel = gap >= 10 ? 'HIGH' : gap >= 5 ? 'MEDIUM' : 'LOW';
    const confidenceColor = gap >= 10 ? '#16a34a' : gap >= 5 ? '#d97706' : '#9ca3af';
    const confidenceBg = gap >= 10 ? '#f0fdf4' : gap >= 5 ? '#fffbeb' : '#f9fafb';

    html += '<div id="results-winner" style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:16px;overflow:hidden;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">\n';
    html += '<div style="padding:20px 24px;">\n';

    // 1. Winner Label
    html += '<div style="margin-bottom:12px;">\n';
    html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>\n';
    html += '<span style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.1em;">BEST PERFORMING VERSION</span>\n';
    html += '</div>\n';

    // 2. Title + Score + Confidence
    html += '<div style="display:flex;align-items:start;justify-content:space-between;gap:16px;margin-bottom:12px;">\n';
    html += '<div style="flex:1;">\n';
    const escapedLabel = String(winnerRow.optionLabel).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html += '<h2 style="margin:0;font-size:24px;font-weight:900;color:#111827;line-height:1.2;">' + escapedLabel + '</h2>\n';
    html += '</div>\n';
    html += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">\n';
    html += '<span style="font-size:30px;font-weight:900;color:' + scoreColor + ';line-height:1;">' + winnerRow.finalScore + '</span>\n';
    if (gap > 0) {
      html += '<div style="display:flex;align-items:center;gap:8px;">\n';
      html += '<span style="font-size:12px;font-weight:600;color:#16a34a;white-space:nowrap;">+' + Math.round(gap) + ' pts</span>\n';
      html += '<span style="font-size:10px;font-weight:700;color:' + confidenceColor + ';background:' + confidenceBg + ';padding:2px 8px;border-radius:99px;">' + confidenceLevel + '</span>\n';
      html += '</div>\n';
    }
    html += '</div>\n';
    html += '</div>\n';

    // 3. QUICK WHY (winnerBreakdown.whatItDoesBetter) - matches UI exactly
    if (comparison.winnerBreakdown?.whatItDoesBetter && comparison.winnerBreakdown.whatItDoesBetter.length > 0) {
      const quickWhyBullets = comparison.winnerBreakdown.whatItDoesBetter.slice(0, 3).map(item => {
        const cleaned = item.replace(/^(Compared to|vs\.?)\s+[^,]+,\s*/i, '');
        return cleaned.split(/\s+/).slice(0, 8).join(' ');
      });

      html += '<div style="margin-bottom:20px;background:rgba(255,255,255,0.6);border-radius:12px;padding:16px;border:1px solid #bbf7d0;">\n';
      html += '<p style="margin:0 0 10px 0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em;">WHY THIS WINS (quick)</p>\n';
      html += '<ul style="margin:0;padding:0;list-style:none;">\n';
      quickWhyBullets.forEach(bullet => {
        const escapedBullet = String(bullet).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<li style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;"><span style="color:#16a34a;flex-shrink:0;margin-top:2px;">•</span><span style="font-size:14px;font-weight:500;color:#1f2937;line-height:1.5;">' + escapedBullet + '</span></li>\n';
      });
      html += '</ul>\n</div>\n';
    }

    // 4. RECOMMENDATION (decisionLayer) - matches UI exactly
    if (comparison.decisionLayer) {
      const dl = comparison.decisionLayer;
      html += '<div style="margin-bottom:20px;">\n';
      html += '<p style="margin:0 0 10px 0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em;">RECOMMENDATION</p>\n';
      html += '<div style="display:flex;flex-direction:column;gap:10px;">\n';
      if (dl.recommendedUseCase) {
        const escaped1 = String(dl.recommendedUseCase).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div><p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;margin-bottom:4px;">Use this if:</p>\n';
        html += '<p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">→ ' + escaped1 + '</p></div>\n';
      }
      if (dl.alternativeChoiceNote) {
        const escaped2 = String(dl.alternativeChoiceNote).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div><p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;margin-bottom:4px;">Avoid if:</p>\n';
        html += '<p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">→ ' + escaped2 + '</p></div>\n';
      }
      if (dl.publishRecommendation) {
        const escaped3 = String(dl.publishRecommendation).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div><p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;margin-bottom:4px;">Next step:</p>\n';
        html += '<p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">→ ' + escaped3 + '</p></div>\n';
      }
      html += '</div>\n</div>\n';
    }

    // 5. CORE STRENGTH (winnerBreakdown.coreStrength) - matches UI exactly
    if (comparison.winnerBreakdown?.coreStrength) {
      const escapedCore = String(comparison.winnerBreakdown.coreStrength).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<div style="margin-bottom:20px;">\n';
      html += '<p style="margin:0 0 8px 0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em;">CORE STRENGTH</p>\n';
      html += '<p style="margin:0;font-size:14px;font-weight:500;color:#1f2937;line-height:1.6;">' + escapedCore + '</p>\n';
      html += '</div>\n';
    }

    // 6. WHY THIS BEATS OTHERS (winnerBreakdown.whatItDoesBetter with version names) - matches UI exactly
    if (comparison.winnerBreakdown?.whatItDoesBetter && comparison.winnerBreakdown.whatItDoesBetter.length > 0) {
      const comparisonBullets = comparison.winnerBreakdown.whatItDoesBetter.slice(0, 4).map(item => {
        const match = item.match(/^(Compared to|vs\.?)\s+([^,]+),\s*(.+)$/i);
        if (match) {
          const versionName = match[2].trim();
          const benefit = match[3].trim().split(/\s+/).slice(0, 6).join(' ');
          return { version: versionName, benefit };
        }
        return { version: '', benefit: item.split(/\s+/).slice(0, 8).join(' ') };
      });

      html += '<div style="margin-bottom:20px;">\n';
      html += '<p style="margin:0 0 10px 0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em;">WHY THIS BEATS OTHERS</p>\n';
      html += '<ul style="margin:0;padding:0;list-style:none;">\n';
      comparisonBullets.forEach(item => {
        html += '<li style="display:flex;align-items:start;gap:8px;font-size:14px;color:#1f2937;line-height:1.6;margin-bottom:6px;"><span style="color:#16a34a;flex-shrink:0;">•</span>';
        if (item.version) {
          const escapedVersion = String(item.version).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const escapedBenefit = String(item.benefit).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<span><strong>vs ' + escapedVersion + '</strong> → ' + escapedBenefit + '</span>';
        } else {
          const escapedBenefit = String(item.benefit).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<span>' + escapedBenefit + '</span>';
        }
        html += '</li>\n';
      });
      html += '</ul>\n</div>\n';
    }

    // 7. MINOR CONSIDERATIONS (winnerBreakdown.tradeoffs) - matches UI exactly
    if (comparison.winnerBreakdown?.tradeoffs && comparison.winnerBreakdown.tradeoffs.length > 0) {
      html += '<div style="margin-bottom:20px;">\n';
      html += '<p style="margin:0 0 8px 0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em;">MINOR CONSIDERATIONS</p>\n';
      html += '<ul style="margin:0;padding:0;list-style:none;">\n';
      comparison.winnerBreakdown.tradeoffs.forEach(tradeoff => {
        const escapedTradeoff = String(tradeoff).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<li style="display:flex;align-items:start;gap:8px;margin-bottom:6px;"><span style="color:#9ca3af;flex-shrink:0;margin-top:2px;">•</span><span style="font-size:14px;color:#6b7280;line-height:1.6;">' + escapedTradeoff + '</span></li>\n';
      });
      html += '</ul>\n</div>\n';
    }

    // 8. Actions (DO THIS NEXT)
    if (actions.length > 0) {
      html += '<div style="margin-bottom:20px;">\n';
      html += '<p style="margin:0 0 10px 0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em;">DO THIS NEXT</p>\n';
      html += '<ol style="margin:0;padding:0;list-style:none;">\n';
      actions.forEach((step: string) => {
        const stepText = String(step).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<li style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">';
        html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:3px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
        html += '<span style="font-size:14px;font-weight:500;color:#1f2937;line-height:1.5;">' + stepText + '</span>';
        html += '</li>\n';
      });
      html += '</ol>\n';
      html += '</div>\n';
    }
    html += '</div>\n</div>\n';
  }

  // ── C. Rankings Snapshot — secondary, low-contrast ────────────────────────
  html += '<div id="results-rankings" style="background:#ffffff;border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;margin-bottom:16px;">\n';
  html += '<div style="padding:10px 20px;border-bottom:1px solid #f3f4f6;">\n';
  html += '<h3 style="margin:0;font-size:10px;font-weight:700;color:#d1d5db;text-transform:uppercase;letter-spacing:0.12em;">Rankings</h3>\n';
  html += '</div>\n';
  html += '<div>\n';

  const baselineRowHtml = comparison.rows.find((r) => r.optionLabel === 'Original Copy') ?? null;
  const baselineScoreHtml = baselineRowHtml?.finalScore ?? null;

  // Calculate decision badges for all versions (matches RankingsSnapshotCard logic)
  const versionsWithScores = sortedRows.map(row => {
    const matchingCard = allCards.find(card => card.id === row.versionId);
    let contentText = '';
    if (matchingCard) {
      if (typeof matchingCard.content === 'string') {
        contentText = matchingCard.content;
      } else if (Array.isArray(matchingCard.content)) {
        contentText = matchingCard.content.join('\n');
      } else if (typeof matchingCard.content === 'object') {
        contentText = structuredToPlainText(matchingCard.content as StructuredCopyOutput);
      }
    }
    const subScores = contentText ? calculateMultiScoreDisplay(contentText) : null;
    return {
      versionId: row.versionId,
      finalScore: row.finalScore,
      subScores: subScores ? {
        conversion: subScores.conversion,
        trust: subScores.trust,
        risk: subScores.risk
      } : undefined
    };
  });

  const decisionBadges = new Map<string, DecisionBadge | null>();
  versionsWithScores.forEach(version => {
    const badge = getDecisionBadgeForVersion(version, versionsWithScores);
    decisionBadges.set(version.versionId, badge);
  });

  sortedRows.forEach((row, idx) => {
    const isBaselineRow = row.optionLabel === 'Original Copy';
    const delta = isBaselineRow ? null : getComparisonDelta(row.finalScore, baselineScoreHtml);
    const rowOpacity = row.isWinner ? '1' : '0.87';
    const rowScale = row.isWinner ? 'scale(1.03)' : 'none';

    // Find the corresponding card to get content text for comprehensive scores
    const matchingCard = allCards.find(card => card.id === row.versionId);
    let contentText = '';
    if (matchingCard) {
      if (typeof matchingCard.content === 'string') {
        contentText = matchingCard.content;
      } else if (Array.isArray(matchingCard.content)) {
        contentText = matchingCard.content.join('\n');
      } else if (typeof matchingCard.content === 'object') {
        contentText = structuredToPlainText(matchingCard.content as StructuredCopyOutput);
      }
    }

    // Calculate comprehensive scores if content is available
    const comprehensiveScores = contentText ? calculateMultiScoreDisplay(contentText) : null;

    // Get decision badge for this version
    const decisionBadge = decisionBadges.get(row.versionId);
    // Don't show "Best Overall" badge if already marked as winner - avoid duplication
    const shouldShowBadge = decisionBadge && !(decisionBadge.type === 'best-overall' && row.isWinner);

    html += '<div style="display:flex;align-items:start;gap:12px;padding:10px 20px;border-bottom:1px solid #f9fafb;opacity:' + rowOpacity + ';transform:' + rowScale + ';transform-origin:left center;">\n';
    html += '<span style="font-size:11px;width:16px;flex-shrink:0;color:#e5e7eb;margin-top:2px;">' + (idx + 1) + '</span>\n';

    // Left side: Option name, decision badge, timestamp, and comprehensive scores
    html += '<div style="flex:1;min-width:0;">\n';

    // Option name + decision badge (matches RankingsSnapshotCard)
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">\n';
    const escapedOptionLabel = String(row.optionLabel).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const optionFontWeight = row.isWinner ? '800' : '400';
    const optionColor = row.isWinner ? '#111827' : '#9ca3af';
    html += '<span style="font-size:12px;font-weight:' + optionFontWeight + ';color:' + optionColor + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapedOptionLabel + '</span>\n';

    // Add decision badge if applicable
    if (shouldShowBadge && decisionBadge) {
      const badgeStyles = getBadgeStyles(decisionBadge.type);
      // Parse style classes into inline styles (simplified mapping)
      let badgeBg = '#f3f4f6', badgeText = '#6b7280', badgeBorder = '#e5e7eb';
      if (badgeStyles.includes('bg-blue-50')) { badgeBg = '#eff6ff'; badgeText = '#1e40af'; badgeBorder = '#bfdbfe'; }
      if (badgeStyles.includes('bg-purple-50')) { badgeBg = '#faf5ff'; badgeText = '#7e22ce'; badgeBorder = '#e9d5ff'; }
      if (badgeStyles.includes('bg-green-50')) { badgeBg = '#f0fdf4'; badgeText = '#15803d'; badgeBorder = '#bbf7d0'; }
      if (badgeStyles.includes('bg-amber-50')) { badgeBg = '#fffbeb'; badgeText = '#b45309'; badgeBorder = '#fde68a'; }
      if (badgeStyles.includes('bg-rose-50')) { badgeBg = '#fff1f2'; badgeText = '#be123c'; badgeBorder = '#fecdd3'; }

      const escapedBadgeLabel = String(decisionBadge.label).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<span style="font-size:11px;font-weight:600;padding:4px 8px;border-radius:4px;white-space:nowrap;background:' + badgeBg + ';color:' + badgeText + ';border:1px solid ' + badgeBorder + ';">' + escapedBadgeLabel + '</span>\n';
    }
    html += '</div>\n';

    // Timestamp (if available)
    if (row.evaluatedAt) {
      const formattedTime = formatLocalDateTime(row.evaluatedAt);
      html += '<div style="font-size:10px;color:#9ca3af;margin-top:2px;">' + formattedTime + '</div>\n';
    }

    // Add comprehensive score chips below option name
    if (comprehensiveScores) {
      html += '<div style="display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap;">\n';

      // Conversion chip (blue)
      html += '<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:500;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;">\n';
      html += '<span style="color:#3b82f6;font-weight:400;">Conversion</span> <span style="font-weight:600;">' + comprehensiveScores.conversion + '<span style="color:#60a5fa;font-weight:400;">/100</span></span>\n';
      html += '</span>\n';

      // Trust chip (purple)
      html += '<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:500;background:#faf5ff;color:#7e22ce;border:1px solid #e9d5ff;">\n';
      html += '<span style="color:#9333ea;font-weight:400;">Trust</span> <span style="font-weight:600;">' + comprehensiveScores.trust + '<span style="color:#a855f7;font-weight:400;">/100</span></span>\n';
      html += '</span>\n';

      // Risk chip (color varies by level)
      const riskColors = comprehensiveScores.risk === 'High'
        ? { bg: '#fffbeb', text: '#b45309', border: '#fde68a', labelColor: '#d97706' }
        : comprehensiveScores.risk === 'Medium'
        ? { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', labelColor: '#64748b' }
        : { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', labelColor: '#16a34a' };

      html += '<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:500;background:' + riskColors.bg + ';color:' + riskColors.text + ';border:1px solid ' + riskColors.border + ';">\n';
      html += '<span style="color:' + riskColors.labelColor + ';font-weight:400;">Risk</span> <span style="font-weight:600;">' + comprehensiveScores.risk + '</span>\n';
      html += '</span>\n';

      html += '</div>\n';
    }

    html += '</div>\n';

    // Right side: Delta and final score
    html += '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">\n';
    if (delta && !delta.neutral) {
      const badgeColor = delta.positive ? '#15803d' : '#b45309';
      const badgeBg = delta.positive ? '#f0fdf4' : '#fffbeb';
      const badgeBorder = delta.positive ? '#bbf7d0' : '#fde68a';
      const escapedDeltaLabel = String(delta.label).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<span style="font-size:10px;font-weight:600;color:' + badgeColor + ';background:' + badgeBg + ';border:1px solid ' + badgeBorder + ';padding:1px 7px;border-radius:99px;white-space:nowrap;">' + escapedDeltaLabel + '</span>\n';
    }
    const scoreFontWeight = row.isWinner ? '900' : '700';
    const scoreColorText = row.isWinner ? '#111827' : '#9ca3af';
    html += '<span style="font-size:13px;font-weight:' + scoreFontWeight + ';color:' + scoreColorText + ';">' + row.finalScore + '</span>\n';
    html += '<span title="Scores are relative to other versions in this comparison. Adding new versions may shift scores slightly — focus on the ranking order and the improvement delta vs. your original." style="font-size:11px;color:#9ca3af;cursor:help;margin-left:4px;">&#9432;</span>\n';
    html += '</div>\n';
    html += '</div>\n';
  });

  html += '</div>\n</div>\n';

  html += '</div>\n';
  return html;
};

/**
 * Generate HTML for All Versions Breakdown — matches ComprehensiveComparisonTable deep-analysis cards.
 * Uses comparison.rows[] (ComparisonResult from comprehensiveScoring).
 */
export const generateAllVersionsBreakdownHtml = (
  comparison: ComparisonResult,
  allCards: GeneratedContentItem[],
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>,
  loadingVersionIds?: Set<string>
): string => {
  if (!comparison?.rows?.length) return '';

  // Show the section if there are any analyses OR if any are currently loading
  const hasAnyAnalysis = versionDeepAnalysis && Object.keys(versionDeepAnalysis).length > 0;
  const hasLoadingAnalyses = loadingVersionIds && loadingVersionIds.size > 0;

  if (!hasAnyAnalysis && !hasLoadingAnalyses) return '';

  const sortedRows = [...comparison.rows].sort((a, b) => {
    if (a.isWinner) return -1;
    if (b.isWinner) return 1;
    return b.finalScore - a.finalScore;
  });

  let html = '';
  html += '<div id="all-versions-breakdown" style="margin-bottom:24px;">\n';

  // Section header — matches Version Analysis section in app
  html += '<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">\n';
  html += '<div style="padding:14px 24px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:8px;">\n';
  html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="6" height="6"/><rect x="9" y="3" width="6" height="6"/><rect x="16" y="3" width="6" height="6"/><rect x="2" y="11" width="6" height="6"/><rect x="9" y="11" width="6" height="6"/><rect x="16" y="11" width="6" height="6"/></svg>\n';
  html += '<h3 style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Version Analysis</h3>\n';
  html += '<span style="font-size:11px;color:#d1d5db;font-weight:400;">(' + sortedRows.length + ')</span>\n';
  html += '</div>\n';
  html += '<div style="padding:16px;display:flex;flex-direction:column;gap:12px;">\n';

  sortedRows.forEach((row) => {
    const isWinner = row.isWinner;
    const borderColor = isWinner ? '#bbf7d0' : '#e5e7eb';
    const bgColor = isWinner ? 'rgba(240,253,244,0.3)' : '#ffffff';
    const scoreColor = getScoreColor(row.finalScore);
    const analysis = versionDeepAnalysis?.[row.versionId];
    const hasError = !!analysis?.errorMessage;

    const escapedVersionId = String(row.versionId).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html += '<div id="analysis-' + escapedVersionId + '" style="border:1px solid ' + borderColor + ';background:' + bgColor + ';border-radius:12px;overflow:hidden;">\n';

    // Card header — matches VersionAnalysisCard collapsed header
    html += '<div style="padding:16px 20px;display:flex;align-items:center;gap:12px;">\n';
    html += '<div style="flex:1;min-width:0;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">\n';
    if (isWinner) {
      html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>\n';
    }
    const versionTitleColor = isWinner ? '#111827' : '#1f2937';
    const escapedRowOptionLabel = String(row.optionLabel).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html += '<span style="font-size:15px;font-weight:700;color:' + versionTitleColor + ';">' + escapedRowOptionLabel + '</span>\n';
    html += '<span style="font-size:20px;font-weight:900;color:' + scoreColor + ';">' + row.finalScore + '</span>\n';
    if (isWinner) {
      html += '<span style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.06em;">Winner</span>\n';
    }
    html += '</div>\n</div>\n';

    // Card body — always fully expanded in export
    html += '<div style="padding:0 20px 20px;border-top:1px solid #f3f4f6;">\n';

    const isLoading = loadingVersionIds?.has(row.versionId) ?? false;

    if (!analysis || hasError) {
      if (hasError) {
        const escapedErrorMsg = String(analysis!.errorMessage).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div style="margin-top:16px;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;font-size:13px;color:#dc2626;">' + escapedErrorMsg + '</div>\n';
      } else if (isLoading) {
        html += '<div style="margin-top:16px;padding:12px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;font-size:13px;color:#1e40af;font-style:italic;">Analysis is currently being generated for this version...</div>\n';
      } else {
        html += '<div style="margin-top:16px;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;font-size:13px;color:#6b7280;font-style:italic;">Narrative analysis was not generated for this version.</div>\n';
      }
    } else {
      // Summary
      if (analysis.summary) {
        const escapedSummary = String(analysis.summary).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<p style="font-size:14px;color:#374151;line-height:1.65;margin:16px 0;">' + escapedSummary + '</p>\n';
      }

      // DECISION LAYER for Winner — matches VersionAnalysisCard exactly (comes BEFORE Core Strength)
      if (isWinner && comparison.decisionLayer) {
        const dl = comparison.decisionLayer;
        html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #dcfce7;">\n';
        html += '<p style="margin:0 0 8px 0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Decision</p>\n';
        html += '<div style="display:flex;flex-direction:column;gap:6px;">\n';

        if (dl.recommendedLabel) {
          html += '<div style="display:flex;align-items:start;gap:8px;">\n';
          html += '<span style="font-size:12px;color:#6b7280;font-weight:500;min-width:80px;flex-shrink:0;">Recommended:</span>\n';
          const escapedRecLabel = String(dl.recommendedLabel).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<span style="font-size:12px;color:#374151;line-height:1.5;font-weight:500;">' + escapedRecLabel + '</span>\n';
          html += '</div>\n';
        }

        if (dl.recommendedUseCase) {
          html += '<div style="display:flex;align-items:start;gap:8px;">\n';
          html += '<span style="font-size:12px;color:#6b7280;font-weight:500;min-width:80px;flex-shrink:0;">Best for:</span>\n';
          const escapedRecUseCase = String(dl.recommendedUseCase).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<span style="font-size:12px;color:#374151;line-height:1.5;">' + escapedRecUseCase + '</span>\n';
          html += '</div>\n';
        }

        if (dl.publishRecommendation) {
          html += '<div style="display:flex;align-items:start;gap:8px;">\n';
          html += '<span style="font-size:12px;color:#6b7280;font-weight:500;min-width:80px;flex-shrink:0;">Use it when:</span>\n';
          const escapedPubRec = String(dl.publishRecommendation).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<span style="font-size:12px;color:#374151;line-height:1.5;">' + escapedPubRec + '</span>\n';
          html += '</div>\n';
        }

        if (dl.alternativeChoiceNote) {
          html += '<div style="display:flex;align-items:start;gap:8px;">\n';
          html += '<span style="font-size:12px;color:#6b7280;font-weight:500;min-width:80px;flex-shrink:0;">Alternative:</span>\n';
          const escapedAltNote = String(dl.alternativeChoiceNote).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<span style="font-size:12px;color:#374151;line-height:1.5;">' + escapedAltNote + '</span>\n';
          html += '</div>\n';
        }

        if (dl.nextImprovementAction) {
          html += '<div style="display:flex;align-items:start;gap:8px;">\n';
          html += '<span style="font-size:12px;color:#6b7280;font-weight:500;min-width:80px;flex-shrink:0;">Next step:</span>\n';
          const escapedNextAction = String(dl.nextImprovementAction).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<span style="font-size:12px;color:#374151;line-height:1.5;">' + escapedNextAction + '</span>\n';
          html += '</div>\n';
        }

        html += '</div>\n</div>\n';
      }

      // CORE STRENGTH and WHY THIS WINS for Winner — matches VersionAnalysisCard exactly (comes AFTER Decision Layer)
      if (isWinner && comparison.winnerBreakdown) {
        html += '<div style="margin-top:12px;padding-left:12px;border-left:2px solid #16a34a;">\n';

        // Core Strength
        if (comparison.winnerBreakdown.coreStrength) {
          html += '<div style="margin-bottom:12px;">\n';
          html += '<p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.025em;">Core Strength</p>\n';
          const escapedCoreStrength = String(comparison.winnerBreakdown.coreStrength).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<p style="font-size:14px;color:#374151;line-height:1.65;margin:0;">' + escapedCoreStrength + '</p>\n';
          html += '</div>\n';
        }

        // Why This Wins
        if (comparison.winnerBreakdown.whatItDoesBetter && comparison.winnerBreakdown.whatItDoesBetter.length > 0) {
          html += '<div>\n';
          html += '<p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.025em;">Why This Wins</p>\n';
          html += '<ul style="margin:0;padding:0;list-style:none;">\n';
          comparison.winnerBreakdown.whatItDoesBetter.forEach(advantage => {
            const escapedAdvantage = String(advantage).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html += '<li style="display:flex;align-items:start;gap:8px;margin-bottom:4px;">\n';
            html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>\n';
            html += '<span style="font-size:14px;color:#374151;line-height:1.65;">' + escapedAdvantage + '</span>\n';
            html += '</li>\n';
          });
          html += '</ul>\n';
          html += '</div>\n';
        }

        html += '</div>\n';
      }

      // SUB-SCORES: Comprehensive Score Breakdown (Conversion, Trust, Risk)
      // Find the matching card to get content text
      const matchingCardForScores = allCards.find(card => card.id === row.versionId);
      if (matchingCardForScores) {
        let contentTextForScores = '';
        if (typeof matchingCardForScores.content === 'string') {
          contentTextForScores = matchingCardForScores.content;
        } else if (Array.isArray(matchingCardForScores.content)) {
          contentTextForScores = matchingCardForScores.content.join('\n');
        } else if (typeof matchingCardForScores.content === 'object') {
          contentTextForScores = structuredToPlainText(matchingCardForScores.content as StructuredCopyOutput);
        }

        if (contentTextForScores) {
          const subScores = calculateMultiScoreDisplay(contentTextForScores);

          html += '<div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:10px;">\n';
          html += '<span style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:12px;display:block;">Sub-Scores:</span>\n';

          // Inline chips display
          html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:16px;">\n';

          // Conversion chip (blue)
          html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;">\n';
          html += '<span style="color:#3b82f6;font-weight:400;">Conversion</span> <span style="font-weight:600;">' + subScores.conversion + '<span style="color:#60a5fa;font-weight:400;">/100</span></span>\n';
          html += '</span>\n';

          // Trust chip (purple)
          html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;background:#faf5ff;color:#7e22ce;border:1px solid #e9d5ff;">\n';
          html += '<span style="color:#9333ea;font-weight:400;">Trust</span> <span style="font-weight:600;">' + subScores.trust + '<span style="color:#a855f7;font-weight:400;">/100</span></span>\n';
          html += '</span>\n';

          // Risk chip (color varies by level)
          const riskColors = subScores.risk === 'High'
            ? { bg: '#fffbeb', text: '#b45309', border: '#fde68a', labelColor: '#d97706' }
            : subScores.risk === 'Medium'
            ? { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', labelColor: '#64748b' }
            : { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', labelColor: '#16a34a' };

          html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;background:' + riskColors.bg + ';color:' + riskColors.text + ';border:1px solid ' + riskColors.border + ';">\n';
          html += '<span style="color:' + riskColors.labelColor + ';font-weight:400;">Risk</span> <span style="font-weight:600;">' + subScores.risk + '</span>\n';
          html += '</span>\n';

          html += '</div>\n';

          // Detailed breakdowns
          // Conversion explanation
          const conversionColor = subScores.conversion >= 70 ? '#10b981' : subScores.conversion >= 50 ? '#f59e0b' : '#ef4444';
          html += '<div style="margin-bottom:12px;padding:12px;background:#ffffff;border-left:3px solid ' + conversionColor + ';border-radius:6px;">\n';
          html += '<span style="font-size:11px;font-weight:600;color:#111827;">Conversion:</span>\n';
          const conversionExpl = String(getConversionExplanation(subScores.conversion)).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">' + conversionExpl + '</p>\n';
          html += '</div>\n';

          // Trust explanation
          const trustColor = subScores.trust >= 70 ? '#10b981' : subScores.trust >= 50 ? '#f59e0b' : '#ef4444';
          html += '<div style="margin-bottom:12px;padding:12px;background:#ffffff;border-left:3px solid ' + trustColor + ';border-radius:6px;">\n';
          html += '<span style="font-size:11px;font-weight:600;color:#111827;">Trust:</span>\n';
          const trustExpl = String(getTrustExplanation(subScores.trust)).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">' + trustExpl + '</p>\n';
          html += '</div>\n';

          // Risk explanation
          const riskBorderColor = subScores.risk === 'Low' ? '#10b981' : subScores.risk === 'Medium' ? '#f59e0b' : '#ef4444';
          html += '<div style="padding:12px;background:#ffffff;border-left:3px solid ' + riskBorderColor + ';border-radius:6px;">\n';
          html += '<span style="font-size:11px;font-weight:600;color:#111827;">Risk:</span>\n';
          const riskExpl = String(getRiskExplanation(subScores.risk)).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">' + riskExpl + '</p>\n';
          html += '</div>\n';

          html += '</div>\n';
        }
      }

      // VERIFICATION FLAGS: Claims that need human review before publishing
      if (row.verificationFlags && row.verificationFlags.length > 0) {
        html += '<div style="margin:16px 0;padding:12px 16px;background:#fef3c7;border-left:3px solid #fbbf24;border-radius:6px;">\n';
        html += '<p style="margin:0 0 8px 0;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.025em;">Verification required before publishing</p>\n';
        html += '<ul style="margin:0;padding:0;list-style:none;">\n';
        row.verificationFlags.forEach(flag => {
          const escapedFlag = String(flag).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<li style="display:flex;align-items:start;gap:8px;margin-bottom:6px;font-size:13px;color:#78350f;line-height:1.5;">\n';
          html += '<span style="flex-shrink:0;margin-top:2px;">•</span>\n';
          html += '<span>' + escapedFlag + '</span>\n';
          html += '</li>\n';
        });
        html += '</ul>\n';
        html += '</div>\n';
      }

      // 2-column grid: Key Strengths + Suggested Improvements
      const hasStrengths = analysis.keyStrengths && analysis.keyStrengths.length > 0;
      const hasImprovements = analysis.suggestedImprovements && analysis.suggestedImprovements.length > 0;

      if (hasStrengths || hasImprovements) {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:16px;">\n';

        if (hasStrengths) {
          html += '<div>\n';
          html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">\n';
          html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>\n';
          html += '<span style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;">Key Strengths</span>\n';
          html += '</div>\n';
          html += '<ul style="margin:0;padding:0;list-style:none;">\n';
          analysis.keyStrengths.forEach(strength => {
            const escapedStrength = String(strength).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html += '<li style="display:flex;align-items:flex-start;gap:6px;font-size:14px;color:#374151;line-height:1.55;margin-bottom:6px;"><span style="color:#22c55e;flex-shrink:0;margin-top:2px;">&#8226;</span>' + escapedStrength + '</li>\n';
          });
          html += '</ul>\n</div>\n';
        }

        if (hasImprovements) {
          const improvDeltaTotal = analysis.suggestedImprovements
            .filter((item: any) => typeof item === 'object' && item.points_delta > 0)
            .reduce((sum: number, item: any) => sum + item.points_delta, 0);

          html += '<div>\n';
          html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">\n';
          html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>\n';
          html += '<span style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;">Suggested Improvements</span>\n';
          html += '</div>\n';
          html += '<ul style="margin:0;padding:0;list-style:none;">\n';
          analysis.suggestedImprovements.forEach((improvement: any) => {
            const isObj = typeof improvement === 'object';
            const text = isObj ? improvement.text : improvement;
            const delta = isObj ? improvement.points_delta : null;
            const escapedText = String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (delta && delta > 0) {
              html += `<li style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;font-size:14px;color:#374151;line-height:1.55;margin-bottom:6px;"><span>${escapedText}</span><span style="background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;white-space:nowrap;">+${delta} pts</span></li>\n`;
            } else {
              html += `<li style="display:flex;align-items:flex-start;gap:6px;font-size:14px;color:#374151;line-height:1.55;margin-bottom:6px;"><span style="color:#6b7280;flex-shrink:0;margin-top:2px;">&#8226;</span>${escapedText}</li>\n`;
            }
          });
          html += '</ul>\n';
          if (improvDeltaTotal > 0) {
            const projScore = Math.min(92, row.finalScore + improvDeltaTotal);
            html += `<p style="font-size:13px;color:#6b7280;margin-top:8px;">Apply all suggestions &rarr; estimated score: ${projScore}/100</p>\n`;
          }
          html += '</div>\n';
        }

        html += '</div>\n';
      }

      // Strategic Recommendation
      if (analysis.strategicRecommendation) {
        const escapedStrategicRec = String(analysis.strategicRecommendation).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div style="border-left:1px solid #e5e7eb;padding:12px 16px;margin-top:12px;margin-bottom:12px;">\n';
        html += '<span style="display:block;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Strategic Recommendation</span>\n';
        html += '<p style="font-size:14px;color:#374151;line-height:1.65;margin:0;">' + escapedStrategicRec + '</p>\n';
        html += '</div>\n';
      }
    }

    // Key Insight (amber) + What to do (blue) — matches VersionAnalysisCard exactly
    if (row.insight || row.action) {
      html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">\n';
      if (row.insight) {
        const insightText = String(row.insight).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:12px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">\n';
        html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>\n';
        html += '<div>\n';
        html += '<span style="display:block;font-size:10px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px;">Key Insight</span>\n';
        html += '<p style="font-size:14px;font-style:italic;color:#92400e;line-height:1.6;margin:0;">' + insightText + '</p>\n';
        html += '</div>\n</div>\n';
      }
      if (row.action) {
        const actionText = String(row.action).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:12px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">\n';
        html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>\n';
        html += '<div>\n';
        html += '<span style="display:block;font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px;">What to do</span>\n';
        html += '<p style="font-size:14px;font-weight:500;color:#1e40af;line-height:1.6;margin:0;">' + actionText + '</p>\n';
        html += '</div>\n</div>\n';
      }
      html += '</div>\n';
    }

    // View Output Card button
    const cardId = allCards.find(c => c.id === row.versionId)?.id;
    if (cardId) {
      html += '<div style="margin-top:16px;padding-top:12px;border-top:1px solid #f3f4f6;">\n';
      html += `<a href="#output-${cardId}" style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;background:#22c55e;color:#ffffff;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;transition:background 0.2s;"><span>View Output Card</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>\n`;
      html += '</div>\n';
    }

    html += '</div>\n'; // card body
    html += '</div>\n'; // card
  });

  html += '</div>\n'; // inner padding div
  html += '<div style="padding:8px 24px;background:#f9fafb;border-top:1px solid #f3f4f6;">\n';
  html += '<p style="margin:0;font-size:11px;color:#9ca3af;">Deep analysis provides narrative guidance and is separate from numeric scoring. The winner is determined solely by the scoring engine.</p>\n';
  html += '</div>\n';
  html += '</div>\n'; // outer card
  html += '</div>\n'; // wrapper

  return html;
};

/**
 * Enhanced Markdown export with clear visual sections and hierarchy
 */
export const formatAsEnhancedMarkdown = (
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  originalInputScore?: any,
  promptEvaluation?: PromptEvaluation,
  comparisonResult?: any,
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>,
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta
): string => {
  let markdown = '';

  // Document header with title and generation info
  markdown += `# Generated Copy Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;

  if (formState.projectDescription) {
    markdown += `**Project:** ${formState.projectDescription}\n\n`;
  }

  markdown += `---\n\n`;

  // Table of Contents
  markdown += `## Table of Contents\n\n`;
  markdown += `1. [Input Summary](#input-summary)\n`;
  if (promptEvaluation) {
    markdown += `2. [Prompt Evaluation](#prompt-evaluation)\n`;
  }
  markdown += `${promptEvaluation ? '3' : '2'}. [Generated Content](#generated-content)\n`;

  // Filter out comparison/analysis cards from TOC
  const contentCardsForToc = generatedOutputCards.filter(card => {
    const isComparison = card.sourceDisplayName?.includes('Analysis') ||
                        card.sourceDisplayName?.includes('Comparison');
    return !isComparison;
  });

  contentCardsForToc.forEach((item, idx) => {
    const anchor = (item.sourceDisplayName || item.type).toLowerCase().replace(/\s+/g, '-');
    markdown += `   - [${item.sourceDisplayName || item.type}](#${anchor})\n`;
  });

  if (comparisonResult || generatedOutputCards.some(card =>
    card.sourceDisplayName?.includes('Analysis') || card.sourceDisplayName?.includes('Comparison'))) {
    const nextNum = promptEvaluation ? '4' : '3';
    markdown += `${nextNum}. [Comprehensive Analysis](#comprehensive-analysis)\n`;
    markdown += `${nextNum}. [All Versions Breakdown](#all-versions-breakdown)\n`;
  }
  markdown += `\n---\n\n`;

  // INPUT SUMMARY SECTION
  markdown += `## Input Summary\n\n`;

  markdown += `### Source Content\n\n`;
  if (formState.tab === 'create') {
    markdown += `**Business Description:**\n\n`;
    const rawBusiness = formState.businessDescription || '';
    // Apply normalization for consistent formatting
    const cleanedBusiness = rawBusiness ? normalizeCopyForMarkdownExport(cleanSourceContent(rawBusiness)) : 'No business description provided';
    markdown += toBlockquote(cleanedBusiness) + '\n\n';

    if (formState.businessDescriptionScore) {
      const label = getScoreLabel(formState.businessDescriptionScore.score);
      markdown += '**Quality Score:** ' + formState.businessDescriptionScore.score + '/100' + (label ? ' *(' + label + ')*' : '') + '\n\n';
      }
      if (formState.businessDescriptionScore.tips && formState.businessDescriptionScore.tips.length > 0) {
        markdown += `**Tips:**\n`;
        formState.businessDescriptionScore.tips.forEach(tip => {
          markdown += `- ${tip}\n`;
        });
        markdown += `\n`;
      }
    }
  else {
    markdown += `**Original Copy:**\n\n`;
    const rawOriginal = formState.originalCopy || '';
    // Apply normalization for consistent formatting
    const cleanedOriginal = rawOriginal ? normalizeCopyForMarkdownExport(cleanSourceContent(rawOriginal)) : 'No original copy provided';
    markdown += toBlockquote(cleanedOriginal) + '\n\n';

    if (formState.originalCopyScore) {
      const label = getScoreLabel(formState.originalCopyScore.score);
      markdown += `**Quality Score:** ${formState.originalCopyScore.score}/100${label ? ` *(${label})*` : ''}\n\n`;
      if (formState.originalCopyScore.tips && formState.originalCopyScore.tips.length > 0) {
        markdown += `**Tips:**\n`;
        formState.originalCopyScore.tips.forEach(tip => {
          markdown += `- ${tip}\n`;
        });
        markdown += `\n`;
      }
    }
  }

  // Configuration details in a table
  markdown += `### Configuration\n\n`;
  markdown += `| Setting | Value |\n`;
  markdown += `|---------|-------|\n`;
  markdown += `| Language | ${formState.language} |\n`;
  markdown += `| Tone | ${formState.tone} |\n`;
  markdown += `| Word Count | ${formState.wordCount}${formState.wordCount === 'Custom' ? ` (${formState.customWordCount})` : ''} |\n`;
  if (formState.targetAudience) {
    markdown += `| Target Audience | ${formState.targetAudience} |\n`;
  }
  if (formState.keyMessage) {
    markdown += `| Key Message | ${formState.keyMessage} |\n`;
  }
  if (formState.callToAction) {
    markdown += `| Call to Action | ${formState.callToAction} |\n`;
  }
  if (formState.desiredEmotion) {
    markdown += `| Desired Emotion | ${formState.desiredEmotion} |\n`;
  }
  if (formState.brandValues) {
    markdown += `| Brand Values | ${formState.brandValues} |\n`;
  }
  if (formState.keywords) {
    markdown += `| Keywords | ${formState.keywords} |\n`;
  }
  markdown += `\n`;

  markdown += `---\n\n`;

  // PROMPT EVALUATION SECTION
  if (promptEvaluation) {
    markdown += `## Prompt Evaluation\n\n`;
    const label = getScoreLabel(promptEvaluation.score);
    markdown += `**Score:** ${promptEvaluation.score}/100${label ? ` *(${label})*` : ''}\n\n`;

    if (promptEvaluation.tips && promptEvaluation.tips.length > 0) {
      markdown += `**Improvement Tips:**\n\n`;
      promptEvaluation.tips.forEach(tip => {
        markdown += `- ${tip}\n`;
      });
      markdown += `\n`;
    }

    markdown += `---\n\n`;
  }

  // GENERATED CONTENT SECTION
  markdown += `## Generated Content\n\n`;

  // Filter out comparison/analysis cards - they'll be shown in the dedicated comparison section
  const contentCards = generatedOutputCards.filter(card => {
    const isComparison = card.sourceDisplayName?.includes('Analysis') ||
                        card.sourceDisplayName?.includes('Comparison');
    return !isComparison;
  });

  contentCards.forEach((item, index) => {
    // Card header with visual separator
    if (index > 0) {
      markdown += `\n---\n\n`;
    }

    let sectionTitle = item.sourceDisplayName || item.type;
    if (item.persona) {
      sectionTitle += ` (${item.persona}'s Voice)`;
    }

    markdown += `### ${sectionTitle}\n\n`;

    // Handle different content types
    let actualContentToProcess: any = item.content;
    let nestedSeoMetadata: SeoMetadata | undefined;

    if (typeof item.content === 'object' && item.content !== null && 'content' in item.content && 'seoMetadata' in item.content) {
      actualContentToProcess = (item.content as any).content;
      nestedSeoMetadata = (item.content as any).seoMetadata;
    }

    // Content section
    markdown += `**Content:**\n\n`;
    if (Array.isArray(actualContentToProcess)) {
      actualContentToProcess.forEach((headline, idx) => {
        const cleanHeadline = stripMarkdown(headline).trim();
        markdown += `${idx + 1}. ${cleanHeadline}\n`;
      });
      markdown += `\n`;
    } else {
      // Use normalization to ensure consistent formatting
      const normalizedContent = normalizeCopyForMarkdownExport(actualContentToProcess);
      markdown += `${normalizedContent}\n\n`;
    }

    // Modification instruction
    if (item.modificationInstruction) {
      markdown += `> **Modification Applied:** ${item.modificationInstruction}\n\n`;
    }

    // Blend instructions
    if (item.blendInstructions) {
      markdown += `> **Special Instructions Applied:** ${item.blendInstructions}\n\n`;
    }

    // Quality metrics
    if (item.score) {
      markdown += `#### Quality Metrics\n\n`;
      markdown += `| Metric | Score |\n`;
      markdown += `|--------|-------|\n`;
      const overallLabel = getScoreLabel(item.score.overall);
      markdown += `| **Overall** | **${item.score.overall}/100**${overallLabel ? ` *(${overallLabel})*` : ''} |\n`;
      markdown += `| Clarity | ${item.score.clarity} |\n`;
      markdown += `| Persuasiveness | ${item.score.persuasiveness} |\n`;
      markdown += `| Tone Match | ${item.score.toneMatch} |\n`;
      markdown += `| Engagement | ${item.score.engagement} |\n`;
      if (item.score.wordCountAccuracy !== undefined) {
        const wcLabel = getScoreLabel(item.score.wordCountAccuracy);
        markdown += `| Word Count Accuracy | ${item.score.wordCountAccuracy}/100${wcLabel ? ` *(${wcLabel})*` : ''} |\n`;
      }
      markdown += `\n`;

      if (item.score.improvementExplanation) {
        markdown += `**Why it's improved:** ${item.score.improvementExplanation}\n\n`;
      }

      if (item.score.suggestions && item.score.suggestions.length > 0 && item.score.overall < 95) {
        markdown += `**Optimization Suggestions:**\n\n`;
        item.score.suggestions.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
    }

    // Comprehensive Score Breakdown (Conversion, Trust, Risk)
    // Calculate comprehensive scores from content
    const contentForScoring = typeof actualContentToProcess === 'string'
      ? actualContentToProcess
      : structuredToPlainText(actualContentToProcess);

    if (contentForScoring && contentForScoring.trim()) {
      const comprehensiveScores = calculateMultiScoreDisplay(contentForScoring);

      markdown += `#### Sub-Scores\n\n`;
      markdown += `**Conversion:** ${comprehensiveScores.conversion}/100\n\n`;

      // Conversion explanation
      if (comprehensiveScores.conversion >= 60) {
        markdown += `*Conversion:* Moderate persuasiveness with room to strengthen urgency and call-to-action.\n\n`;
      } else if (comprehensiveScores.conversion >= 45) {
        markdown += `*Conversion:* Value is present but lacks compelling urgency or strong motivators for action.\n\n`;
      } else {
        markdown += `*Conversion:* Limited persuasive elements; needs stronger value proposition and clearer call-to-action.\n\n`;
      }

      markdown += `**Trust:** ${comprehensiveScores.trust}/100\n\n`;

      // Trust explanation
      if (comprehensiveScores.trust >= 60) {
        markdown += `*Trust:* Generally credible but could benefit from more proof or softer claims.\n\n`;
      } else if (comprehensiveScores.trust >= 40) {
        markdown += `*Trust:* Some credibility concerns; claims may feel exaggerated or lack supporting evidence.\n\n`;
      } else {
        markdown += `*Trust:* Credibility issues detected; tone or claims may seem untrustworthy or overly aggressive.\n\n`;
      }

      markdown += `**Risk:** ${comprehensiveScores.risk}\n\n`;

      // Risk explanation
      if (comprehensiveScores.risk === 'Low') {
        markdown += `*Risk:* Safe, professional tone with no red flags for spam or compliance issues.\n\n`;
      } else if (comprehensiveScores.risk === 'Medium') {
        markdown += `*Risk:* Generally safe but contains elements that could raise minor concerns in certain contexts.\n\n`;
      } else {
        markdown += `*Risk:* Contains language patterns that may trigger spam filters or compliance concerns.\n\n`;
      }
    }

    // Deep Analysis Sections (Key Strengths and Suggested Improvements)
    // ALWAYS generate these on-the-fly from content, regardless of whether deep analysis was triggered in app
    if (contentForScoring && contentForScoring.trim()) {
      const analysis = generateExportAnalysis(contentForScoring);

      // Key Strengths
      if (analysis.keyStrengths && analysis.keyStrengths.length > 0) {
        markdown += `#### ✅ Key Strengths\n\n`;
        analysis.keyStrengths.forEach(strength => {
          markdown += `- ${strength}\n`;
        });
        markdown += `\n`;
      }

      // Suggested Improvements
      if (analysis.suggestedImprovements && analysis.suggestedImprovements.length > 0) {
        markdown += `#### ⚠️ Suggested Improvements\n\n`;
        analysis.suggestedImprovements.forEach(improvement => {
          markdown += `- ${improvement}\n`;
        });
        markdown += `\n`;
      }
    }

    // GEO Score
    if (item.geoScore) {
      markdown += `#### GEO Score\n\n`;
      const geoLabel = getScoreLabel(item.geoScore.overall);
      markdown += `**Overall GEO Score:** ${item.geoScore.overall}/100${geoLabel ? ` *(${geoLabel})*` : ''}\n\n`;

      if (item.geoScore.breakdown && item.geoScore.breakdown.length > 0) {
        markdown += `**Breakdown:**\n\n`;
        item.geoScore.breakdown.forEach(breakdownItem => {
          const status = breakdownItem.detected ? '[YES]' : '[NO]';
          markdown += `- ${status} **${breakdownItem.criterion}** (${breakdownItem.score} points): ${breakdownItem.explanation}\n`;
        });
        markdown += `\n`;
      }

      if (item.geoScore.suggestions && item.geoScore.suggestions.length > 0 && item.geoScore.overall < 80) {
        markdown += `**GEO Optimization Suggestions:**\n\n`;
        item.geoScore.suggestions.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
    }

    // SEO Metadata
    if (item.seoMetadata || nestedSeoMetadata) {
      const seoData = item.seoMetadata || nestedSeoMetadata;
      markdown += `#### SEO Metadata\n\n`;

      if (seoData!.urlSlugs && seoData!.urlSlugs.length > 0) {
        markdown += `**URL Slugs:**\n`;
        seoData!.urlSlugs.forEach((slug, idx) => {
          markdown += `${idx + 1}. \`${slug}\` (${slug.length}/60 chars)\n`;
        });
        markdown += `\n`;
      }

      if (seoData!.metaDescriptions && seoData!.metaDescriptions.length > 0) {
        markdown += `**Meta Descriptions:**\n`;
        seoData!.metaDescriptions.forEach((desc, idx) => {
          markdown += `${idx + 1}. ${desc} (${desc.length}/160 chars)\n`;
        });
        markdown += `\n`;
      }

      if (seoData!.h1Variants && seoData!.h1Variants.length > 0) {
        markdown += `**H1 Variants:**\n`;
        seoData!.h1Variants.forEach((h1, idx) => {
          markdown += `${idx + 1}. ${h1} (${h1.length}/60 chars)\n`;
        });
        markdown += `\n`;
      }

      if (seoData!.h2Headings && seoData!.h2Headings.length > 0) {
        markdown += `**H2 Headings:**\n`;
        seoData!.h2Headings.forEach((h2, idx) => {
          markdown += `${idx + 1}. ${h2} (${h2.length}/70 chars)\n`;
        });
        markdown += `\n`;
      }

      if (seoData!.h3Headings && seoData!.h3Headings.length > 0) {
        markdown += `**H3 Headings:**\n`;
        seoData!.h3Headings.forEach((h3, idx) => {
          markdown += `${idx + 1}. ${h3} (${h3.length}/70 chars)\n`;
        });
        markdown += `\n`;
      }
    }

    // FAQ Schema
    if (item.faqSchema && Object.keys(item.faqSchema).length > 0) {
      markdown += `#### FAQ Schema (JSON-LD)\n\n`;
      markdown += '```json\n';
      markdown += JSON.stringify(item.faqSchema, null, 2);
      markdown += '\n```\n\n';
    }
  });

  // COMPARISON AND ANALYSIS SECTIONS
  // Check for both structured comparisonResult AND comparison cards
  const comparisonCards = generatedOutputCards.filter(card =>
    card.sourceDisplayName?.includes('Analysis') || card.sourceDisplayName?.includes('Comparison')
  );

  if (comparisonResult || comparisonCards.length > 0) {
    markdown += `\n---\n\n`;

    // If we have a structured comparison result, show the formatted sections
    if (comparisonResult) {
      // COMPREHENSIVE ANALYSIS TABLE (uses rows[] from comprehensiveScoring)
      if (comparisonResult.rows && comparisonResult.rows.length > 0) {
        const sortedRows = [...comparisonResult.rows].sort((a: any, b: any) => {
          if (a.isWinner) return -1;
          if (b.isWinner) return 1;
          return b.finalScore - a.finalScore;
        });

        const hasBaseline = sortedRows.some((r: any) => r.optionLabel === 'Original Copy');
        const baselineScoreMd: number | null = sortedRows.find((r: any) => r.optionLabel === 'Original Copy')?.finalScore ?? null;
        const hasDetailedBreakdown = !!(versionDeepAnalysis && Object.keys(versionDeepAnalysis).length > 0);

        const mdSeoOn = comparisonResult.rows[0]?.seoActive ?? false;
        const mdKwCount = comparisonResult.rows[0]?.keywordsProvided ?? 0;
        const mdUseCaseLabel = comparisonResult.scoringContext?.useCaseLabel ?? null;
        const mdScoringVer = comparisonResult.scoringVersion ?? null;

        // Final Decision block (top of comparison) — MATCHES WinnerHeroCard UI
        {
          const mdTopWinner = sortedRows.find((r: any) => r.isWinner);
          if (mdTopWinner) {
            const mdSecond = sortedRows.find((r: any) => !r.isWinner);
            const mdGap = mdSecond ? mdTopWinner.finalScore - mdSecond.finalScore : 0;
            const confidenceLevel = mdGap >= 10 ? 'HIGH' : mdGap >= 5 ? 'MEDIUM' : 'LOW';

            markdown += `## BEST PERFORMING VERSION\n\n`;
            markdown += `# ${mdTopWinner.optionLabel}\n\n`;
            markdown += `**Score:** ${mdTopWinner.finalScore}/100`;
            if (mdGap > 0) {
              markdown += ` | **+${Math.round(mdGap)} pts** vs others | **Confidence: ${confidenceLevel}**`;
            }
            markdown += `\n\n`;

            // QUICK WHY (winnerBreakdown.whatItDoesBetter)
            if (comparisonResult.winnerBreakdown?.whatItDoesBetter && comparisonResult.winnerBreakdown.whatItDoesBetter.length > 0) {
              const quickWhyBullets = comparisonResult.winnerBreakdown.whatItDoesBetter.slice(0, 3).map((item: string) => {
                const cleaned = item.replace(/^(Compared to|vs\.?)\s+[^,]+,\s*/i, '');
                return cleaned.split(/\s+/).slice(0, 8).join(' ');
              });

              markdown += `### WHY THIS WINS (quick)\n\n`;
              quickWhyBullets.forEach((bullet: string) => {
                markdown += `- ${bullet}\n`;
              });
              markdown += `\n`;
            }

            // RECOMMENDATION (decisionLayer)
            if (comparisonResult.decisionLayer) {
              const dl = comparisonResult.decisionLayer;
              markdown += `### RECOMMENDATION\n\n`;
              if (dl.recommendedUseCase) {
                markdown += `**Use this if:** ${dl.recommendedUseCase}\n\n`;
              }
              if (dl.alternativeChoiceNote) {
                markdown += `**Avoid if:** ${dl.alternativeChoiceNote}\n\n`;
              }
              if (dl.publishRecommendation) {
                markdown += `**Next step:** ${dl.publishRecommendation}\n\n`;
              }
            }

            // CORE STRENGTH
            if (comparisonResult.winnerBreakdown?.coreStrength) {
              markdown += `### CORE STRENGTH\n\n`;
              markdown += `${comparisonResult.winnerBreakdown.coreStrength}\n\n`;
            }

            // WHY THIS BEATS OTHERS (with version comparisons)
            if (comparisonResult.winnerBreakdown?.whatItDoesBetter && comparisonResult.winnerBreakdown.whatItDoesBetter.length > 0) {
              const comparisonBullets = comparisonResult.winnerBreakdown.whatItDoesBetter.slice(0, 4).map((item: string) => {
                const match = item.match(/^(Compared to|vs\.?)\s+([^,]+),\s*(.+)$/i);
                if (match) {
                  const versionName = match[2].trim();
                  const benefit = match[3].trim().split(/\s+/).slice(0, 6).join(' ');
                  return `**vs ${versionName}** → ${benefit}`;
                }
                return item.split(/\s+/).slice(0, 8).join(' ');
              });

              markdown += `### WHY THIS BEATS OTHERS\n\n`;
              comparisonBullets.forEach((bullet: string) => {
                markdown += `- ${bullet}\n`;
              });
              markdown += `\n`;
            }

            // MINOR CONSIDERATIONS (tradeoffs)
            if (comparisonResult.winnerBreakdown?.tradeoffs && comparisonResult.winnerBreakdown.tradeoffs.length > 0) {
              markdown += `### MINOR CONSIDERATIONS\n\n`;
              comparisonResult.winnerBreakdown.tradeoffs.forEach((tradeoff: string) => {
                markdown += `- ${tradeoff}\n`;
              });
              markdown += `\n`;
            }

            markdown += `---\n\n`;
          }
        }

        // 3b. ACTIONS — merged "Why it wins — what to do"
        const mdRec = comparisonResult.finalRecommendation;
        {
          const mdActionSteps: string[] = mdRec?.nextSteps?.slice(0, 3) ?? [];
          const mdFallback: string[] = Array.isArray(comparisonResult.priorityActions)
            ? comparisonResult.priorityActions.slice(0, 3).map((p: { title: string; reason: string }) => p.title)
            : [];
          const mdActions = mdActionSteps.length > 0 ? mdActionSteps : mdFallback;
          if (mdActions.length > 0) {
            markdown += `## DO THIS NEXT\n\n`;
            if (mdRec?.why) {
              markdown += `> ${mdRec.why}\n\n`;
            }
            mdActions.forEach((step: string, idx: number) => {
              markdown += `${idx + 1}. ${step}\n`;
            });
            markdown += `\n`;
          }
        }

        // 3c. RANKINGS TABLE
        markdown += `---\n\n`;
        markdown += `## Rankings\n\n`;
        {
          const ctxParts: string[] = [];
          if (mdUseCaseLabel) ctxParts.push(mdUseCaseLabel);
          ctxParts.push(`SEO: ${mdSeoOn ? 'On' : 'Off'}`);
          if (mdKwCount > 0) ctxParts.push(`Keywords: ${mdKwCount}`);
          if (mdScoringVer) ctxParts.push(mdScoringVer);
          markdown += `*Scoring context: ${ctxParts.join(' · ')}*\n\n`;
        }
        if (hasBaseline) {
          markdown += `| Option | Editorial Quality | Conversion Potential | Words | Reading Level | Final Score | Δ vs Original | % Improved |\n`;
          markdown += `|--------|:-----------------:|:--------------------:|:-----:|:-------------:|:-----------:|:-------------:|:----------:|\n`;
        } else {
          markdown += `| Option | Editorial Quality | Conversion Potential | Words | Reading Level | Final Score | Δ vs Best |\n`;
          markdown += `|--------|:-----------------:|:--------------------:|:-----:|:-------------:|:-----------:|:---------:|\n`;
        }
        sortedRows.forEach((row: any) => {
          const winnerTag = row.isWinner ? ' **(Winner)**' : '';
          const isBaselineMdRow = row.optionLabel === 'Original Copy';
          const mdRowDelta = isBaselineMdRow ? null : getComparisonDelta(row.finalScore, baselineScoreMd);
          const mdDeltaLabel = isBaselineMdRow ? 'baseline' : (mdRowDelta ? mdRowDelta.label : `${row.deltaVsBest}`);

          const matchingCardMd = generatedOutputCards.find((card: any) => card.id === row.versionId);
          let contentTextMd = '';
          if (matchingCardMd) {
            if (typeof matchingCardMd.content === 'string') contentTextMd = matchingCardMd.content;
            else if (Array.isArray(matchingCardMd.content)) contentTextMd = matchingCardMd.content.join('\n');
            else if (typeof matchingCardMd.content === 'object') contentTextMd = structuredToPlainText(matchingCardMd.content as StructuredCopyOutput);
          }

          const editorialCol = contentTextMd ? `${computeEditorialQuality(contentTextMd)}/100` : '—';
          const convPotentialCol = contentTextMd ? `${computeConversionPotential(contentTextMd)}/100` : '—';
          const wcrl = contentTextMd ? computeWordCountAndReadingLevel(contentTextMd) : null;
          const wordsCol = wcrl ? `${wcrl.wordCount}` : '—';
          const readingCol = wcrl ? wcrl.readingLevel : '—';

          if (hasBaseline) {
            let improvPct: string;
            if (row.improvementPct === null) improvPct = '—';
            else if (row.improvementPct === 0) improvPct = '0%';
            else improvPct = `${row.improvementPct > 0 ? '+' : ''}${row.improvementPct}%`;
            markdown += `| ${row.optionLabel}${winnerTag} | ${editorialCol} | ${convPotentialCol} | ${wordsCol} | ${readingCol} | ${row.finalScore} | ${mdDeltaLabel} | ${improvPct} |\n`;
          } else {
            markdown += `| ${row.optionLabel}${winnerTag} | ${editorialCol} | ${convPotentialCol} | ${wordsCol} | ${readingCol} | ${row.finalScore} | ${mdDeltaLabel} |\n`;
          }
        });
        markdown += `\n`;
        markdown += `> **Editorial Quality** measures writing clarity and professionalism. **Conversion Potential** measures likelihood of driving reader action. **Final Score** is 0–100.${hasBaseline ? ' **Δ vs Original** and **% Improved** are relative to the Original Copy baseline.' : ' **Δ vs Best** compares each option to the top-scoring version.'}\n\n`;

        // 3d. PER-ROW DECISION DETAILS (decisionSummary, decisionReason only)
        const rowsWithDecision = sortedRows.filter((r: any) => r.decisionSummary || r.decisionReason);
        if (rowsWithDecision.length > 0) {
          markdown += `### Decision Details\n\n`;
          rowsWithDecision.forEach((row: any) => {
            const winnerLabelMd = row.isWinner ? ' **(Winner)**' : '';
            markdown += `**${row.optionLabel}${winnerLabelMd}**\n\n`;
            if (row.decisionSummary) {
              markdown += `${row.decisionSummary}\n\n`;
            }
            if (row.decisionReason) {
              markdown += `*${row.decisionReason}*\n\n`;
            }
          });
        }

        // 4. ALL VERSIONS BREAKDOWN — only when deep analysis was actually generated
        if (hasDetailedBreakdown) {
          markdown += `---\n\n`;
          markdown += `## All Versions Breakdown\n\n`;

          // Determine winner type for the winner section
          const winnerRowMd = sortedRows.find((r: any) => r.isWinner);
          const secondRowMd = sortedRows.find((r: any) => !r.isWinner);
          const winnerTypeMd = winnerRowMd && secondRowMd ? classifyWinnerType(winnerRowMd.finalScore, secondRowMd.finalScore) : null;

          sortedRows.forEach((row: any, idx: number) => {
            markdown += `### ${row.isWinner ? '[WINNER] ' : ''}${row.optionLabel}\n\n`;
            const isBaselineBdRow = row.optionLabel === 'Original Copy';
            const bdDelta = isBaselineBdRow ? null : getComparisonDelta(row.finalScore, baselineScoreMd);
            const bdDeltaLabel = isBaselineBdRow ? 'baseline' : (bdDelta ? bdDelta.label : `${row.deltaVsBest}`);

            // Get content text for all new computations
            const matchingCardForMdScores = generatedOutputCards.find((card: any) => card.id === row.versionId);
            let contentTextForMdScores = '';
            if (matchingCardForMdScores) {
              if (typeof matchingCardForMdScores.content === 'string') {
                contentTextForMdScores = matchingCardForMdScores.content;
              } else if (Array.isArray(matchingCardForMdScores.content)) {
                contentTextForMdScores = matchingCardForMdScores.content.join('\n');
              } else if (typeof matchingCardForMdScores.content === 'object') {
                contentTextForMdScores = structuredToPlainText(matchingCardForMdScores.content as StructuredCopyOutput);
              }
            }

            // — ITEM 7: Verification flags FIRST (before scores) —
            if (row.verificationFlags && row.verificationFlags.length > 0) {
              markdown += `#### ⚠️ Verify before publishing\n\n`;
              row.verificationFlags.forEach((flag: string) => {
                markdown += `- "${flag}" — source unknown\n`;
              });
              markdown += `\n`;
            }

            // — ITEM 1: Dual scores —
            const editorialQ = contentTextForMdScores ? computeEditorialQuality(contentTextForMdScores) : row.finalScore;
            const convPotential = contentTextForMdScores ? computeConversionPotential(contentTextForMdScores) : row.finalScore;
            markdown += `**Editorial Quality:** ${editorialQ}/100\n`;
            markdown += `**Conversion Potential:** ${convPotential}/100\n\n`;

            // — ITEM 8: Word count + reading level —
            if (contentTextForMdScores) {
              const wcrl = computeWordCountAndReadingLevel(contentTextForMdScores);
              markdown += `**Word Count:** ${wcrl.wordCount} words\n`;
              markdown += `**Reading Level:** ${wcrl.readingLevel}\n\n`;
            }

            // — ITEM 6: Winner Type (winner only) —
            if (row.isWinner && winnerTypeMd) {
              markdown += `**Winner Type:** ${winnerTypeMd.type}\n`;
              markdown += `**Reason:** ${winnerTypeMd.reason}\n\n`;
            }

            // Score delta line
            let statsLine = `**Final Score:** ${row.finalScore}/100 | **Δ vs Original:** ${bdDeltaLabel}`;
            if (hasBaseline) {
              let improvPctStr: string;
              if (row.improvementPct === null) improvPctStr = '—';
              else if (row.improvementPct === 0) improvPctStr = '0%';
              else improvPctStr = `${row.improvementPct > 0 ? '+' : ''}${row.improvementPct}%`;
              statsLine += ` | **% Improved:** ${improvPctStr}`;
            }
            markdown += `${statsLine}\n\n`;

            // — ITEM 2: Persuasion breakdown —
            if (contentTextForMdScores) {
              const pb = computePersuasionBreakdown(contentTextForMdScores);
              markdown += `#### Persuasion Breakdown\n\n`;
              markdown += `- Emotional Impact: ${pb.emotionalImpact}/100\n`;
              markdown += `- Clarity: ${pb.clarity}/100\n`;
              markdown += `- Trust: ${pb.trust}/100\n`;
              markdown += `- Specificity: ${pb.specificity}/100\n`;
              markdown += `- Urgency: ${pb.urgency}/100\n`;
              markdown += `- Professionalism: ${pb.professionalism}/100\n`;
              markdown += `- Readability: ${pb.readability}/100\n`;
              markdown += `- CTA Strength: ${pb.ctaStrength}/100\n`;
              markdown += `- Audience Fit: ${pb.audienceFit}/100\n`;
              markdown += `- Differentiation: ${pb.differentiation}/100\n\n`;
            }

            // — ITEM 3: Audience Fit —
            if (contentTextForMdScores) {
              const af = computeAudienceFit(contentTextForMdScores, true);
              markdown += `#### Audience Fit\n\n`;
              markdown += `- SMB Owners: ${af.smbOwners}${af.smbReason ? ` — ${af.smbReason}` : ''}\n`;
              markdown += `- Corporate Executives: ${af.corporateExecutives}${af.corporateReason ? ` — ${af.corporateReason}` : ''}\n`;
              markdown += `- Traditional Industries: ${af.traditionalIndustries}${af.traditionalReason ? ` — ${af.traditionalReason}` : ''}\n`;
              markdown += `- High-pressure sales teams: ${af.highPressureSales}${af.highPressureReason ? ` — ${af.highPressureReason}` : ''}\n\n`;
            }

            // — ITEM 4: Risk Factors —
            if (contentTextForMdScores) {
              const risks = computeRiskFactors(contentTextForMdScores, row.verificationFlags);
              if (risks.length > 0) {
                markdown += `#### Risk Factors\n\n`;
                risks.forEach(r => { markdown += `- ${r}\n`; });
                markdown += `\n`;
              }
            }

            const analysis = versionDeepAnalysis?.[row.versionId];
            if (analysis && !analysis.errorMessage) {
              markdown += `${analysis.summary}\n\n`;

              // Legacy sub-scores (kept for reference alongside new breakdown)
              if (contentTextForMdScores) {
                const subScoresMd = calculateMultiScoreDisplay(contentTextForMdScores);
                markdown += `- **Conversion (${subScoresMd.conversion}/100):** ${getConversionExplanation(subScoresMd.conversion)}\n`;
                markdown += `- **Trust (${subScoresMd.trust}/100):** ${getTrustExplanation(subScoresMd.trust)}\n`;
                markdown += `- **Risk (${subScoresMd.risk}):** ${getRiskExplanation(subScoresMd.risk)}\n\n`;
              }

              // Absolute Score removed — shown in rankings table only

              if (analysis.keyStrengths?.length > 0) {
                markdown += `#### Key Strengths\n\n`;
                analysis.keyStrengths.forEach((s: string) => { markdown += `- ${s}\n`; });
                markdown += `\n`;
              }

              // — ITEM 5: Why This Version Won (winner only) —
              if (row.isWinner && comparisonResult.winnerBreakdown?.whatItDoesBetter?.length > 0) {
                markdown += `#### Why This Version Won\n\n`;
                comparisonResult.winnerBreakdown.whatItDoesBetter.forEach((advantage: string) => {
                  markdown += `- ${advantage}\n`;
                });
                markdown += `\n`;
              }

              if (analysis.suggestedImprovements?.length > 0) {
                markdown += `#### Suggested Improvements\n\n`;
                analysis.suggestedImprovements.forEach((s: any) => {
                  const text = typeof s === 'object' && s !== null ? s.text : s;
                  if (text) markdown += `- ${text}\n`;
                });
                markdown += `\n`;
              }

              if (analysis.strategicRecommendation) {
                markdown += `#### Strategic Recommendation\n\n`;
                markdown += `${analysis.strategicRecommendation}\n\n`;
              }
            } else if (analysis?.errorMessage) {
              markdown += `**Best Use Case:** ${row.bestUseCase}\n\n`;
              markdown += `*Analysis error: ${analysis.errorMessage}*\n\n`;
            } else {
              markdown += `**Best Use Case:** ${row.bestUseCase}\n\n`;
              markdown += `*(Summary only — narrative analysis was not generated for this version.)*\n\n`;
            }

            // DECISION LAYER for Winner
            if (row.isWinner && comparisonResult.decisionLayer) {
              const dl = comparisonResult.decisionLayer;
              markdown += `#### Decision\n\n`;
              if (dl.recommendedLabel) markdown += `**Recommended:** ${dl.recommendedLabel}\n\n`;
              if (dl.recommendedUseCase) markdown += `**Best for:** ${dl.recommendedUseCase}\n\n`;
              if (dl.publishRecommendation) markdown += `**Use it when:** ${dl.publishRecommendation}\n\n`;
              if (dl.alternativeChoiceNote) markdown += `**Alternative:** ${dl.alternativeChoiceNote}\n\n`;
              if (dl.nextImprovementAction) markdown += `**Next step:** ${dl.nextImprovementAction}\n\n`;
            }

            if (row.isWinner && comparisonResult.winnerBreakdown?.coreStrength) {
              markdown += `#### Core Strength\n\n`;
              markdown += `${comparisonResult.winnerBreakdown.coreStrength}\n\n`;
            }

            if (row.insight || row.action) {
              if (row.insight) markdown += `**Key Insight:** *${row.insight}*\n\n`;
              if (row.action) markdown += `**What to do:** ${row.action}\n\n`;
            }

            if (idx < sortedRows.length - 1) markdown += `---\n\n`;
          });
          markdown += `\n> *Deep analysis provides narrative guidance and is separate from numeric scoring.*\n\n`;
        }
      }
    } else if (comparisonCards.length > 0) {
      // If we only have comparison cards (no structured comparison result)
      markdown += `## AI Analysis Summary\n\n`;

      const allComparisonContents = comparisonCards
        .filter(c => typeof c.content === 'string')
        .map(c => typeof c.content === 'string' ? c.content : '')
        .filter(content => content.trim() !== '');

      if (allComparisonContents.length > 0) {
        // Same merging logic as HTML export (lines 1534-1543)
        const mergedTableData = extractAndMergeAllTables(allComparisonContents);

        // If we have merged table data, render ONLY the merged table
        if (mergedTableData && mergedTableData.rows.length > 0) {
          markdown += '| ' + mergedTableData.headers.join(' | ') + ' |\n';
          markdown += '|' + mergedTableData.headers.map(() => '--------|').join('') + '\n';
          mergedTableData.rows.forEach(row => {
            markdown += '| ' + row.join(' | ') + ' |\n';
          });
          markdown += '\n';
        } else {
          // Fallback: render all contents separately
          markdown += allComparisonContents.join('\n\n---\n\n');
          markdown += '\n\n';
        }
      }
    }
  }

  // Footer
  markdown += `\n---\n\n`;
  markdown += `*Generated by CopyZap - ${new Date().toLocaleString()}*\n`;

  return markdown;
};

/**
 * Enhanced Text export with clear visual sections
 */
export const formatAsEnhancedText = (
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  originalInputScore?: any,
  promptEvaluation?: PromptEvaluation,
  comparisonResult?: any
): string => {
  // First generate markdown, then convert to plain text with better formatting
  const markdown = formatAsEnhancedMarkdown(
    formState,
    generatedOutputCards,
    originalInputScore,
    promptEvaluation,
    comparisonResult
  );

  let text = markdown;

  // Remove markdown formatting but keep structure
  text = text.replace(/^#{1,6}\s/gm, ''); // Remove heading markers
  text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold
  text = text.replace(/\*(.*?)\*/g, '$1'); // Remove italic
  text = text.replace(/`([^`]+)`/g, '$1'); // Remove code blocks
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links but keep text
  text = text.replace(/^>\s/gm, '  '); // Convert blockquotes to indentation
  text = text.replace(/^[-*]\s/gm, '  • '); // Convert list items to bullets

  // Convert tables to text format
  text = text.replace(/\|/g, ' | ');

  // Add visual separators
  text = text.replace(/^---$/gm, '='.repeat(80));

  return text;
};

/**
 * Export all content as a complete formatted HTML file
 */
export const exportAsFormattedHtml = (
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  originalInputScore?: any,
  promptEvaluation?: PromptEvaluation,
  comparisonResult?: ComparisonResult,
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>,
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta,
  loadingVersionIds?: Set<string>
): void => {
  try {
    
    let htmlContent = '';

    // Collect non-comparison cards up-front for TOC and body
    const contentCards = (generatedOutputCards ?? []).filter(card =>
      !card.sourceDisplayName?.includes('Analysis') && !card.sourceDisplayName?.includes('Comparison')
    );

    // If the comparisonResult references the synthetic "__original__" card but it's not in
    // generatedOutputCards, synthesize it from formState.originalCopy so it appears in the export
    const ORIGINAL_VERSION_ID = '__original__';
    const hasOriginalInCards = contentCards.some(c => c.id === ORIGINAL_VERSION_ID || c.type === GeneratedContentItemType.Original);
    const originalRowInComparison = comparisonResult?.rows?.find(r => r.versionId === ORIGINAL_VERSION_ID);
    if (!hasOriginalInCards && originalRowInComparison && formState.originalCopy?.trim()) {
      const syntheticOriginalCard: GeneratedContentItem = {
        id: ORIGINAL_VERSION_ID,
        type: GeneratedContentItemType.Original,
        content: formState.originalCopy.trim(),
        generatedAt: new Date().toISOString(),
        sourceDisplayName: 'Original Copy',
        score: originalRowInComparison.finalScore != null
          ? { overall: originalRowInComparison.finalScore, clarity: 0, persuasiveness: 0, toneMatch: 0, engagement: 0 }
          : undefined,
      };
      contentCards.push(syntheticOriginalCard);
    }

    const winnerRow = comparisonResult?.rows?.find(r => r.isWinner);
    const winnerVersionId = winnerRow?.versionId;
    const targetWordCount = calculateTargetWordCount(formState).target;
    const totalVariants = contentCards.length;
    const lang = formState.language || 'English';
    const htmlLangCode = ({ english: 'en', spanish: 'es', french: 'fr', german: 'de', portuguese: 'pt', italian: 'it', dutch: 'nl' } as Record<string, string>)[lang.trim().toLowerCase()] || 'en';

    // HTML document start with premium styling
    htmlContent += `<!DOCTYPE html>
<html lang="${htmlLangCode}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Copy Report — ${escapeHtml(formState.projectDescription || 'CopyZap')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      background: #ffffff;
      color: #374151;
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 32px 80px;
    }
    h1, h2, h3, h4 { color: #111827; }
    a { color: #111827; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code, pre { font-family: 'Courier New', monospace; }
    .label {
      font-size: 11px;
      letter-spacing: 0.1em;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    .breadcrumb-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      padding: 8px 24px;
      display: flex;
      align-items: center;
      gap: 0;
      flex-wrap: nowrap;
      overflow: hidden;
      z-index: 100;
      font-size: 12px;
      color: #6b7280;
    }
    .breadcrumb-nav a {
      color: #374151;
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
      display: inline-block;
    }
    .breadcrumb-nav a:hover { color: #111827; text-decoration: underline; }
    .breadcrumb-nav .bc-sep { margin: 0 6px; color: #d1d5db; flex-shrink: 0; }
    .breadcrumb-nav .bc-label { margin-right: 10px; font-weight: 600; color: #9ca3af; flex-shrink: 0; }
    @media print {
      body { padding: 24px; }
      .no-print { display: none !important; }
      section { page-break-before: always; }
      #doc-header, #toc, #input-summary { page-break-before: auto; }
      .score-block, .geo-block, .seo-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body id="top">
`;

    // ── DOCUMENT HEADER ─────────────────────────────────────────────────────────
    htmlContent += '<div id="doc-header" style="text-align:left;padding-bottom:28px;margin-bottom:40px;">\n';
    htmlContent += '<p class="label" style="margin-bottom:10px;font-size:10px;letter-spacing:0.14em;color:#9ca3af;text-transform:uppercase;font-weight:600;">CopyZap &mdash; Copy Report</p>\n';
    htmlContent += `<h1 style="font-size:30px;font-weight:800;color:#111827;margin-bottom:10px;letter-spacing:-0.01em;">${escapeHtml(formState.projectDescription || 'Untitled Project')}</h1>\n`;
    htmlContent += `<p style="font-size:13px;color:#6b7280;margin:0;">Generated: ${formatExportTimestamp()} &nbsp;&middot;&nbsp; ${totalVariants} variant${totalVariants !== 1 ? 's' : ''} evaluated &nbsp;&middot;&nbsp; Language: ${lang}</p>\n`;
    htmlContent += '<hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0 0;">\n';
    htmlContent += '</div>\n';

    // Winner announcement banner
    if (winnerRow) {
      const winnerCard = contentCards.find(c => c.id === winnerVersionId);
      const winnerLabel = winnerCard?.sourceDisplayName || winnerRow.optionLabel || 'Winner';
      // Use the raw LLM score (winnerRow.score) — it's the primary ranking signal and matches
      // what the user sees in the rankings table. finalScore can be dragged lower by heuristics
      // that are unreliable for blended/structured content.
      const bannerScore = winnerRow.finalScore ?? (winnerRow as any).score;
      htmlContent += `<div style="background:#fff7ed;border-left:4px solid #f97316;padding:14px 20px;border-radius:0 6px 6px 0;font-size:14px;font-weight:600;color:#9a3412;margin:0 0 40px 0;">&#9733;&nbsp; Best performing version: ${winnerLabel} &mdash; Score: ${bannerScore}/100</div>\n`;
    }

    // ── TABLE OF CONTENTS ────────────────────────────────────────────────────────
    htmlContent += '<nav id="toc" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin-bottom:48px;">\n';
    htmlContent += '<p class="label" style="margin-bottom:16px;">Contents</p>\n';

    // TOC row helper
    let tocIdx = 0;
    const renderTocRow = (id: string, name: string, score: number | null, isWin: boolean) => {
      const scoreStr = score !== null ? `${score}/100` : '';
      const winTag = isWin ? ' &nbsp;<span style="color:#f97316;font-weight:700;">&#9733; Winner</span>' : '';
      const rowColor = isWin ? '#f97316' : '#111827';
      const rowWeight = isWin ? '700' : '400';
      tocIdx++;
      return `<div style="display:flex;align-items:baseline;gap:0;margin-bottom:6px;">`
        + `<a href="#${id}" style="color:${rowColor};font-weight:${rowWeight};font-size:14px;white-space:nowrap;">${tocIdx}. ${name}${winTag}</a>`
        + `<span style="flex:1;border-bottom:1px dotted #d1d5db;margin:0 8px 3px;"></span>`
        + `<span style="font-size:13px;font-weight:${rowWeight};color:${rowColor};white-space:nowrap;">${scoreStr}</span>`
        + `</div>\n`;
    };

    // Build a score lookup from comparisonResult rows (authoritative source for scores)
    const comparisonScoreMap = new Map<string, number>();
    if (comparisonResult?.rows) {
      comparisonResult.rows.forEach(row => {
        if (row.versionId && row.finalScore != null) comparisonScoreMap.set(row.versionId, row.finalScore);
      });
    }

    htmlContent += renderTocRow('input-summary', 'Input Summary', null, false);
    contentCards.forEach(card => {
      // Prefer comparison score (authoritative), fall back to card.score.overall
      const score = comparisonScoreMap.get(card.id) ?? card.score?.overall ?? null;
      const isWin = card.id === winnerVersionId;
      htmlContent += renderTocRow(`output-${card.id}`, stripEmoji(card.sourceDisplayName || card.type), score, isWin);
    });
    if (comparisonResult) {
      htmlContent += renderTocRow('comparison-rankings', 'Comparison &amp; Rankings', null, false);
    }
    htmlContent += '</nav>\n';

    // ── INPUT SUMMARY ────────────────────────────────────────────────────────────
    htmlContent += '<section id="input-summary" style="border-left:1px solid #e5e7eb;padding-left:20px;margin-bottom:56px;">\n';
    htmlContent += '<p class="label" style="margin-bottom:12px;">INPUT SUMMARY</p>\n';

    const sourceText = formState.tab === 'create'
      ? (formState.businessDescription || '')
      : (formState.originalCopy || '');
    const sourceLabel = formState.tab === 'create' ? 'Business Description' : 'Original Copy';

    htmlContent += `<p style="font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px;">${sourceLabel}</p>\n`;
    if (sourceText) {
      htmlContent += `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;font-style:italic;color:#374151;white-space:pre-wrap;font-size:14px;line-height:1.7;margin-bottom:20px;">${sourceText}</div>\n`;
    }

    // Configuration table
    const configRows: [string, string][] = [
      ['Language', formState.language || '—'],
      ['Tone', formState.tone || '—'],
      ['Word Count', `${formState.wordCount || '—'}${formState.wordCount === 'Custom' ? ` (${formState.customWordCount})` : ''}`],
    ];
    if (formState.targetAudience) configRows.push(['Target Audience', formState.targetAudience]);
    if (formState.keyMessage) configRows.push(['Key Message', formState.keyMessage]);
    if (formState.callToAction) configRows.push(['Call to Action', formState.callToAction]);
    if (formState.desiredEmotion) configRows.push(['Desired Emotion', formState.desiredEmotion]);
    if (formState.brandValues) configRows.push(['Brand Values', formState.brandValues]);
    if (formState.keywords) configRows.push(['Keywords', formState.keywords]);

    htmlContent += '<table style="width:100%;border-collapse:collapse;font-size:13px;">\n';
    htmlContent += '<thead><tr style="border-bottom:2px solid #111827;"><th style="text-align:left;padding:8px;color:#6b7280;font-weight:600;">Setting</th><th style="text-align:left;padding:8px;color:#6b7280;font-weight:600;">Value</th></tr></thead>\n';
    htmlContent += '<tbody>\n';
    configRows.forEach(([setting, value], i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      htmlContent += `<tr style="background:${bg};border-bottom:1px solid #e5e7eb;"><td style="padding:8px 8px;color:#6b7280;">${setting}</td><td style="padding:8px 8px;color:#111827;font-weight:500;">${value}</td></tr>\n`;
    });
    htmlContent += '</tbody></table>\n';
    htmlContent += '</section>\n';
    htmlContent += '<hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 56px;">\n';


    // (Input Summary already rendered above)

    // LLM EVALUATION SECTION
    // This section is specifically designed for external LLM evaluation (ChatGPT, Claude, etc.)
    htmlContent += '\n<!-- LLM EVALUATION SECTION: Only use content inside #llm-evaluation-context and #llm-evaluation-data when independently evaluating copy outputs. Ignore all scoring and comparison UI elsewhere in this file. -->\n\n';

    // Context Section
    htmlContent += '<section id="llm-evaluation-context" data-purpose="llm-context" style="display: none;">\n';
    if (formState.language) htmlContent += `  <div data-context-field="language">${formState.language}</div>\n`;
    if (formState.tone) htmlContent += `  <div data-context-field="tone">${formState.tone}</div>\n`;
    if (formState.wordCount) {
      const wordCountText = formState.wordCount === 'Custom' ? `${formState.wordCount} (${formState.customWordCount})` : formState.wordCount;
      htmlContent += `  <div data-context-field="word-count">${wordCountText}</div>\n`;
    }
    if (formState.targetAudience) htmlContent += `  <div data-context-field="target-audience">${escapeHtml(formState.targetAudience)}</div>\n`;
    if (formState.keyMessage) htmlContent += `  <div data-context-field="key-message">${escapeHtml(formState.keyMessage)}</div>\n`;
    if (formState.callToAction) htmlContent += `  <div data-context-field="call-to-action">${escapeHtml(formState.callToAction)}</div>\n`;
    if (formState.desiredEmotion) htmlContent += `  <div data-context-field="desired-emotion">${formState.desiredEmotion}</div>\n`;
    if (formState.brandValues) htmlContent += `  <div data-context-field="brand-values">${formState.brandValues}</div>\n`;
    htmlContent += '</section>\n\n';

    // Copy Data Section
    htmlContent += '<section id="llm-evaluation-data" data-purpose="llm-copy-extraction" data-evaluation-scope="copy-only" style="display: none;">\n';

    // Add original copy if in improve mode
    if (formState.tab === 'improve' && formState.originalCopy?.trim()) {
      const normalizedOriginal = normalizeCopyForLLMExport(formState.originalCopy);
      htmlContent += '  <article data-copy-id="__original__" data-copy="original" data-copy-kind="original" data-copy-label="Original Copy">\n';
      htmlContent += '    <h2>Original Copy</h2>\n';
      htmlContent += '    <div data-copy-body="true" data-copy-normalized="true">\n';
      htmlContent += `${normalizedOriginal}\n`;
      htmlContent += '    </div>\n';
      htmlContent += '  </article>\n\n';
    }

    // Add all generated outputs (excluding comparison/analysis cards)
    if (generatedOutputCards && generatedOutputCards.length > 0) {
       const isComparison = card.sourceDisplayName?.includes('Analysis') ||
                            card.sourceDisplayName?.includes('Comparison');
        // The original is already emitted separately above (improve mode) — don't duplicate it here.
        const alreadyEmittedOriginal = formState.tab === 'improve' && !!formState.originalCopy?.trim()
          && (card.id === '__original__' || card.type === GeneratedContentItemType.Original);
        return !isComparison && !alreadyEmittedOriginal;
      });

      contentCards.forEach((card, idx) => {
        // Determine copy kind
        let copyKind = 'generated';
        if (card.type === GeneratedContentItemType.Original) {
          copyKind = 'original';
        } else if (card.persona) {
          copyKind = 'voice';
        } else if (card.modificationInstruction) {
          copyKind = 'modified';
        }

        const copyLabel = card.sourceDisplayName || card.type || `Version ${idx + 1}`;

        htmlContent += `  <article data-copy-id="${card.id}" data-copy="generated-${idx + 1}" data-copy-kind="${copyKind}" data-copy-label="${escapeHtml(copyLabel)}">\n`;
        htmlContent += `    <h2>${escapeHtml(copyLabel)}</h2>\n`;
        htmlContent += '    <div data-copy-body="true" data-copy-normalized="true">\n';

        // Extract and normalize content for consistent LLM evaluation
        let actualContent = card.content;
        if (typeof card.content === 'object' && card.content !== null && 'content' in card.content) {
          actualContent = (card.content as any).content;
        }

        // Apply normalization to ensure consistent format across all versions
        const normalizedContent = normalizeCopyForLLMExport(actualContent);
        htmlContent += `${normalizedContent}\n`;

        htmlContent += '    </div>\n';
        htmlContent += '  </article>\n\n';
      });
    }

    htmlContent += '</section>\n\n';

    // OUTPUT CARDS SECTION — one document section per variant
    // Uses the already-computed contentCards (which may include synthetic Original Copy)
    if (contentCards.length > 0) {
      const exportScoringContext: ScoringContext = {
        useCaseKey: (formState as any).useCaseKey || '',
        useCaseLabel: formState.section || 'General',
      };

      contentCards.forEach((card) => {
        htmlContent += generateFullHtmlExportForCard(card, targetWordCount, winnerVersionId, exportScoringContext, comparisonResult);
      });
    }

    // COMPARISON & RANKINGS SECTION
    const comparisonCards = generatedOutputCards.filter(card =>
      card.sourceDisplayName?.includes('Analysis') || card.sourceDisplayName?.includes('Comparison')
    );

    if (comparisonResult || comparisonCards.length > 0) {
      htmlContent += '<section id="comparison-rankings" style="margin-top: 80px;">\n';
      htmlContent += '<p class="label" style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; margin: 0 0 8px 0;">Analysis</p>\n';
      htmlContent += '<h2 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 24px 0; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">Comparison &amp; Rankings</h2>\n';

      if (comparisonResult && comparisonResult.rows && comparisonResult.rows.length > 0) {
        // Find the original copy score as baseline for delta calculations
        const originalRow = comparisonResult.rows.find(r =>
          r.versionId === '__original__' || r.optionLabel === 'Original Copy'
        );
        const originalBaseScore = originalRow?.finalScore ?? null;

        const sortedRows = [...comparisonResult.rows].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

        // Rankings — flex-div layout matching the app's ranking list style
        htmlContent += '<div style="margin-bottom: 40px;">\n';

        sortedRows.forEach((row, idx) => {
          const matchedCard = contentCards.find(c => c.id === row.versionId)
            || generatedOutputCards.find(c => c.id === row.versionId);
          const versionLabel = row.optionLabel || matchedCard?.sourceDisplayName || `Version ${idx + 1}`;
          const score = row.finalScore ?? 0;
          const isOriginal = row.versionId === '__original__' || row.optionLabel === 'Original Copy';
          const isWinner = row.isWinner === true;

          // Score color
          let scoreColor = '#16a34a';
          if (score < 70) scoreColor = '#dc2626';
          else if (score < 80) scoreColor = '#d97706';
          else if (score < 90) scoreColor = '#111827';

          // Delta vs original
          let deltaHtml = '';
          if (isOriginal) {
            deltaHtml = '<span style="font-size: 12px; color: #9ca3af;">baseline</span>';
          } else if (originalBaseScore !== null) {
            const delta = score - originalBaseScore;
            const pct = originalBaseScore > 0 ? Math.round((delta / originalBaseScore) * 100) : 0;
            const sign = delta >= 0 ? '+' : '';
            const deltaColor = delta >= 0 ? '#16a34a' : '#dc2626';
            deltaHtml = `<span style="font-size: 12px; font-weight: 600; color: ${deltaColor}; white-space: nowrap;">${sign}${delta} pts (${sign}${pct}%)</span>`;
          }

          // Get content text for new computations
          let htmlContentStr = '';
          if (matchedCard) {
            let cardContent = matchedCard.content;
            if (typeof cardContent === 'object' && cardContent !== null && 'content' in cardContent) cardContent = (cardContent as any).content;
            if (typeof cardContent === 'string') {
              htmlContentStr = cardContent;
            } else if (Array.isArray(cardContent)) {
              htmlContentStr = (cardContent as string[]).join('\n');
            } else if (cardContent && typeof cardContent === 'object' && 'headline' in (cardContent as any)) {
              htmlContentStr = structuredToPlainText(cardContent as StructuredCopyOutput);
            }
          }

          // Dual scores + word count
          const htmlEq = htmlContentStr ? computeEditorialQuality(htmlContentStr) : score;
          const htmlCp = htmlContentStr ? computeConversionPotential(htmlContentStr) : score;
          const htmlWcrl = htmlContentStr ? computeWordCountAndReadingLevel(htmlContentStr) : null;
          const htmlPb = htmlContentStr ? computePersuasionBreakdown(htmlContentStr) : null;
          const htmlAf = htmlContentStr ? computeAudienceFit(htmlContentStr, false) : null;
          const htmlRisks = htmlContentStr ? computeRiskFactors(htmlContentStr, row.verificationFlags) : [];

          // Generation date
          let dateStr = '';
          if (matchedCard?.generatedAt) {
            try {
              const d = new Date(matchedCard.generatedAt);
              dateStr = d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
            } catch { /* ignore */ }
          }

          // Row container (full-width block, not flex row, to accommodate expanded content)
          const rowBorder = isWinner ? '#f97316' : 'transparent';
          htmlContent += `<div style="padding:14px 0 14px 12px;border-bottom:1px solid #e5e7eb;border-left:3px solid ${rowBorder};">\n`;

          // Row header: rank + name + delta + score
          htmlContent += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">\n';
          htmlContent += '<div style="display:flex;align-items:flex-start;gap:12px;">\n';
          htmlContent += `<span style="font-size:12px;font-weight:700;color:#9ca3af;min-width:20px;padding-top:2px;">${idx + 1}</span>\n`;
          htmlContent += '<div>\n';
          htmlContent += `<div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">${versionLabel}${isWinner ? ' <span style="font-size:11px;font-weight:600;color:#f97316;">&#9733; Winner</span>' : ''}</div>\n`;
          if (dateStr) htmlContent += `<div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">${dateStr}</div>\n`;
          htmlContent += '</div>\n</div>\n';
          // Score + delta
          htmlContent += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;padding-left:16px;">\n';
          htmlContent += `<div>${deltaHtml}</div>\n`;
          htmlContent += `<div style="font-size:16px;font-weight:700;color:${scoreColor};">${score}<span style="font-size:11px;font-weight:400;color:#9ca3af;">/100</span></div>\n`;
          htmlContent += '</div>\n</div>\n';

          // ── ITEM 7: Verification flags at top ──
          if (row.verificationFlags && row.verificationFlags.length > 0) {
            htmlContent += '<div style="margin-top:10px;padding:8px 12px;background:#fef3c7;border-left:3px solid #fbbf24;border-radius:4px;">\n';
            htmlContent += '<p style="margin:0 0 4px 0;font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">⚠️ Verify before publishing</p>\n';
            htmlContent += '<ul style="margin:0;padding:0;list-style:none;">\n';
            row.verificationFlags.forEach((flag: string) => {
              const ef = String(flag).replace(/</g, '&lt;').replace(/>/g, '&gt;');
              htmlContent += `<li style="font-size:11px;color:#78350f;line-height:1.5;margin-bottom:2px;">• "${ef}" — source unknown</li>\n`;
            });
            htmlContent += '</ul>\n</div>\n';
          }

          // ── ITEM 1: Dual scores ──
          htmlContent += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;">\n';
          const eqColor = htmlEq >= 80 ? '#15803d' : htmlEq >= 60 ? '#92400e' : '#dc2626';
          const cpColor = htmlCp >= 80 ? '#1e40af' : htmlCp >= 60 ? '#92400e' : '#dc2626';
          htmlContent += `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 12px;min-width:140px;">\n`;
          htmlContent += `<div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Editorial Quality</div>\n`;
          htmlContent += `<div style="font-size:18px;font-weight:800;color:${eqColor};">${htmlEq}<span style="font-size:10px;font-weight:400;color:#9ca3af;">/100</span></div>\n`;
          htmlContent += '</div>\n';
          htmlContent += `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:6px 12px;min-width:160px;">\n`;
          htmlContent += `<div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Conversion Potential</div>\n`;
          htmlContent += `<div style="font-size:18px;font-weight:800;color:${cpColor};">${htmlCp}<span style="font-size:10px;font-weight:400;color:#9ca3af;">/100</span></div>\n`;
          htmlContent += '</div>\n';
          // ── ITEM 8: Word count + reading level ──
          if (htmlWcrl) {
            const rlColor = htmlWcrl.readingLevel === 'Easy' ? '#15803d' : htmlWcrl.readingLevel === 'Medium' ? '#92400e' : '#374151';
            htmlContent += `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:6px 12px;">\n`;
            htmlContent += `<div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Words / Level</div>\n`;
            htmlContent += `<div style="font-size:13px;font-weight:700;color:${rlColor};">${htmlWcrl.wordCount} <span style="font-weight:400;">words</span> · <span style="color:${rlColor};">${htmlWcrl.readingLevel}</span></div>\n`;
            htmlContent += '</div>\n';
          }
          htmlContent += '</div>\n';

          // ── ITEM 2: Persuasion breakdown grid (10 dimensions as progress bars) ──
          if (htmlPb) {
            const pbDims: [string, number][] = [
              ['Emotional Impact', htmlPb.emotionalImpact],
              ['Clarity', htmlPb.clarity],
              ['Trust', htmlPb.trust],
              ['Specificity', htmlPb.specificity],
              ['Urgency', htmlPb.urgency],
              ['Professionalism', htmlPb.professionalism],
              ['Readability', htmlPb.readability],
              ['CTA Strength', htmlPb.ctaStrength],
              ['Audience Fit', htmlPb.audienceFit],
              ['Differentiation', htmlPb.differentiation],
            ];
            htmlContent += '<div style="margin-top:10px;">\n';
            htmlContent += '<div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Persuasion Breakdown</div>\n';
            htmlContent += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:4px 16px;">\n';
            pbDims.forEach(([name, val]) => {
              const barColor = val >= 75 ? '#22c55e' : val >= 50 ? '#f59e0b' : '#f87171';
              htmlContent += `<div style="display:flex;align-items:center;gap:6px;">\n`;
              htmlContent += `<span style="font-size:11px;color:#374151;min-width:110px;">${name}</span>\n`;
              htmlContent += `<div style="flex:1;background:#f3f4f6;border-radius:3px;height:6px;overflow:hidden;">\n`;
              htmlContent += `<div style="width:${val}%;height:6px;background:${barColor};border-radius:3px;"></div>\n`;
              htmlContent += `</div>\n`;
              htmlContent += `<span style="font-size:10px;font-weight:600;color:#374151;min-width:28px;text-align:right;">${val}</span>\n`;
              htmlContent += `</div>\n`;
            });
            htmlContent += '</div>\n</div>\n';
          }

          // ── ITEM 3: Audience Fit ──
          if (htmlAf) {
            const fitColor = (f: string) => f === 'High' ? '#15803d' : f === 'Medium' ? '#92400e' : '#9ca3af';
            const fitBg = (f: string) => f === 'High' ? '#f0fdf4' : f === 'Medium' ? '#fefce8' : '#f9fafb';
            htmlContent += '<div style="margin-top:10px;">\n';
            htmlContent += '<div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Audience Fit</div>\n';
            htmlContent += '<div style="display:flex;gap:6px;flex-wrap:wrap;">\n';
            [
              ['SMB Owners', htmlAf.smbOwners],
              ['Corporate Exec', htmlAf.corporateExecutives],
              ['Traditional Industries', htmlAf.traditionalIndustries],
              ['High-Pressure Sales', htmlAf.highPressureSales],
            ].forEach(([label, fit]) => {
              htmlContent += `<span style="background:${fitBg(fit as string)};color:${fitColor(fit as string)};border:1px solid currentColor;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:600;">${label}: ${fit}</span>\n`;
            });
            htmlContent += '</div>\n</div>\n';
          }

          // ── ITEM 4: Risk Factors ──
          if (htmlRisks.length > 0) {
            htmlContent += '<div style="margin-top:10px;padding:8px 12px;background:#fef2f2;border-left:3px solid #fca5a5;border-radius:4px;">\n';
            htmlContent += '<p style="margin:0 0 4px 0;font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;">Risk Factors</p>\n';
            htmlContent += '<ul style="margin:0;padding:0;list-style:none;">\n';
            htmlRisks.forEach(r => {
              const er = String(r).replace(/</g, '&lt;').replace(/>/g, '&gt;');
              htmlContent += `<li style="font-size:11px;color:#7f1d1d;line-height:1.5;margin-bottom:2px;">• ${er}</li>\n`;
            });
            htmlContent += '</ul>\n</div>\n';
          }

          htmlContent += '</div>\n';
        });

        htmlContent += '</div>\n';
        htmlContent += '<p style="font-size:12px;color:#9ca3af;margin-top:12px;font-style:italic;">\n';
        htmlContent += '  &#9432; Scores are relative across versions compared in this session. Adding new versions may slightly adjust scores. Focus on the ranking order and percentage improvement vs. the original.\n';
        htmlContent += '</p>\n';

        // Deep analysis for the winner only
        const winnerRow = comparisonResult.rows.find(r => r.isWinner);
        const winnerCard = winnerRow ? generatedOutputCards.find(c => c.id === winnerRow.versionId) : null;

        if (versionDeepAnalysis && winnerCard) {
          const winnerAnalysis = versionDeepAnalysis[winnerCard.id];
          if (winnerAnalysis) {
            const winnerLabel = stripEmoji(winnerRow?.optionLabel || winnerCard.sourceDisplayName || 'Winner');
            htmlContent += `<h3 style="font-size: 18px; font-weight: 700; color: #111827; margin: 40px 0 16px 0;">Best Performing Version — ${winnerLabel}</h3>\n`;

            if (winnerAnalysis.keyStrengths && winnerAnalysis.keyStrengths.length > 0) {
              htmlContent += '<p style="font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.06em;">Key Strengths</p>\n';
              htmlContent += '<ul style="margin: 0 0 24px 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.7;">\n';
              winnerAnalysis.keyStrengths.forEach((s: string) => {
                htmlContent += `<li style="margin-bottom: 6px;">${s}</li>\n`;
              });
              htmlContent += '</ul>\n';
            }

            if (winnerAnalysis.suggestedImprovements && winnerAnalysis.suggestedImprovements.length > 0) {
              const winnerDeltaTotal = winnerAnalysis.suggestedImprovements
                .filter((item: any) => typeof item === 'object' && item.points_delta > 0)
                .reduce((sum: number, item: any) => sum + item.points_delta, 0);

              htmlContent += '<p style="font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.06em;">Suggested Improvements</p>\n';
              htmlContent += '<ul style="margin: 0 0 8px 0; padding-left: 0; list-style: none;">\n';
              winnerAnalysis.suggestedImprovements.forEach((item: any) => {
                const isObj = typeof item === 'object';
                const text = isObj ? item.text : item;
                const delta = isObj ? item.points_delta : null;
                const escapedText = String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
                if (delta && delta > 0) {
                  htmlContent += `<li style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;"><span>${escapedText}</span><span style="background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;white-space:nowrap;">+${delta} pts</span></li>\n`;
                } else {
                  htmlContent += `<li style="margin-bottom: 6px;">${escapedText}</li>\n`;
                }
              });
              htmlContent += '</ul>\n';
              if (winnerDeltaTotal > 0 && winnerRow) {
                const winnerProjScore = Math.min(92, winnerRow.finalScore + winnerDeltaTotal);
                htmlContent += `<p style="font-size:13px;color:#6b7280;margin-top:8px;margin-bottom:24px;">Apply all suggestions &rarr; estimated score: ${winnerProjScore}/100</p>\n`;
              } else {
                htmlContent += '<div style="margin-bottom:24px;"></div>\n';
              }
            }

            if (winnerAnalysis.summary) {
              htmlContent += `<p style="font-size: 15px; color: #374151; line-height: 1.7; margin: 0 0 24px 0; padding: 16px 20px; background: #f9fafb; border-left: 1px solid #e5e7eb;">${winnerAnalysis.summary}</p>\n`;
            }
          }
        }

        // Fallback: if we have a comparisonDeepAnalysisMeta winner explanation
        if (comparisonDeepAnalysisMeta?.winnerExplanation && !versionDeepAnalysis) {
          htmlContent += '<h3 style="font-size: 18px; font-weight: 700; color: #111827; margin: 32px 0 16px 0;">Why This Version Won</h3>\n';
          htmlContent += `<p style="font-size: 15px; color: #374151; line-height: 1.7; margin: 0 0 24px 0;">${comparisonDeepAnalysisMeta.winnerExplanation}</p>\n`;
        }

      } else if (comparisonCards.length > 0) {
        // No structured comparison result — render raw comparison card content
        const allComparisonContents = comparisonCards
          .filter(c => typeof c.content === 'string')
          .map(c => typeof c.content === 'string' ? c.content : '')
          .filter(content => content.trim() !== '');

        if (allComparisonContents.length > 0) {
          const mainContent = allComparisonContents[0];
          const otherContents = allComparisonContents.slice(1);
          htmlContent += generateComparisonHtml(mainContent, generatedOutputCards, otherContents);
        }
      }

      htmlContent += '</section>\n\n';
    }

    // BOTTOM CTA BLOCK
    const generatedCount = contentCards.length;
    if (generatedCount > 0) {
      htmlContent += '<div style="text-align: center; padding: 32px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 56px;">\n';
      htmlContent += '<p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #111827;">Want more high-performing variations?</p>\n';
      htmlContent += `<p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">You've generated ${generatedCount} version${generatedCount !== 1 ? 's' : ''} — save 3–4 before choosing a winner.</p>\n`;
      htmlContent += '<a href="#top" style="display: inline-block; padding: 10px 20px; background: #111827; color: #ffffff; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">&#8593; Back to top</a>\n';
      htmlContent += '</div>\n\n';
    }

    // FOOTER
    htmlContent += `<footer style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; padding-bottom: 56px;">
  Generated by CopyZap &mdash; ${formatExportTimestamp()}
</footer>\n`;

    // FIXED BREADCRUMB NAV (no-print)
    htmlContent += '<nav class="breadcrumb-nav no-print">\n';
    htmlContent += '<span class="bc-label">Jump to:</span>\n';
    htmlContent += '<a href="#input-summary" style="max-width:90px;">Inputs</a>\n';
    contentCards.forEach((card, idx) => {
      const label = stripEmoji(card.sourceDisplayName || card.type || `v${idx + 1}`);
      htmlContent += '<span class="bc-sep">/</span>\n';
      htmlContent += `<a href="#output-${card.id}">${label}</a>\n`;
    });
    if (comparisonResult) {
      htmlContent += '<span class="bc-sep">/</span>\n';
      htmlContent += '<a href="#comparison-rankings" style="max-width:100px;">Rankings</a>\n';
    }
    htmlContent += '</nav>\n';

    htmlContent += '</body>\n</html>';

    // Generate filename — must include Project Description and date/time stamp
    const rawDesc = formState.projectDescription?.trim()
      || formState.briefDescription?.trim()
      || 'copy-output';
    const sanitizedDesc = rawDesc
      .substring(0, 50)
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

    const filename = `${sanitizedDesc}_${dateTime}.html`;

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting as HTML:', error);
    throw error;
  }
};

/**
 * Extract pure copy content by removing all scoring, analysis, and UI noise.
 * This is applied after normalization to ensure completely clean copy blocks.
 *
 * @param raw - Normalized content (HTML or text)
 * @returns Clean copy with all analysis removed
 */
function extractPureCopy(raw: string): string {
  if (!raw) return '';

  let cleaned = raw;

  // Remove markdown section headers used for analysis
  cleaned = cleaned.replace(/####\s*Sub-Scores[\s\S]*?(?=####|<\/|$)/gi, '');
  cleaned = cleaned.replace(/####\s*Key Strengths[\s\S]*?(?=####|<\/|$)/gi, '');
  cleaned = cleaned.replace(/####\s*Suggested Improvements[\s\S]*?(?=####|<\/|$)/gi, '');
  cleaned = cleaned.replace(/####\s*Analysis[\s\S]*?(?=####|<\/|$)/gi, '');
  cleaned = cleaned.replace(/####\s*Quality Metrics[\s\S]*?(?=####|<\/|$)/gi, '');

  // Remove scoring lines (bold format)
  cleaned = cleaned.replace(/\*\*Overall Score:\*\*.*$/gim, '');
  cleaned = cleaned.replace(/\*\*Conversion:\*\*.*$/gim, '');
  cleaned = cleaned.replace(/\*\*Trust:\*\*.*$/gim, '');
  cleaned = cleaned.replace(/\*\*Risk:\*\*.*$/gim, '');
  cleaned = cleaned.replace(/\*\*Clarity:\*\*.*$/gim, '');
  cleaned = cleaned.replace(/\*\*Persuasiveness:\*\*.*$/gim, '');
  cleaned = cleaned.replace(/\*\*Tone Match:\*\*.*$/gim, '');
  cleaned = cleaned.replace(/\*\*Engagement:\*\*.*$/gim, '');
  cleaned = cleaned.replace(/\*\*Score:\*\*.*$/gim, '');

  // Remove bullet point analysis
  cleaned = cleaned.replace(/^\*\s*Conversion:.*$/gim, '');
  cleaned = cleaned.replace(/^\*\s*Trust:.*$/gim, '');
  cleaned = cleaned.replace(/^\*\s*Risk:.*$/gim, '');
  cleaned = cleaned.replace(/^\*\s*Clarity:.*$/gim, '');
  cleaned = cleaned.replace(/^\*\s*Persuasiveness:.*$/gim, '');

  // Remove common UI labels that might remain
  cleaned = cleaned.replace(/\*\*(Hero|Introducción|Introduction|About|Call to Action|CTA|Legal|Footer|Header|Subheading|Body|Title|Subtitle)\*\*:?\s*/gi, '');

  // Remove score badges and labels
  cleaned = cleaned.replace(/\[Score:\s*\d+\/\d+\]/gi, '');
  cleaned = cleaned.replace(/Score:\s*\d+\/\d+/gi, '');

  // Remove HTML comments that might contain metadata
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove data attributes from HTML that might leak scoring info
  cleaned = cleaned.replace(/data-score="[^"]*"/gi, '');
  cleaned = cleaned.replace(/data-analysis="[^"]*"/gi, '');

  // Normalize excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  return cleaned.trim();
}

/**
 * Final cleaning pass to remove HTML tags and legal/cookie noise.
 * This produces pure plain text suitable for LLM evaluation.
 *
 * @param text - Content after extractPureCopy()
 * @returns Pure plain text without HTML or legal noise
 */
function finalCleanForLLM(text: string): string {
  if (!text) return '';

  return text
    // Remove HTML tags completely
    .replace(/<[^>]*>/g, '')

    // Remove UI structural labels
    .replace(/\b(Hero|Introducción|Introduction|About|Call to Action|CTA|Legal|Footer|Header)\b:?/gi, '')

    // Remove cookie/legal noise
    .replace(/política de cookies.*$/gim, '')
    .replace(/utilizamos cookies.*$/gim, '')
    .replace(/aceptar.*$/gim, '')
    .replace(/we use cookies.*$/gim, '')
    .replace(/cookie policy.*$/gim, '')
    .replace(/accept.*cookies.*$/gim, '')

    // Remove extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Export as LLM Evaluation Markdown - Clean, bias-free format for external LLM evaluation
 *
 * This export creates a markdown file optimized for unbiased evaluation by external LLMs.
 * It includes ONLY normalized copy content inside <START_COPY> and <END_COPY> markers,
 * with all scores, rankings, and analysis moved to an IGNORE section at the bottom.
 */
export const exportLLMEvaluationMarkdown = (
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  originalInputScore?: any,
  promptEvaluation?: PromptEvaluation,
  comparisonResult?: ComparisonResult,
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>,
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta
): void => {
  try {
    let markdown = '';

    // WARNING HEADER
    markdown += `# LLM EVALUATION FILE\n\n`;
    markdown += `⚠️ **IMPORTANT:**\n`;
    markdown += `- Only evaluate content inside \`<START_COPY>\` and \`<END_COPY>\`\n`;
    markdown += `- Ignore EVERYTHING else\n`;
    markdown += `- Do NOT use any scores, rankings, or analysis\n`;
    markdown += `- Treat this as a blind evaluation\n\n`;
    markdown += `**If you read outside \`<START_COPY>\` blocks, your evaluation will be incorrect.**\n\n`;
    markdown += `---\n\n`;

    // CONTEXT SECTION
    markdown += `## CONTEXT\n\n`;

    if (formState.language) {
      markdown += `**Language:** ${formState.language}\n\n`;
    }

    if (formState.tone) {
      markdown += `**Tone:** ${formState.tone}\n\n`;
    }

    if (formState.targetAudience) {
      markdown += `**Audience:** ${formState.targetAudience}\n\n`;
    }

    if (formState.copyGoal) {
      markdown += `**Goal:** ${formState.copyGoal}\n\n`;
    }

    if (formState.projectDescription) {
      markdown += `**Project:** ${formState.projectDescription}\n\n`;
    }

    markdown += `---\n\n`;

    // COPY VERSIONS SECTION
    markdown += `## COPY VERSIONS\n\n`;
    markdown += `Below are the different versions of copy to evaluate. Each version is wrapped in \`<START_COPY>\` and \`<END_COPY>\` markers.\n\n`;
    markdown += `---\n\n`;

    // ORIGINAL COPY (if in improve mode)
    if (formState.tab === 'improve' && formState.originalCopy) {
      markdown += `### [Original Copy]\n\n`;
      markdown += `<START_COPY>\n\n`;
      const normalizedOriginal = normalizeCopyForLLMExport(formState.originalCopy);
      const cleanOriginal = extractPureCopy(normalizedOriginal);
      const finalOriginal = finalCleanForLLM(cleanOriginal);
      markdown += finalOriginal + '\n\n';
      markdown += `<END_COPY>\n\n`;
      markdown += `---\n\n`;
    }

    // GENERATED VERSIONS
    generatedOutputCards.forEach((item, index) => {
      // Get version label
      let versionLabel = item.sourceDisplayName || item.type || `Version ${index + 1}`;
      if (item.persona) {
        versionLabel += ` (${item.persona}'s Voice)`;
      }

      markdown += `### [${versionLabel}]\n\n`;
      markdown += `<START_COPY>\n\n`;

      // Get actual content
      let actualContent = item.content;

      // Handle nested content structure
      if (typeof item.content === 'object' && item.content !== null && 'content' in item.content) {
        actualContent = (item.content as any).content;
      }

      // Three-stage cleaning: Normalize → Extract Pure Copy → Final Clean
      const normalizedContent = normalizeCopyForLLMExport(actualContent);
      const cleanContent = extractPureCopy(normalizedContent);
      const finalContent = finalCleanForLLM(cleanContent);
      markdown += finalContent + '\n\n';

      markdown += `<END_COPY>\n\n`;
      markdown += `---\n\n`;
    });

    // SYSTEM DATA SECTION (IGNORE)
    markdown += `\n\n`;
    markdown += `## ⚠️ SYSTEM DATA (IGNORE THIS SECTION)\n\n`;
    markdown += `The content below is internal system data.\n`;
    markdown += `It may contain scores, rankings, and analysis.\n\n`;
    markdown += `**DO NOT USE THIS FOR EVALUATION.**\n\n`;
    markdown += `---\n\n`;
    markdown += `### Internal Metadata\n\n`;
    markdown += `- Export Date: ${formatExportTimestamp()}\n`;
    markdown += `- Mode: ${formState.tab}\n`;
    markdown += `- Total Versions: ${generatedOutputCards.length}\n`;

    if (comparisonResult) {
      markdown += `- Comparison Data: Available (ignored)\n`;
    }

    if (versionDeepAnalysis && Object.keys(versionDeepAnalysis).length > 0) {
      markdown += `- Deep Analysis: Available (ignored)\n`;
    }

    markdown += `\n---\n\n`;

    // Optionally include full markdown export for reference (with all scoring/analysis intact)
    try {
      const fullMarkdown = formatAsEnhancedMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta
      );

      if (fullMarkdown && fullMarkdown.trim()) {
        markdown += `### Full Export (Reference Only)\n\n`;
        markdown += `<details>\n`;
        markdown += `<summary>Click to expand complete data export</summary>\n\n`;
        markdown += `\`\`\`\n`;
        markdown += fullMarkdown;
        markdown += `\n\`\`\`\n\n`;
        markdown += `</details>\n\n`;
      }
    } catch (e) {
      // Silently fail if full export generation fails
      console.warn('Could not generate full markdown export for reference:', e);
    }

    markdown += `---\n\n`;
    markdown += `*End of file*\n`;

    // Create filename
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

    // Sanitize project description for filename
    const projectDesc = formState.projectDescription
      ? formState.projectDescription
          .trim()
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 50) // Limit length
      : 'untitled';

    const filename = `llm-EVAL_${projectDesc}_${dateTime}.md`;

    // Create and download the file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting LLM evaluation markdown:', error);
    throw error;
  }
};

/**
 * Validates that evaluation data is complete enough for audit export.
 * Returns true only if all required fields are present and usable.
 *
 * @param comparisonResult - Comparison result data
 * @param versionDeepAnalysis - Deep analysis for each version
 * @param generatedOutputCards - Generated versions
 * @returns Object with isComplete flag and details about missing fields
 */
function hasCompleteEvaluationData(
  comparisonResult?: ComparisonResult,
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>,
  generatedOutputCards?: GeneratedContentItem[]
): { isComplete: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  // Check if comparison result exists
  if (!comparisonResult) {
    missingFields.push('comparisonResult (entire object is missing)');
    return { isComplete: false, missingFields };
  }

  // Support both old and new formats
  // New format: winnerVersionId, rows[], winnerExplanation
  // Old format: winner, ranking[], scores{}, shortWhyWinner/whyWinner

  // Check winner (new: winnerVersionId, old: winner)
  const winnerId = (comparisonResult as any).winnerVersionId || comparisonResult.winner;
  if (!winnerId || winnerId.trim() === '') {
    missingFields.push('winner');
  }

  // Check ranking/rows (new: rows[], old: ranking[])
  const rankingData = (comparisonResult as any).rows || comparisonResult.ranking;
  if (!rankingData || !Array.isArray(rankingData) || rankingData.length < 2) {
    missingFields.push('ranking (must have at least 2 versions)');
  }

  // Check scores (new: embedded in rows, old: separate scores object)
  const hasScores = (comparisonResult as any).rows?.length > 0 ||
                    (comparisonResult.scores && Object.keys(comparisonResult.scores).length > 0);
  if (!hasScores) {
    missingFields.push('scores (no versions scored)');
  }

  // Check summary/explanation (new: winnerExplanation, old: shortWhyWinner/whyWinner)
  const hasSummary = ((comparisonResult as any).winnerExplanation && (comparisonResult as any).winnerExplanation.trim() !== '') ||
                     (comparisonResult.shortWhyWinner && comparisonResult.shortWhyWinner.trim() !== '') ||
                     (comparisonResult.whyWinner && comparisonResult.whyWinner.trim() !== '');
  if (!hasSummary) {
    missingFields.push('summary (winnerExplanation, shortWhyWinner or whyWinner)');
  }

  // Check deep analysis for winner
  if (winnerId && versionDeepAnalysis) {
    const winnerAnalysis = versionDeepAnalysis[winnerId];
    if (!winnerAnalysis) {
      missingFields.push('deep analysis for winner');
    } else {
      // Check keyStrengths (the actual field name in VersionDeepAnalysis)
      if (!winnerAnalysis.keyStrengths || !Array.isArray(winnerAnalysis.keyStrengths) || winnerAnalysis.keyStrengths.length === 0) {
        missingFields.push('keyStrengths (must have at least 1)');
      }
      // Check suggestedImprovements (the actual field name in VersionDeepAnalysis)
      if (!winnerAnalysis.suggestedImprovements || !Array.isArray(winnerAnalysis.suggestedImprovements) || winnerAnalysis.suggestedImprovements.length === 0) {
        missingFields.push('suggestedImprovements (must have at least 1)');
      }
    }
  } else {
    missingFields.push('versionDeepAnalysis (required for winner analysis)');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}

/**
 * Export as LLM Evaluation Audit - Blind comparison format
 *
 * This format is designed for external LLMs to:
 * 1. First independently evaluate copy versions (Section A - blind)
 * 2. Then compare their judgment against the app's evaluation (Section B)
 * 3. Provide critical analysis of the app's scoring system
 *
 * IMPORTANT: This export will ONLY succeed if evaluation data is complete.
 * If data is incomplete, it throws an error with details about missing fields.
 *
 * @param formState - Form state with input data
 * @param generatedOutputCards - All generated versions
 * @param originalInputScore - Original copy score (if in improve mode)
 * @param promptEvaluation - Prompt evaluation data (not used in audit)
 * @param comparisonResult - Comparison result with winner/ranking/scores
 * @param versionDeepAnalysis - Deep analysis for each version
 * @param comparisonDeepAnalysisMeta - Metadata for deep analysis
 * @throws Error if evaluation data is incomplete
 */
export const exportLLMEvaluationAudit = (
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  originalInputScore?: any,
  promptEvaluation?: PromptEvaluation,
  comparisonResult?: ComparisonResult,
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>,
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta
): void => {
  try {
    // STEP 1: VALIDATE EVALUATION COMPLETENESS
    const validation = hasCompleteEvaluationData(
      comparisonResult,
      versionDeepAnalysis,
      generatedOutputCards
    );

    if (!validation.isComplete) {
      // Log detailed information about missing fields for debugging
      console.warn('LLM audit export blocked: incomplete evaluation data', {
        missingFields: validation.missingFields,
        hasComparisonResult: !!comparisonResult,
        hasVersionDeepAnalysis: !!versionDeepAnalysis,
        winner: (comparisonResult as any)?.winnerVersionId || comparisonResult?.winner || null,
        rankingLength: (comparisonResult as any)?.rows?.length || comparisonResult?.ranking?.length || 0,
        scoresCount: (comparisonResult as any)?.rows?.length ||
                     (comparisonResult?.scores ? Object.keys(comparisonResult.scores).length : 0),
        generatedVersionsCount: generatedOutputCards.length
      });

      // Create user-friendly error message
      const errorMessage = `Comparison audit export is only available after scoring and ranking data has been fully generated.\n\nMissing: ${validation.missingFields.join(', ')}\n\nPlease run Compare/Re-score first to generate complete evaluation data.`;

      throw new Error(errorMessage);
    }

    // STEP 2: PROCEED WITH EXPORT (data is complete)
    let markdown = '';

    // FILE HEADER
    markdown += `# LLM Evaluation Audit File\n\n`;
    markdown += `**Generated:** ${formatExportTimestamp()}\n\n`;
    markdown += `---\n\n`;

    // INSTRUCTIONS
    markdown += `## INSTRUCTIONS FOR LLM\n\n`;
    markdown += `You will receive:\n\n`;
    markdown += `- **SECTION A** → Copy versions (neutral, blind input)\n`;
    markdown += `- **SECTION B** → App evaluation (biased system output)\n\n`;
    markdown += `**IMPORTANT:**\n\n`;
    markdown += `1. First, independently evaluate ONLY SECTION A\n`;
    markdown += `2. Then compare your evaluation with SECTION B\n`;
    markdown += `3. Do NOT assume the app is correct\n`;
    markdown += `4. Be critical and analytical\n\n`;
    markdown += `---\n\n`;

    // SECTION A - COPY VERSIONS (BLIND INPUT)
    markdown += `## SECTION A — COPY VERSIONS (BLIND INPUT)\n\n`;
    markdown += `**IMPORTANT:**\n`;
    markdown += `- Evaluate ONLY content between \`<START_COPY>\` and \`<END_COPY>\`\n`;
    markdown += `- Ignore formatting inconsistencies\n`;
    markdown += `- Ignore minor boilerplate (cookies, navigation, etc.)\n\n`;
    markdown += `---\n\n`;

    // ORIGINAL COPY (if in improve mode)
    if (formState.tab === 'improve' && formState.originalCopy) {
      markdown += `### [Original Copy]\n\n`;
      markdown += `<START_COPY>\n\n`;
      const normalizedOriginal = normalizeCopyForLLMExport(formState.originalCopy);
      const cleanOriginal = extractPureCopy(normalizedOriginal);
      const finalOriginal = finalCleanForLLM(cleanOriginal);
      markdown += finalOriginal + '\n\n';
      markdown += `<END_COPY>\n\n`;
      markdown += `---\n\n`;
    }

    // GENERATED VERSIONS
    generatedOutputCards.forEach((item, index) => {
      let versionLabel = item.sourceDisplayName || item.type || `Version ${index + 1}`;
      if (item.persona) {
        versionLabel += ` (${item.persona}'s Voice)`;
      }

      markdown += `### [${versionLabel}]\n\n`;
      markdown += `<START_COPY>\n\n`;

      let actualContent = item.content;
      if (typeof item.content === 'object' && item.content !== null && 'content' in item.content) {
        actualContent = (item.content as any).content;
      }

      const normalizedContent = normalizeCopyForLLMExport(actualContent);
      const cleanContent = extractPureCopy(normalizedContent);
      const finalContent = finalCleanForLLM(cleanContent);
      markdown += finalContent + '\n\n';

      markdown += `<END_COPY>\n\n`;
      markdown += `---\n\n`;
    });

    // SECTION B - APP EVALUATION
    markdown += `## SECTION B — APP EVALUATION (FOR COMPARISON ONLY)\n\n`;
    markdown += `**IMPORTANT:**\n`;
    markdown += `- Do NOT read this before completing your own evaluation\n`;
    markdown += `- This section represents the app's judgment\n\n`;
    markdown += `---\n\n`;

    // Extract winner and ranking data
    let winnerLabel = 'Unknown';
    let rankingList: string[] = [];
    let scoresList: { label: string; score: number }[] = [];
    let shortWhyWinner = '';
    let winnerId = '';

    if (comparisonResult) {
      // Support both old and new formats
      // New format: winnerVersionId, rows[], winnerExplanation
      // Old format: winner, ranking[], scores{}, shortWhyWinner/whyWinner

      winnerId = (comparisonResult as any).winnerVersionId || comparisonResult.winner || '';

      // Get winner label
      if (winnerId) {
        const winnerVersion = generatedOutputCards.find(item =>
          item.id === winnerId ||
          item.sourceDisplayName === winnerId ||
          item.type === winnerId
        );
        if (winnerVersion) {
          winnerLabel = winnerVersion.sourceDisplayName || winnerVersion.type || 'Winner';
          if (winnerVersion.persona) {
            winnerLabel += ` (${winnerVersion.persona}'s Voice)`;
          }
        } else if (winnerId === '__original__') {
          winnerLabel = 'Original Copy';
        } else {
          winnerLabel = winnerId || 'Unknown';
        }
      }

      // Get ranking - support both formats
      const rows = (comparisonResult as any).rows;
      if (rows && Array.isArray(rows)) {
        // New format: rows array with versionId, label, score, rank
        rankingList = rows
          .sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0))
          .map((row: any) => {
            const rank = row.rank || 0;
            const label = row.label || row.optionLabel || `Version ${rank}`;
            return `${rank}. ${label}`;
          });

        // Get scores from rows
        scoresList = rows.map((row: any) => ({
          label: row.label || row.optionLabel || 'Unknown',
          score: row.score || row.finalScore || 0
        }));
      } else if (comparisonResult.ranking && Array.isArray(comparisonResult.ranking)) {
        // Old format: ranking array
        rankingList = comparisonResult.ranking.map((item: any, idx: number) => {
          const rank = idx + 1;
          const versionName = typeof item === 'string' ? item : item?.version || item?.label || `Version ${idx + 1}`;
          const versionData = generatedOutputCards.find(v =>
            v.sourceDisplayName === versionName || v.type === versionName
          );
          let displayName = versionName;
          if (versionData?.persona) {
            displayName += ` (${versionData.persona}'s Voice)`;
          }
          return `${rank}. ${displayName}`;
        });

        // Get scores from old format
        if (comparisonResult.scores && typeof comparisonResult.scores === 'object') {
          scoresList = Object.entries(comparisonResult.scores).map(([key, value]) => {
            const versionData = generatedOutputCards.find(v =>
              v.sourceDisplayName === key || v.type === key
            );
            let displayName = key;
            if (versionData?.persona) {
              displayName += ` (${versionData.persona}'s Voice)`;
            }
            return {
              label: displayName,
              score: typeof value === 'number' ? value : 0
            };
          });
        }
      }

      // Get explanation - support both formats
      shortWhyWinner = (comparisonResult as any).winnerExplanation ||
                       comparisonResult.shortWhyWinner ||
                       comparisonResult.whyWinner ||
                       '';
    }

    // Winner
    markdown += `### WINNER\n\n`;
    markdown += `${winnerLabel}\n\n`;

    // Ranking
    markdown += `### RANKING\n\n`;
    if (rankingList.length > 0) {
      rankingList.forEach(rank => {
        markdown += `${rank}\n`;
      });
    } else {
      markdown += `No ranking available\n`;
    }
    markdown += `\n`;

    // Scores — dual score system: Editorial Quality + Conversion Potential
    markdown += `### SCORES\n\n`;
    if (scoresList.length > 0) {
      // Build content text map for computing dual scores
      const contentMap: Record<string, string> = {};
      const absScoreMap: Record<string, any> = {};
      generatedOutputCards.forEach(item => {
        let ct = '';
        const actualContent = (typeof item.content === 'object' && item.content !== null && 'content' in item.content)
          ? (item.content as any).content
          : item.content;
        if (typeof actualContent === 'string') ct = actualContent;
        else if (Array.isArray(actualContent)) ct = actualContent.join('\n');
        else if (typeof actualContent === 'object' && actualContent !== null) ct = JSON.stringify(actualContent);
        const key = item.sourceDisplayName || item.type || '';
        if (key) contentMap[key] = ct;
        if (item.id) contentMap[item.id] = ct;
        if (item.absoluteScore && item.absoluteScore.total > 0) {
          if (key) absScoreMap[key] = item.absoluteScore;
          if (item.id) absScoreMap[item.id] = item.absoluteScore;
        }
      });

      scoresList.forEach(({ label, score }) => {
        markdown += `- **${label}**: ${score}/100\n`;
      });
      markdown += `\n`;

      // Per-version dual scores + extended fields
      const rows = (comparisonResult as any).rows;
      if (rows && Array.isArray(rows)) {
        markdown += `### PER-VERSION ANALYSIS\n\n`;
        rows.sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0)).forEach((row: any) => {
          const label = row.label || row.optionLabel || 'Unknown';
          const ct = contentMap[row.versionId] || contentMap[label] || '';
          const rowScore = row.finalScore ?? 0;
          const editorialQ = ct ? computeEditorialQuality(ct) : rowScore;
          const convPotential = ct ? computeConversionPotential(ct) : rowScore;
          const wcrl = ct ? computeWordCountAndReadingLevel(ct) : null;
          const confidence = ct ? computeEvaluationConfidence(ct) : { confidence: 'Medium' as const };
          const strategy = ct ? computeConversionStrategy(ct) : 'ROI Framing' as const;
          const intensity = ct ? computeCommercialIntensity(ct) : 'Medium' as const;
          const driver = ct ? computeMostLikelyConversionDriver(ct) : 'Relevance to reader context.';
          const af = ct ? computeAudienceFit(ct, true) : null;
          const risks = ct ? computeRiskFactors(ct, row.verificationFlags) : [];
          const pb = ct ? computePersuasionBreakdown(ct) : null;

          markdown += `#### ${label}${row.isWinner ? ' (WINNER)' : ''}\n\n`;

          // Verification flags at top
          if (row.verificationFlags && row.verificationFlags.length > 0) {
            markdown += `⚠️ **Verify before publishing:**\n`;
            row.verificationFlags.forEach((flag: string) => {
              markdown += `- "${flag}" — source unknown\n`;
            });
            markdown += `\n`;
          }

          markdown += `**Editorial Quality:** ${editorialQ}/100\n`;
          markdown += `**Conversion Potential:** ${convPotential}/100\n`;
          if (wcrl) {
            markdown += `**Word Count:** ${wcrl.wordCount} words\n`;
            markdown += `**Reading Level:** ${wcrl.readingLevel}\n`;
          }
          markdown += `\n`;

          // Persuasion breakdown
          if (pb) {
            markdown += `**Persuasion Breakdown:**\n`;
            markdown += `- Emotional Impact: ${pb.emotionalImpact}/100\n`;
            markdown += `- Clarity: ${pb.clarity}/100\n`;
            markdown += `- Trust: ${pb.trust}/100\n`;
            markdown += `- Specificity: ${pb.specificity}/100\n`;
            markdown += `- Urgency: ${pb.urgency}/100\n`;
            markdown += `- Professionalism: ${pb.professionalism}/100\n`;
            markdown += `- Readability: ${pb.readability}/100\n`;
            markdown += `- CTA Strength: ${pb.ctaStrength}/100\n`;
            markdown += `- Audience Fit: ${pb.audienceFit}/100\n`;
            markdown += `- Differentiation: ${pb.differentiation}/100\n\n`;
          }

          // Audience Fit
          if (af) {
            markdown += `**Audience Fit:**\n`;
            markdown += `- SMB Owners: ${af.smbOwners}${af.smbReason ? ` — ${af.smbReason}` : ''}\n`;
            markdown += `- Corporate Executives: ${af.corporateExecutives}${af.corporateReason ? ` — ${af.corporateReason}` : ''}\n`;
            markdown += `- Traditional Industries: ${af.traditionalIndustries}${af.traditionalReason ? ` — ${af.traditionalReason}` : ''}\n`;
            markdown += `- High-pressure sales teams: ${af.highPressureSales}${af.highPressureReason ? ` — ${af.highPressureReason}` : ''}\n\n`;
          }

          // Risk Factors
          if (risks.length > 0) {
            markdown += `**Risk Factors:**\n`;
            risks.forEach(r => { markdown += `- ${r}\n`; });
            markdown += `\n`;
          }

          // Absolute Score removed — shown in rankings table only

          // .md-only fields (items 9-12)
          markdown += `**Evaluation Confidence:** ${confidence.confidence}${confidence.reason ? ` — ${confidence.reason}` : ''}\n`;
          markdown += `**Primary Conversion Strategy:** ${strategy}\n`;
          markdown += `**Commercial Intensity:** ${intensity}\n`;
          markdown += `**Most Likely Conversion Driver:** ${driver}\n\n`;
        });
      }
    } else {
      markdown += `No scores available\n\n`;
    }

    // Summary
    markdown += `### SUMMARY\n\n`;
    markdown += shortWhyWinner || 'No summary available';
    markdown += `\n\n`;

    // Winner Type classification
    const auditRows = (comparisonResult as any).rows;
    if (auditRows && auditRows.length >= 2) {
      const sortedAuditRows = [...auditRows].sort((a: any, b: any) => (b.finalScore || 0) - (a.finalScore || 0));
      const wt = classifyWinnerType(sortedAuditRows[0].finalScore || 0, sortedAuditRows[1].finalScore || 0);
      markdown += `### WINNER TYPE\n\n`;
      markdown += `**${wt.type}** — ${wt.reason}\n\n`;
    }

    // Strengths and Improvements (from deep analysis)
    markdown += `### STRENGTHS\n\n`;
    if (versionDeepAnalysis && winnerId) {
      const winnerAnalysis = versionDeepAnalysis[winnerId];
      if (winnerAnalysis?.keyStrengths && Array.isArray(winnerAnalysis.keyStrengths) && winnerAnalysis.keyStrengths.length > 0) {
        winnerAnalysis.keyStrengths.forEach((strength: string) => { markdown += `- ${strength}\n`; });
      } else {
        markdown += `No strengths data available\n`;
      }
    } else {
      markdown += `No strengths data available\n`;
    }
    markdown += `\n`;

    markdown += `### SUGGESTED IMPROVEMENTS\n\n`;
    if (versionDeepAnalysis && winnerId) {
      const winnerAnalysis = versionDeepAnalysis[winnerId];
      if (winnerAnalysis?.suggestedImprovements && Array.isArray(winnerAnalysis.suggestedImprovements) && winnerAnalysis.suggestedImprovements.length > 0) {
        winnerAnalysis.suggestedImprovements.forEach((improvement: any) => {
          const text = typeof improvement === 'object' && improvement !== null ? improvement.text : improvement;
          if (text) markdown += `- ${text}\n`;
        });
      } else {
        markdown += `No improvements data available\n`;
      }
    } else {
      markdown += `No improvements data available\n`;
    }
    markdown += `\n`;

    markdown += `---\n\n`;

    // SECTION C - TASK
    markdown += `## SECTION C — TASK\n\n`;
    markdown += `Perform the following:\n\n`;
    markdown += `**1. Rank all versions (best → worst)**\n\n`;
    markdown += `**2. Choose a winner**\n\n`;
    markdown += `**3. Score each version on TWO separate dimensions:**\n`;
    markdown += `   - Editorial Quality (0–100): how well-written, clear, and professional\n`;
    markdown += `   - Conversion Potential (0–100): how likely to make the reader take action\n`;
    markdown += `   - Do NOT combine them into a single score\n\n`;
    markdown += `**4. Score each version on the 10 Persuasion Sub-Dimensions:**\n`;
    markdown += `   - Emotional Impact / Clarity / Trust / Specificity / Urgency\n`;
    markdown += `   - Professionalism / Readability / CTA Strength / Audience Fit / Differentiation\n\n`;
    markdown += `**5. Classify winner:**\n`;
    markdown += `   - Clear Winner (≥10 pt gap over next best)\n`;
    markdown += `   - Moderate Winner (5–9 pt gap)\n`;
    markdown += `   - Close Call (<5 pt gap)\n\n`;
    markdown += `**6. Compare with SECTION B:**\n`;
    markdown += `   - Where do you AGREE?\n`;
    markdown += `   - Where do you DISAGREE?\n\n`;
    markdown += `**7. For each disagreement:**\n`;
    markdown += `   - Explain why\n`;
    markdown += `   - State who is more correct (you or the app)\n\n`;
    markdown += `**8. Evaluate the app scoring system:**\n`;
    markdown += `   - Is it directionally correct?\n`;
    markdown += `   - Does it over/under score?\n`;
    markdown += `   - Does it miss important factors?\n\n`;
    markdown += `**9. Score comparison analysis (REQUIRED):**\n`;
    markdown += `   - Compare Editorial Quality scores between app and your judgment. Flag any version with a gap greater than 10 points and explain why.\n`;
    markdown += `   - Compare Conversion Potential scores separately. Flag any gap greater than 10 points and explain why.\n`;
    markdown += `   - For each Persuasion Sub-Dimension, flag disagreements greater than 15 points.\n`;
    markdown += `   - State explicitly: does the app conflate Editorial Quality with Conversion Potential? Provide evidence from the scores.\n\n`;
    markdown += `**10. Final reliability verdict (answer all three):**\n`;
    markdown += `   - Is the app reliable for **ranking**? (yes/no + reason)\n`;
    markdown += `   - Is the app reliable for **Editorial Quality scoring**? (yes/no + reason)\n`;
    markdown += `   - Is the app reliable for **Conversion Potential scoring**? (yes/no + reason)\n\n`;
    markdown += `---\n\n`;

    // OUTPUT FORMAT
    markdown += `## OUTPUT FORMAT\n\n`;
    markdown += `**WINNER:**\n`;
    markdown += `...\n\n`;
    markdown += `**RANKING:**\n`;
    markdown += `...\n\n`;
    markdown += `**EDITORIAL QUALITY SCORES:**\n`;
    markdown += `- [Version label]: XX/100\n`;
    markdown += `...\n\n`;
    markdown += `**CONVERSION POTENTIAL SCORES:**\n`;
    markdown += `- [Version label]: XX/100\n`;
    markdown += `...\n\n`;
    markdown += `**PERSUASION BREAKDOWN:**\n`;
    markdown += `[Version label]: Emotional Impact XX | Clarity XX | Trust XX | Specificity XX | Urgency XX | Professionalism XX | Readability XX | CTA Strength XX | Audience Fit XX | Differentiation XX\n`;
    markdown += `...\n\n`;
    markdown += `**WINNER TYPE:**\n`;
    markdown += `...\n\n`;
    markdown += `**AGREEMENT:**\n`;
    markdown += `...\n\n`;
    markdown += `**DISAGREEMENTS:**\n`;
    markdown += `...\n\n`;
    markdown += `**WHO IS MORE CORRECT:**\n`;
    markdown += `...\n\n`;
    markdown += `**EDITORIAL QUALITY GAP ANALYSIS:**\n`;
    markdown += `...\n\n`;
    markdown += `**CONVERSION POTENTIAL GAP ANALYSIS:**\n`;
    markdown += `...\n\n`;
    markdown += `**DOES APP CONFLATE EDITORIAL AND CONVERSION?**\n`;
    markdown += `...\n\n`;
    markdown += `**APP RELIABILITY FOR RANKING:**\n`;
    markdown += `...\n\n`;
    markdown += `**APP RELIABILITY FOR EDITORIAL QUALITY SCORING:**\n`;
    markdown += `...\n\n`;
    markdown += `**APP RELIABILITY FOR CONVERSION POTENTIAL SCORING:**\n`;
    markdown += `...\n\n`;
    markdown += `**BIGGEST ERROR:**\n`;
    markdown += `...\n\n`;
    markdown += `**BIGGEST STRENGTH:**\n`;
    markdown += `...\n\n`;
    markdown += `**FINAL VERDICT:**\n`;
    markdown += `...\n\n`;

    markdown += `---\n\n`;
    markdown += `*End of audit file*\n`;

    // Create filename
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

    // Sanitize project description for filename
    const projectDesc = formState.projectDescription
      ? formState.projectDescription
          .trim()
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 50) // Limit length
      : 'untitled';

    const filename = `llm-COMPARE_${projectDesc}_${dateTime}.md`;

    // Create and download the file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting LLM evaluation audit:', error);
    throw error;
  }
};

/**
 * Enhanced PDF export with professional typography and hierarchy
 */
export const exportAsEnhancedPDF = (
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  originalInputScore?: any,
  promptEvaluation?: PromptEvaluation,
  comparisonResult?: any
): void => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter' // 612 x 792 points
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = 50;
  const maxLineWidth = pageWidth - (margins * 2);
  let yPosition = margins;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margins) {
      pdf.addPage();
      yPosition = margins;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0], lineHeight: number = 1.2) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(color[0], color[1], color[2]);

    const lines = pdf.splitTextToSize(text, maxLineWidth);
    lines.forEach((line: string) => {
      checkPageBreak(fontSize * lineHeight + 4);
      pdf.text(line, margins, yPosition);
      yPosition += fontSize * lineHeight;
    });
  };

  // Helper to add H1 heading
  const addH1 = (text: string) => {
    checkPageBreak(40);
    yPosition += 5;
    addText(text, 22, true, [0, 0, 0], 1.3);
    yPosition += 10;
  };

  // Helper to add H2 heading
  const addH2 = (text: string) => {
    checkPageBreak(30);
    yPosition += 8;
    addText(text, 16, true, [31, 41, 55], 1.2);
    yPosition += 6;
  };

  // Helper to add H3 heading
  const addH3 = (text: string) => {
    checkPageBreak(25);
    yPosition += 6;
    addText(text, 13, true, [55, 65, 81], 1.2);
    yPosition += 4;
  };

  // Helper to add body text
  const addBody = (text: string, indent: boolean = false) => {
    const leftMargin = indent ? margins + 20 : margins;
    const currentMargins = margins;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    const lines = pdf.splitTextToSize(text, maxLineWidth - (indent ? 20 : 0));
    lines.forEach((line: string) => {
      checkPageBreak(14);
      pdf.text(line, leftMargin, yPosition);
      yPosition += 14;
    });
  };

  // Helper to add separator line
  const addSeparator = () => {
    checkPageBreak(20);
    yPosition += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margins, yPosition, pageWidth - margins, yPosition);
    yPosition += 20;
  };

  // Helper to add table
  const addTable = (data: { label: string; value: string }[]) => {
    const rowHeight = 20;
    const colWidth = maxLineWidth / 2;

    data.forEach((row, idx) => {
      checkPageBreak(rowHeight);

      // Add subtle background for alternating rows
      if (idx % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(margins, yPosition - 14, maxLineWidth, rowHeight, 'F');
      }

      // Label (bold)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81);
      pdf.text(row.label, margins + 5, yPosition);

      // Value (normal)
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const valueLines = pdf.splitTextToSize(row.value, colWidth - 10);
      pdf.text(valueLines[0], margins + colWidth + 5, yPosition);

      yPosition += rowHeight;
    });
    yPosition += 5;
  };

  // DOCUMENT HEADER
  addH1('Generated Copy Report');
  addBody(`Generated: ${new Date().toLocaleString()}`);
  yPosition += 5;

  if (formState.projectDescription) {
    addBody(`Project: ${formState.projectDescription}`);
    yPosition += 5;
  }

  addSeparator();

  // INPUT SUMMARY
  addH2('Input Summary');
  yPosition += 5;

  addH3('Source Content');
  yPosition += 5;

  if (formState.tab === 'create') {
    addBody('Business Description:');
    yPosition += 2;
    addBody(formState.businessDescription || 'No business description provided', true);
    yPosition += 10;

    if (formState.businessDescriptionScore) {
      addBody(`Quality Score: ${formState.businessDescriptionScore.score}/100`);
      if (formState.businessDescriptionScore.tips && formState.businessDescriptionScore.tips.length > 0) {
        yPosition += 5;
        addBody('Tips:');
        formState.businessDescriptionScore.tips.forEach(tip => {
          addBody(`  • ${tip}`, true);
        });
      }
      yPosition += 10;
    }
  } else {
    addBody('Original Copy:');
    yPosition += 2;
    addBody(formState.originalCopy || 'No original copy provided', true);
    yPosition += 10;

    if (formState.originalCopyScore) {
      addBody(`Quality Score: ${formState.originalCopyScore.score}/100`);
      if (formState.originalCopyScore.tips && formState.originalCopyScore.tips.length > 0) {
        yPosition += 5;
        addBody('Tips:');
        formState.originalCopyScore.tips.forEach(tip => {
          addBody(`  • ${tip}`, true);
        });
      }
      yPosition += 10;
    }
  }

  addH3('Configuration');
  yPosition += 5;

  const configData = [
    { label: 'Language', value: formState.language },
    { label: 'Tone', value: formState.tone },
    { label: 'Word Count', value: formState.wordCount === 'Custom' ? `${formState.wordCount} (${formState.customWordCount})` : formState.wordCount },
  ];

  if (formState.targetAudience) configData.push({ label: 'Target Audience', value: formState.targetAudience });
  if (formState.keyMessage) configData.push({ label: 'Key Message', value: formState.keyMessage });
  if (formState.callToAction) configData.push({ label: 'Call to Action', value: formState.callToAction });
  if (formState.desiredEmotion) configData.push({ label: 'Desired Emotion', value: formState.desiredEmotion });
  if (formState.brandValues) configData.push({ label: 'Brand Values', value: formState.brandValues });
  if (formState.keywords) configData.push({ label: 'Keywords', value: formState.keywords });

  addTable(configData);

  addSeparator();

  // PROMPT EVALUATION
  if (promptEvaluation) {
    addH2('Prompt Evaluation');
    yPosition += 5;
    addBody(`Score: ${promptEvaluation.score}/100`);
    yPosition += 10;

    if (promptEvaluation.tips && promptEvaluation.tips.length > 0) {
      addBody('Improvement Tips:');
      yPosition += 5;
      promptEvaluation.tips.forEach(tip => {
        addBody(`  • ${tip}`, true);
      });
      yPosition += 10;
    }

    addSeparator();
  }

  // GENERATED CONTENT
  addH2('Generated Content');
  yPosition += 10;

  generatedOutputCards.forEach((item, index) => {
    if (index > 0) {
      addSeparator();
    }

    let sectionTitle = item.sourceDisplayName || item.type;
    if (item.persona) {
      sectionTitle += ` (${item.persona}'s Voice)`;
    }

    addH3(sectionTitle);
    yPosition += 5;

    // Handle different content types
    let actualContentToProcess: any = item.content;
    let nestedSeoMetadata: SeoMetadata | undefined;

    if (typeof item.content === 'object' && item.content !== null && 'content' in item.content && 'seoMetadata' in item.content) {
      actualContentToProcess = (item.content as any).content;
      nestedSeoMetadata = (item.content as any).seoMetadata;
    }

    // Content section
    addBody('Content:');
    yPosition += 5;

    if (Array.isArray(actualContentToProcess)) {
      actualContentToProcess.forEach((headline, idx) => {
        addBody(`${idx + 1}. ${headline}`, true);
      });
    } else {
      const plainText = structuredToPlainText(actualContentToProcess);
      addBody(plainText, true);
    }
    yPosition += 10;

    // Modification instruction
    if (item.modificationInstruction) {
      addBody(`Modification Applied: ${item.modificationInstruction}`);
      yPosition += 10;
    }

    // Blend instructions
    if (item.blendInstructions) {
      addBody(`Special Instructions Applied: ${item.blendInstructions}`);
      yPosition += 10;
    }

    // Quality metrics
    if (item.score) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      checkPageBreak(15);
      pdf.text('Quality Metrics', margins, yPosition);
      yPosition += 18;

      const metricsData = [
        { label: 'Overall', value: `${item.score.overall}/100` },
        { label: 'Clarity', value: `${item.score.clarity}` },
        { label: 'Persuasiveness', value: `${item.score.persuasiveness}` },
        { label: 'Tone Match', value: `${item.score.toneMatch}` },
        { label: 'Engagement', value: `${item.score.engagement}` },
      ];

      if (item.score.wordCountAccuracy !== undefined) {
        metricsData.push({ label: 'Word Count Accuracy', value: `${item.score.wordCountAccuracy}/100` });
      }

      addTable(metricsData);

      if (item.score.improvementExplanation) {
        yPosition += 5;
        addBody(`Why it's improved: ${item.score.improvementExplanation}`);
        yPosition += 10;
      }

      if (item.score.suggestions && item.score.suggestions.length > 0 && item.score.overall < 95) {
        addBody('Optimization Suggestions:');
        yPosition += 5;
        item.score.suggestions.forEach(suggestion => {
          addBody(`  • ${suggestion}`, true);
        });
        yPosition += 10;
      }
    }

    // NOTE: Comprehensive Score Breakdown (Conversion, Trust, Risk) is now only shown
    // in the Performance Comparison / Version Analysis section, not in individual output cards

    // GEO Score
    if (item.geoScore) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      checkPageBreak(15);
      pdf.text('GEO Score', margins, yPosition);
      yPosition += 18;

      addBody(`Overall GEO Score: ${item.geoScore.overall}/100`);
      yPosition += 10;

      if (item.geoScore.breakdown && item.geoScore.breakdown.length > 0) {
        addBody('Breakdown:');
        yPosition += 5;
        item.geoScore.breakdown.forEach(breakdownItem => {
          const status = breakdownItem.detected ? '[YES]' : '[NO]';
          addBody(`  • ${status} ${breakdownItem.criterion} (${breakdownItem.score} points): ${breakdownItem.explanation}`, true);
        });
        yPosition += 10;
      }

      if (item.geoScore.suggestions && item.geoScore.suggestions.length > 0 && item.geoScore.overall < 80) {
        addBody('GEO Optimization Suggestions:');
        yPosition += 5;
        item.geoScore.suggestions.forEach(suggestion => {
          addBody(`  • ${suggestion}`, true);
        });
        yPosition += 10;
      }
    }

    // SEO Metadata
    if (item.seoMetadata || nestedSeoMetadata) {
      const seoData = item.seoMetadata || nestedSeoMetadata;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      checkPageBreak(15);
      pdf.text('SEO Metadata', margins, yPosition);
      yPosition += 18;

      if (seoData!.urlSlugs && seoData!.urlSlugs.length > 0) {
        addBody('URL Slugs:');
        yPosition += 3;
        seoData!.urlSlugs.forEach((slug, idx) => {
          addBody(`${idx + 1}. ${slug} (${slug.length}/60 chars)`, true);
        });
        yPosition += 8;
      }

      if (seoData!.metaDescriptions && seoData!.metaDescriptions.length > 0) {
        addBody('Meta Descriptions:');
        yPosition += 3;
        seoData!.metaDescriptions.forEach((desc, idx) => {
          addBody(`${idx + 1}. ${desc} (${desc.length}/160 chars)`, true);
        });
        yPosition += 8;
      }

      if (seoData!.h1Variants && seoData!.h1Variants.length > 0) {
        addBody('H1 Variants:');
        yPosition += 3;
        seoData!.h1Variants.forEach((h1, idx) => {
          addBody(`${idx + 1}. ${h1} (${h1.length}/60 chars)`, true);
        });
        yPosition += 8;
      }

      if (seoData!.h2Headings && seoData!.h2Headings.length > 0) {
        addBody('H2 Headings:');
        yPosition += 3;
        seoData!.h2Headings.forEach((h2, idx) => {
          addBody(`${idx + 1}. ${h2} (${h2.length}/70 chars)`, true);
        });
        yPosition += 8;
      }

      if (seoData!.h3Headings && seoData!.h3Headings.length > 0) {
        addBody('H3 Headings:');
        yPosition += 3;
        seoData!.h3Headings.forEach((h3, idx) => {
          addBody(`${idx + 1}. ${h3} (${h3.length}/70 chars)`, true);
        });
        yPosition += 8;
      }
    }

    // FAQ Schema
    if (item.faqSchema && Object.keys(item.faqSchema).length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      checkPageBreak(15);
      pdf.text('FAQ Schema (JSON-LD)', margins, yPosition);
      yPosition += 18;

      const jsonString = JSON.stringify(item.faqSchema, null, 2);
      pdf.setFontSize(8);
      pdf.setFont('courier', 'normal');
      const jsonLines = pdf.splitTextToSize(jsonString, maxLineWidth);
      jsonLines.forEach((line: string) => {
        checkPageBreak(10);
        pdf.text(line, margins, yPosition);
        yPosition += 10;
      });
      yPosition += 10;
    }
  });

  // BEST VERSION ANALYSIS
  if (comparisonResult && typeof comparisonResult === 'object' && comparisonResult.bestVersionTitle) {
    addSeparator();
    addH2('Best Version Analysis');
    yPosition += 10;

    if (comparisonResult.bestForMarketing || comparisonResult.bestForClarity || comparisonResult.bestForSimplicity) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      checkPageBreak(15);
      pdf.text('Overall Verdict', margins, yPosition);
      yPosition += 18;

      if (comparisonResult.bestForMarketing) {
        addBody(`[BEST] Best for marketing: ${comparisonResult.bestForMarketing}`);
        yPosition += 5;
      }

      if (comparisonResult.bestForClarity) {
        addBody(`[BEST] Best for clarity and structure: ${comparisonResult.bestForClarity}`);
        yPosition += 5;
      }

      if (comparisonResult.bestForSimplicity) {
        addBody(`[BEST] Best for simplicity and readability: ${comparisonResult.bestForSimplicity}`);
        yPosition += 10;
      }
    }

    addH3(`Winner: ${comparisonResult.bestVersionTitle}`);
    yPosition += 5;
    addBody(`Overall Score: ${comparisonResult.overallScore}/10`);
    yPosition += 8;
    addBody(comparisonResult.reasoning);
    yPosition += 10;

    if (comparisonResult.strengths && comparisonResult.strengths.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      checkPageBreak(15);
      pdf.text('Key Strengths', margins, yPosition);
      yPosition += 15;

      comparisonResult.strengths.forEach((strength: string) => {
        addBody(`  • ${strength}`, true);
      });
      yPosition += 10;
    }

    if (comparisonResult.improvements && comparisonResult.improvements.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      checkPageBreak(15);
      pdf.text('Suggested Improvements', margins, yPosition);
      yPosition += 15;

      comparisonResult.improvements.forEach((improvement: string) => {
        addBody(`  • ${improvement}`, true);
      });
      yPosition += 10;
    }

    if (comparisonResult.strategicRecommendation) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      checkPageBreak(15);
      pdf.text('Strategic Recommendation', margins, yPosition);
      yPosition += 15;

      addBody(comparisonResult.strategicRecommendation);
      yPosition += 10;
    }

    if (comparisonResult.comparisonDetails && comparisonResult.comparisonDetails.length > 0) {
      addH3('All Versions Comparison');
      yPosition += 10;

      comparisonResult.comparisonDetails.forEach((detail: any, idx: number) => {
        const isBest = idx === comparisonResult.bestVersionIndex;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        checkPageBreak(15);
        pdf.text(`${isBest ? '[WINNER] ' : ''}${detail.versionTitle}`, margins, yPosition);
        yPosition += 15;

        addBody(`Score: ${detail.score}/10`);
        yPosition += 8;

        if (detail.metrics) {
          addBody('Performance Metrics:');
          yPosition += 5;

          const metricsData = [];
          if (detail.metrics.tone) metricsData.push({ label: 'Tone', value: detail.metrics.tone });
          if (detail.metrics.readability) metricsData.push({ label: 'Readability', value: detail.metrics.readability });
          if (detail.metrics.persuasion) metricsData.push({ label: 'Persuasion', value: detail.metrics.persuasion });
          if (detail.metrics.emotionalAppeal) metricsData.push({ label: 'Emotional Appeal', value: detail.metrics.emotionalAppeal });
          if (detail.metrics.differentiation) metricsData.push({ label: 'Differentiation', value: detail.metrics.differentiation });
          if (detail.metrics.conversionPotential) metricsData.push({ label: 'Conversion Potential', value: detail.metrics.conversionPotential });

          addTable(metricsData);
        }

        if (detail.bestUsedFor) {
          addBody(`Best used for: ${detail.bestUsedFor}`);
          yPosition += 10;
        }

        if (detail.pros && detail.pros.length > 0) {
          addBody('Pros:');
          yPosition += 5;
          detail.pros.forEach((pro: string) => {
            addBody(`  • [+] ${pro}`, true);
          });
          yPosition += 8;
        }

        if (detail.cons && detail.cons.length > 0) {
          addBody('Cons:');
          yPosition += 5;
          detail.cons.forEach((con: string) => {
            addBody(`  • [-] ${con}`, true);
          });
          yPosition += 10;
        }
      });
    }
  }

  // Footer
  addSeparator();
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  checkPageBreak(15);
  pdf.text(`Generated by CopyZap - ${new Date().toLocaleString()}`, margins, yPosition);

  // Save PDF
  const projectDesc = formState.projectDescription || 'copy-output';
  const sanitizedDesc = projectDesc
    .substring(0, 20)
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

  const filename = `${sanitizedDesc}_${dateTime}.pdf`;
  pdf.save(filename);
};