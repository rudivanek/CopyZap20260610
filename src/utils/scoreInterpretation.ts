/**
 * Score Interpretation Utilities
 *
 * Provides consistent labeling and decision-oriented summaries
 * for the Multi-Score system (Conversion, Trust, Risk).
 *
 * IMPORTANT: This module does NOT modify scoring logic or calculations.
 * It only provides UI interpretation and display utilities.
 */

export type ScoreLabel = 'Weak' | 'Moderate' | 'Strong' | 'Very strong';
export type RiskLevel = 'Low' | 'Medium' | 'High';

/**
 * Get qualitative label for Conversion or Trust scores
 */
export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 86) return 'Very strong';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Moderate';
  return 'Weak';
}

/**
 * Format score with label: "Conversion: 78 (Strong)"
 */
export function formatScoreWithLabel(
  scoreName: 'Conversion' | 'Trust',
  score: number
): string {
  const label = getScoreLabel(score);
  return `${scoreName}: ${score} (${label})`;
}

/**
 * Format risk level display
 */
export function formatRiskLevel(risk: string): string {
  return `Risk: ${risk}`;
}

/**
 * Generate decision-oriented summary based on score combination
 */
export function generateScoreSummary(
  conversion: number,
  trust: number,
  risk: string
): string {
  let summary = '';

  // Determine base message
  if (conversion < 50 && trust >= 50) {
    summary = 'Credible, but not driving action.';
  } else if (conversion >= 70 && trust < 50) {
    summary = 'Persuasive, but lacks credibility.';
  } else if (conversion < 50 && trust < 50) {
    summary = 'Weak positioning — unclear value and low trust.';
  } else if (conversion >= 50 && conversion < 70 && trust >= 50 && trust < 70) {
    summary = 'Balanced, but not strongly convincing.';
  } else if (conversion >= 70 && trust >= 70) {
    summary = 'Strong and convincing positioning.';
  } else {
    // Fallback for edge cases
    summary = 'Mixed performance across conversion and trust.';
  }

  // Append risk warning if high
  if (risk === 'High') {
    summary += ' Potential friction or skepticism present.';
  }

  return summary;
}

/**
 * Get compact label abbreviation for scores
 */
export function getCompactScoreLabel(score: number): string {
  if (score >= 86) return 'VS'; // Very Strong
  if (score >= 70) return 'S';  // Strong
  if (score >= 50) return 'M';  // Moderate
  return 'W';                    // Weak
}

/**
 * Format compact sub-scores for table display: "C:78  T:72  R:Low"
 */
export function formatCompactSubScores(
  conversion: number,
  trust: number,
  risk: string
): string {
  return `C:${conversion}  T:${trust}  R:${risk}`;
}

/**
 * Format sub-scores with compact labels for better visibility
 * Format: "C:50 (W)   T:58 (M)   R:Low"
 */
export function formatCompactSubScoresWithLabels(
  conversion: number,
  trust: number,
  risk: string
): string {
  const cLabel = getCompactScoreLabel(conversion);
  const tLabel = getCompactScoreLabel(trust);
  return `C:${conversion} (${cLabel})   T:${trust} (${tLabel})   R:${risk}`;
}

/**
 * Format ultra-compact sub-scores (space-constrained): "C78 T72 R:L"
 */
export function formatUltraCompactSubScores(
  conversion: number,
  trust: number,
  risk: string
): string {
  const riskShort = risk.charAt(0); // L, M, or H
  return `C${conversion} T${trust} R:${riskShort}`;
}

/**
 * Get complete score interpretation object
 */
export interface ScoreInterpretation {
  conversion: {
    score: number;
    label: ScoreLabel;
    formatted: string;
  };
  trust: {
    score: number;
    label: ScoreLabel;
    formatted: string;
  };
  risk: {
    level: string;
    formatted: string;
  };
  summary: string;
  compact: string;
  ultraCompact: string;
}

export function getScoreInterpretation(
  conversion: number,
  trust: number,
  risk: string
): ScoreInterpretation {
  return {
    conversion: {
      score: conversion,
      label: getScoreLabel(conversion),
      formatted: formatScoreWithLabel('Conversion', conversion),
    },
    trust: {
      score: trust,
      label: getScoreLabel(trust),
      formatted: formatScoreWithLabel('Trust', trust),
    },
    risk: {
      level: risk,
      formatted: formatRiskLevel(risk),
    },
    summary: generateScoreSummary(conversion, trust, risk),
    compact: formatCompactSubScores(conversion, trust, risk),
    ultraCompact: formatUltraCompactSubScores(conversion, trust, risk),
  };
}
