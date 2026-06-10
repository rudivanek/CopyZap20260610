/**
 * Variant Recommendation Logic
 *
 * Deterministic selection of the best variant for continuing in Copy Form.
 * No AI model calls - uses heuristic analysis only.
 */

import { PolishResultItem } from './types';

/**
 * Words that indicate vagueness or generic content
 */
const VAGUE_WORDS = [
  'glance', 'core', 'concise', 'simply', 'basically', 'generally',
  'various', 'multiple', 'several', 'numerous', 'essentially',
  'quick', 'easy', 'simple', 'brief', 'short'
];

/**
 * Words that indicate specific strategic language
 */
const STRATEGIC_WORDS = [
  'process', 'parameters', 'measure', 'aligned', 'brand-consistent',
  'strategy', 'implement', 'optimize', 'execute', 'achieve',
  'analyze', 'evaluate', 'framework', 'methodology', 'approach',
  'objective', 'target', 'outcome', 'result', 'impact',
  'specific', 'detailed', 'comprehensive', 'thorough', 'precise'
];

/**
 * Analyzes text structure to determine if it has both headline and body
 */
function hasHeadlineAndBody(text: string): boolean {
  const lines = text.trim().split('\n').filter(line => line.trim().length > 0);

  if (lines.length < 2) return false;

  // First line should be relatively short (headline)
  const firstLine = lines[0].trim();
  const restText = lines.slice(1).join(' ').trim();

  // Headline heuristic: < 150 chars
  const hasHeadline = firstLine.length > 10 && firstLine.length < 150;

  // Body heuristic: at least 50 chars of substantive text
  const hasBody = restText.length >= 50;

  return hasHeadline && hasBody;
}

/**
 * Counts occurrences of vague words in text (case insensitive)
 */
function countVagueWords(text: string): number {
  const lowerText = text.toLowerCase();
  return VAGUE_WORDS.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

/**
 * Counts occurrences of strategic words in text (case insensitive)
 */
function countStrategicWords(text: string): number {
  const lowerText = text.toLowerCase();
  return STRATEGIC_WORDS.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

/**
 * Calculates a recommendation score for a variant
 * Higher score = better recommendation
 */
function calculateScore(variant: PolishResultItem): number {
  let score = 0;
  const text = variant.text;

  // +100 points for having both headline and body
  if (hasHeadlineAndBody(text)) {
    score += 100;
  }

  // +5 points per strategic word
  const strategicCount = countStrategicWords(text);
  score += strategicCount * 5;

  // -10 points per vague word
  const vagueCount = countVagueWords(text);
  score -= vagueCount * 10;

  // +50 points for having substantive length (200+ chars)
  if (text.length >= 200) {
    score += 50;
  }

  // +20 points for being refined (shows iteration)
  if (variant.isRefined) {
    score += 20;
  }

  return score;
}

/**
 * Selects the recommended variant from a list
 * Returns the index of the recommended variant
 *
 * @param variants - Array of polish result items
 * @param userGoal - Optional user goal text for context
 * @returns Index of recommended variant (0 if no variants)
 */
export function selectRecommendedVariant(
  variants: PolishResultItem[],
  userGoal?: string
): number {
  if (variants.length === 0) return 0;
  if (variants.length === 1) return 0;

  // Calculate scores for all variants
  const variantsWithScores = variants.map((variant, index) => ({
    index,
    variant,
    score: calculateScore(variant)
  }));

  // Sort by score (descending) - highest score first
  // If scores are equal, maintain original order (stable sort)
  variantsWithScores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index; // Stable sort on original index
  });

  return variantsWithScores[0].index;
}

/**
 * Gets the recommendation reason text for the selected variant
 */
export function getRecommendationReason(variant: PolishResultItem): string {
  const hasStructure = hasHeadlineAndBody(variant.text);
  const strategicCount = countStrategicWords(variant.text);
  const vagueCount = countVagueWords(variant.text);

  if (hasStructure && strategicCount > vagueCount) {
    return 'Clear structure with specific, strategic language - ideal foundation for Copy Form.';
  }

  if (hasStructure) {
    return 'Well-structured with headline and body - good starting point for further development.';
  }

  if (strategicCount > vagueCount && variant.text.length >= 150) {
    return 'Contains specific strategic content that translates well to Copy Form parameters.';
  }

  if (variant.isRefined) {
    return 'Refined version with improved clarity - ready for Copy Form enhancement.';
  }

  return 'Best foundation for continuing in Copy Form based on clarity and completeness.';
}

/**
 * Simple test cases to verify the logic works
 * Can be called in development to validate behavior
 */
export function runRecommendationTests(): void {
  const testVariants: PolishResultItem[] = [
    {
      text: 'Quick solution\nSome generic content here.',
      intentId: 'test',
      tone: 'neutral',
      contentType: 'plain',
      isRefined: false
    },
    {
      text: 'Comprehensive Strategy Framework\nThis approach provides detailed parameters to measure and evaluate your process. Our methodology ensures aligned outcomes with specific, measurable objectives.',
      intentId: 'test',
      tone: 'professional',
      contentType: 'plain',
      isRefined: false
    },
    {
      text: 'At a glance\nBasically a simple and easy brief overview.',
      intentId: 'test',
      tone: 'casual',
      contentType: 'plain',
      isRefined: false
    }
  ];

  const recommendedIndex = selectRecommendedVariant(testVariants);
  console.log('✅ Recommendation Test:', {
    recommendedIndex,
    recommendedText: testVariants[recommendedIndex].text.substring(0, 50),
    reason: getRecommendationReason(testVariants[recommendedIndex])
  });

  // Expected: index 1 (has strategic words, structure, and specific language)
  if (recommendedIndex === 1) {
    console.log('✅ Test PASSED - Correctly selected variant with strategic content');
  } else {
    console.warn('⚠️ Test FAILED - Expected index 1, got', recommendedIndex);
  }
}
