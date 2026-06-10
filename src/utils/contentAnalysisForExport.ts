/**
 * ON-THE-FLY CONTENT ANALYSIS FOR EXPORTS
 *
 * Generates Key Strengths and Suggested Improvements during export
 * without requiring deep analysis to have been triggered in the app.
 */

import { calculateMultiScoreDisplay } from './multiScoreDisplay';

export interface ExportAnalysisResult {
  keyStrengths: string[];
  suggestedImprovements: string[];
}

/**
 * Analyze content and generate Key Strengths and Suggested Improvements
 * This runs on-the-fly during export, independent of app UI state
 */
export function generateExportAnalysis(content: string): ExportAnalysisResult {
  if (!content || content.trim().length === 0) {
    return {
      keyStrengths: [],
      suggestedImprovements: []
    };
  }

  const contentLower = content.toLowerCase();
  const keyStrengths: string[] = [];
  const suggestedImprovements: string[] = [];

  // Get comprehensive scores for reference
  const scores = calculateMultiScoreDisplay(content);

  // === KEY STRENGTHS DETECTION ===

  // 1. Clear value proposition
  if (contentLower.includes('help') || contentLower.includes('benefit') ||
      contentLower.includes('solution') || contentLower.includes('service')) {
    keyStrengths.push('Communicates clear value proposition and service offering');
  }

  // 2. Professional credibility signals
  if (contentLower.includes('experience') || contentLower.includes('expert') ||
      contentLower.includes('professional') || contentLower.includes('years') ||
      contentLower.includes('proven') || contentLower.includes('trusted')) {
    keyStrengths.push('Establishes credibility through expertise and experience references');
  }

  // 3. Local/specific focus
  if (contentLower.match(/\b(local|community|region|area|city|country)\b/)) {
    keyStrengths.push('Emphasizes local presence or geographic specificity');
  }

  // 4. Call-to-action presence
  if (contentLower.match(/\b(contact|call|email|visit|schedule|book|request|get|start|try)\b/)) {
    keyStrengths.push('Includes clear call-to-action to guide next steps');
  }

  // 5. Customer-centric language
  if (contentLower.includes('you') || contentLower.includes('your') ||
      contentLower.includes('customer') || contentLower.includes('client')) {
    keyStrengths.push('Uses customer-focused language and perspective');
  }

  // 6. Specific outcomes/results
  if (contentLower.match(/\b(result|outcome|achieve|deliver|success|grow|increase)\b/)) {
    keyStrengths.push('Focuses on concrete outcomes and results');
  }

  // 7. Professional tone (based on risk score)
  if (scores.risk === 'Low') {
    keyStrengths.push('Maintains professional tone appropriate for business communication');
  }

  // === SUGGESTED IMPROVEMENTS DETECTION ===

  // 1. Low conversion score
  if (scores.conversion < 50) {
    suggestedImprovements.push('Strengthen urgency and motivators to drive action');
    suggestedImprovements.push('Add more compelling value statements or unique differentiators');
  } else if (scores.conversion < 70) {
    suggestedImprovements.push('Consider adding urgency elements or time-sensitive offers');
  }

  // 2. Low trust score
  if (scores.trust < 50) {
    suggestedImprovements.push('Add supporting evidence, testimonials, or case studies to build trust');
    suggestedImprovements.push('Soften claims or provide more specific proof points');
  } else if (scores.trust < 70) {
    suggestedImprovements.push('Consider adding social proof or credibility indicators');
  }

  // 3. Missing specific metrics
  if (!contentLower.match(/\b(\d+%|\d+ years?|\d+ clients?|\d+ customers?)\b/)) {
    suggestedImprovements.push('Include specific numbers, metrics, or timeframes to add credibility');
  }

  // 4. Vague claims
  if (contentLower.includes('best') || contentLower.includes('leading') ||
      contentLower.includes('top') || contentLower.includes('amazing')) {
    suggestedImprovements.push('Replace superlatives with specific, verifiable statements');
  }

  // 5. Lack of specificity
  if (contentLower.includes('solutions') || contentLower.includes('services')) {
    if (!contentLower.match(/\b(such as|including|like|for example)\b/)) {
      suggestedImprovements.push('Provide specific examples of solutions or services offered');
    }
  }

  // 6. Missing benefit clarity
  if (!contentLower.match(/\b(save|grow|increase|improve|reduce|enhance|boost)\b/)) {
    suggestedImprovements.push('Clarify tangible benefits customers will receive');
  }

  // 7. Weak CTA
  if (scores.conversion < 60 && contentLower.match(/\b(contact|learn more)\b/)) {
    suggestedImprovements.push('Use more action-oriented CTA language (e.g., "Get started", "Schedule now")');
  }

  // 8. High risk score
  if (scores.risk === 'High') {
    suggestedImprovements.push('Review language for potential spam triggers or compliance issues');
  } else if (scores.risk === 'Medium') {
    suggestedImprovements.push('Consider softening aggressive or potentially problematic phrasing');
  }

  // Ensure we have at least 3-4 items in each section
  if (keyStrengths.length === 0) {
    keyStrengths.push('Content presents core offering in accessible language');
  }

  if (keyStrengths.length === 1) {
    keyStrengths.push('Message structure supports reader comprehension');
  }

  if (suggestedImprovements.length === 0) {
    suggestedImprovements.push('Consider adding more specific details or examples');
  }

  if (suggestedImprovements.length === 1) {
    suggestedImprovements.push('Explore opportunities to strengthen unique value proposition');
  }

  // Limit to max 8 items each
  return {
    keyStrengths: keyStrengths.slice(0, 8),
    suggestedImprovements: suggestedImprovements.slice(0, 8)
  };
}
