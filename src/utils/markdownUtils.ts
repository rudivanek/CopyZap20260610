/**
 * Utility functions for handling Markdown formatting
 */

/**
 * Removes Markdown formatting from a string
 * Currently handles:
 * - Bold (**text**)
 * - Italics (*text*)
 * - Headers (#, ##, ###, etc.)
 * - List markers (-, *, +)
 * - Code blocks (```)
 */
export const stripMarkdown = (text: string): string => {
  if (!text) return '';

  // Remove code blocks
  let cleanedText = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  cleanedText = cleanedText.replace(/`([^`]+)`/g, '$1');

  // Remove bold (**text**)
  cleanedText = cleanedText.replace(/\*\*(.*?)\*\*/g, '$1');

  // Remove italics (*text*)
  cleanedText = cleanedText.replace(/\*(.*?)\*/g, '$1');

  // Remove headers (# text, ## text, etc.)
  cleanedText = cleanedText.replace(/^#{1,6}\s+/gm, '');

  // Replace list markers with simple bullets for better readability
  cleanedText = cleanedText.replace(/^[-*+]\s+/gm, '  • ');

  // Remove link syntax [text](url) - keep the text only
  cleanedText = cleanedText.replace(/\[(.*?)\]\(.*?\)/g, '$1');

  // Remove HTML tags
  cleanedText = cleanedText.replace(/<[^>]*>/g, '');

  return cleanedText;
};

/**
 * Count words in a string
 */
export const countWords = (text: string): number => {
  if (!text) return 0;
  // Normalize whitespace and split by spaces to count words
  return text.trim().split(/\s+/).length;
};

/**
 * Calculate word count accuracy score (0-100)
 * @param actualCount - The actual word count
 * @param targetCount - The target word count
 * @returns A score from 0-100 representing accuracy
 */
export const calculateWordCountAccuracy = (actualCount: number, targetCount: number): number => {
  if (targetCount <= 0) return 100; // No target means perfect accuracy

  const difference = Math.abs(actualCount - targetCount);
  const percentDifference = (difference / targetCount) * 100;

  // Scale the score based on percentage difference
  if (percentDifference <= 2) return 100; // Perfect accuracy (within 2%)
  if (percentDifference <= 5) return 95;  // Excellent (within 5%)
  if (percentDifference <= 10) return 85; // Good (within 10%)
  if (percentDifference <= 15) return 75; // Acceptable (within 15%)
  if (percentDifference <= 20) return 65; // Fair (within 20%)
  if (percentDifference <= 30) return 50; // Poor (within 30%)
  if (percentDifference <= 50) return 30; // Very poor (within 50%)
  return 0; // Completely off target (more than 50% difference)
};

/**
 * Removes emojis and special Unicode characters that PDF libraries can't handle
 * Replaces common emojis with text equivalents for better PDF compatibility
 */
export const sanitizeForPdf = (text: string): string => {
  if (!text) return '';

  let cleanedText = text;

  // Replace common emojis with text equivalents
  cleanedText = cleanedText.replace(/✅/g, '[YES]');
  cleanedText = cleanedText.replace(/❌/g, '[NO]');
  cleanedText = cleanedText.replace(/🏆/g, '[WINNER]');
  cleanedText = cleanedText.replace(/👑/g, '[BEST]');
  cleanedText = cleanedText.replace(/🧭/g, '[USE CASE]');
  cleanedText = cleanedText.replace(/⭐/g, '[STAR]');
  cleanedText = cleanedText.replace(/💡/g, '[TIP]');
  cleanedText = cleanedText.replace(/📊/g, '[CHART]');
  cleanedText = cleanedText.replace(/🎯/g, '[TARGET]');

  // Remove any remaining emojis (Unicode ranges for emojis)
  // This regex covers most emoji ranges
  cleanedText = cleanedText.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  cleanedText = cleanedText.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc Symbols and Pictographs
  cleanedText = cleanedText.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport and Map
  cleanedText = cleanedText.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
  cleanedText = cleanedText.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Misc symbols
  cleanedText = cleanedText.replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats
  cleanedText = cleanedText.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols and Pictographs
  cleanedText = cleanedText.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // Chess Symbols
  cleanedText = cleanedText.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs Extended-A

  return cleanedText;
};