/**
 * Evidence Analyzer
 *
 * Analyzes differences between source text and output text using cheap heuristics.
 * NO AI calls, NO scoring, just deterministic text comparison.
 */

export interface EvidenceMetrics {
  lengthRatio: number;
  sourceWordCount: number;
  outputWordCount: number;
  sentenceCountDelta: number;
  paragraphCountDelta: number;
  avgSentenceLengthDelta: number;
  exclamationCountDelta: number;
  hasCtaInSource: boolean;
  hasCtaInOutput: boolean;
  ctaRemoved: boolean;
  hypeTokensInSource: number;
  hypeTokensInOutput: number;
  hypeReduced: boolean;
  isHtml: boolean;
  htmlPreserved: boolean;
}

// Common CTA phrases (multilingual support - basic patterns)
const CTA_PATTERNS = [
  /\b(buy|purchase|shop|order)\b/gi,
  /\b(sign up|signup|register|join)\b/gi,
  /\b(learn more|discover|find out|explore)\b/gi,
  /\b(get started|start now|begin|try)\b/gi,
  /\b(download|install)\b/gi,
  /\b(subscribe|follow)\b/gi,
  /\b(contact|call|email)\b/gi,
  /\b(book|reserve|schedule)\b/gi,
  /\b(kaufen|bestellen|jetzt)\b/gi, // German
  /\b(comprar|ordenar|ahora)\b/gi, // Spanish
  /\b(acheter|commander|maintenant)\b/gi, // French
  /\b(comprare|ordinare|ora)\b/gi, // Italian
];

// Hype/superlative tokens (multilingual support - basic patterns)
const HYPE_PATTERNS = [
  /\b(best|#1|number one|top|leading|premier|ultimate)\b/gi,
  /\b(guaranteed|proven|revolutionary|breakthrough|game-changing)\b/gi,
  /\b(world-class|industry-leading|award-winning|cutting-edge)\b/gi,
  /\b(amazing|incredible|unbelievable|extraordinary|phenomenal)\b/gi,
  /\b(perfect|flawless|perfect|ideal)\b/gi,
  /\b(guaranteed|surefire|fail-proof)\b/gi,
  /\b(beste|garantiert|revolutionär)\b/gi, // German
  /\b(mejor|garantizado|revolucionario)\b/gi, // Spanish
  /\b(meilleur|garanti|révolutionnaire)\b/gi, // French
  /\b(migliore|garantito|rivoluzionario)\b/gi, // Italian
];

/**
 * Count words in text
 */
function countWords(text: string): number {
  const plainText = stripHtmlTags(text);
  return plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Count sentences in text (split by . ! ?)
 */
function countSentences(text: string): number {
  const plainText = stripHtmlTags(text);
  // Split by sentence terminators and filter empty
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * Count paragraphs (split by blank lines or <p> tags for HTML)
 */
function countParagraphs(text: string, isHtml: boolean): number {
  if (isHtml) {
    // Count <p> tags
    const matches = text.match(/<p\b[^>]*>/gi);
    return matches ? matches.length : 1;
  } else {
    // Count blank line separated paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    return paragraphs.length;
  }
}

/**
 * Count exclamation marks
 */
function countExclamations(text: string): number {
  const matches = text.match(/!/g);
  return matches ? matches.length : 0;
}

/**
 * Check if text contains CTA phrases
 */
function hasCta(text: string): boolean {
  for (const pattern of CTA_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Count hype/superlative tokens
 */
function countHypeTokens(text: string): number {
  let count = 0;
  for (const pattern of HYPE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }
  return count;
}

/**
 * Check if text is HTML
 */
function isHtmlText(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Strip HTML tags for word counting
 */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Extract text from structured copy output
 */
function extractTextFromStructured(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.join('\n');
  }
  if (typeof content === 'object') {
    // Handle StructuredCopyOutput
    if (content.headline && content.sections) {
      let text = content.headline + '\n\n';
      content.sections.forEach((section: any) => {
        if (section.title) text += section.title + '\n';
        if (section.content) text += section.content + '\n';
        if (section.listItems) text += section.listItems.join('\n') + '\n';
      });
      return text;
    }
    return JSON.stringify(content);
  }
  return '';
}

/**
 * Analyze differences between source and output text
 * Returns evidence metrics for tag selection
 */
export function analyzeDiff(
  sourceText: string | any,
  outputText: string | any,
  intentKey?: string,
  contentType?: 'plain' | 'html'
): EvidenceMetrics {
  // Extract text from structured formats
  const sourceStr = extractTextFromStructured(sourceText);
  const outputStr = extractTextFromStructured(outputText);

  // Detect HTML
  const isHtml = contentType === 'html' || isHtmlText(outputStr);

  // Word counts
  const sourceWordCount = countWords(sourceStr);
  const outputWordCount = countWords(outputStr);
  const lengthRatio = outputWordCount / Math.max(1, sourceWordCount);

  // Sentence counts
  const sourceSentences = countSentences(sourceStr);
  const outputSentences = countSentences(outputStr);
  const sentenceCountDelta = outputSentences - sourceSentences;

  // Average sentence length
  const sourceAvgSentenceLength = sourceWordCount / Math.max(1, sourceSentences);
  const outputAvgSentenceLength = outputWordCount / Math.max(1, outputSentences);
  const avgSentenceLengthDelta = outputAvgSentenceLength - sourceAvgSentenceLength;

  // Paragraph counts
  const sourceParagraphs = countParagraphs(sourceStr, isHtml);
  const outputParagraphs = countParagraphs(outputStr, isHtml);
  const paragraphCountDelta = outputParagraphs - sourceParagraphs;

  // Exclamation marks
  const sourceExclamations = countExclamations(sourceStr);
  const outputExclamations = countExclamations(outputStr);
  const exclamationCountDelta = outputExclamations - sourceExclamations;

  // CTA detection
  const hasCtaInSource = hasCta(sourceStr);
  const hasCtaInOutput = hasCta(outputStr);
  const ctaRemoved = hasCtaInSource && !hasCtaInOutput;

  // Hype detection
  const hypeTokensInSource = countHypeTokens(sourceStr);
  const hypeTokensInOutput = countHypeTokens(outputStr);
  const hypeReduced = hypeTokensInOutput < hypeTokensInSource;

  // HTML preservation
  const htmlPreserved = isHtml && isHtmlText(outputStr);

  return {
    lengthRatio,
    sourceWordCount,
    outputWordCount,
    sentenceCountDelta,
    paragraphCountDelta,
    avgSentenceLengthDelta,
    exclamationCountDelta,
    hasCtaInSource,
    hasCtaInOutput,
    ctaRemoved,
    hypeTokensInSource,
    hypeTokensInOutput,
    hypeReduced,
    isHtml,
    htmlPreserved,
  };
}
