/**
 * Comprehensive Scoring System - Per-Version Absolute Scoring
 *
 * v3: Added evidence anchors per dimension.
 * v3.1: Evidence validity guard + keyword-based SEO enforcement.
 * v4: SEO is CONDITIONAL — only counted in finalScore when valid keywords are provided.
 *     When seoActive=false: finalScore = weighted average of 7 core dimensions.
 *     When seoActive=true: finalScore = weighted average of all 8 dimensions.
 *     Cache keys include seoActive + keywordsSignature to prevent cross-contamination.
 * v5: CALIBRATION OVERHAUL — Context-aware persuasion evaluation.
 *     New dimension: Audience–Tone Alignment (25%) replaces simple marketing weight.
 *     Renamed: marketing → persuasion, merged readability into clarity.
 *     New dimensions: differentiation (10%), trust (10%).
 *     Spanish language register detection (tú vs usted based on tone).
 *     Numerical claims validation: unsourced fabricated stats penalized.
 *
 * BOLT PATCH v1.1 (LLM Reliability Fix):
 *     - Simplified system prompt to prevent LLM refusals
 *     - Force JSON mode with response_format parameter
 *     - Auto-retry logic for refusals and empty responses (max 3 attempts)
 *     - Content sanitization (6000 char limit to prevent overflow)
 *     - Enhanced failure logging with clear warning indicators
 */

import { GeneratedContentItem, User, Model, ScoringContext } from '../../types';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { debugCompare } from '../../utils/debugLogger';
import { SCORING_MODEL } from '../../constants';
import {
  estimateConversionDisplayScore,
  estimateTrustDisplayScore,
  estimateRiskDisplayLevel,
  RiskLevel
} from '../../utils/multiScoreDisplay';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCORE TRACE AUDIT SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Purpose: Diagnose whether scoring engine evaluates each variant independently
// or reuses/falls back to shared results
//
// Enable: localStorage.setItem('copyzap_scoreTrace', '1')
// Disable: localStorage.removeItem('copyzap_scoreTrace')
// Access: window.__copyzapScoreTrace
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Check if trace debugging is enabled */
function isTraceEnabled(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  return localStorage.getItem('copyzap_scoreTrace') === '1';
}

/** Simple hash function for content fingerprinting */
function simpleHash(str: string): string {
  if (!str) return 'empty';
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 200); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/** Per-variant trace entry */
interface VariantTraceEntry {
  // Identification
  runId: string;
  versionId: string;
  optionLabel: string;
  index: number;
  contentHash: string;

  // Execution flags
  enteredScoreVersion: boolean;
  llmCallAttempted: boolean;
  rawModelUsed: string;

  // Parse/repair tracking
  parseSuccess: boolean;
  repairRetryAttempted: boolean;
  repairRetrySuccess: boolean;

  // Fallback detection
  fallbackTriggered: boolean;
  fallbackReason: string | null;

  // Score data
  conversionScore: number | null;
  trustScore: number | null;
  riskLevel: string | null;
  baseScoreCore: number | null;
  tieBreaker: number | null;
  baseFinalScore: number | null;
  adjustment: number | null;
  adjustedFinalScore: number | null;
  displayedScore: number | null;

  // Narrative tracking
  narrativeGenerated: boolean;
  insightHash: string;
  actionHash: string;

  // Timestamp
  timestamp: number;
}

/** Global trace storage */
declare global {
  interface Window {
    __copyzapScoreTrace?: VariantTraceEntry[];
  }
}

/** Initialize trace storage */
function initTrace() {
  if (typeof window !== 'undefined') {
    window.__copyzapScoreTrace = window.__copyzapScoreTrace || [];
  }
}

/** Generate unique run ID */
function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

/** Log a trace entry */
function logTrace(entry: VariantTraceEntry) {
  if (!isTraceEnabled()) return;

  initTrace();
  if (typeof window !== 'undefined' && window.__copyzapScoreTrace) {
    window.__copyzapScoreTrace.push(entry);
  }

  // Console log for quick visibility
  console.log(`🔍 [SCORE TRACE] ${entry.optionLabel} (${entry.contentHash}):`, {
    index: entry.index,
    llmCalled: entry.llmCallAttempted,
    parseOK: entry.parseSuccess,
    repairAttempted: entry.repairRetryAttempted,
    repairOK: entry.repairRetrySuccess,
    fallback: entry.fallbackTriggered,
    fallbackReason: entry.fallbackReason,
    finalScore: entry.displayedScore,
    insightHash: entry.insightHash,
    actionHash: entry.actionHash,
  });
}

/** Log run start */
function logRunStart(runId: string, versionCount: number) {
  if (!isTraceEnabled()) return;
  console.log(`🔍 [SCORE TRACE] ═══════════════════════════════════════════`);
  console.log(`🔍 [SCORE TRACE] Run ${runId} started`);
  console.log(`🔍 [SCORE TRACE] Scoring ${versionCount} version(s)`);
  console.log(`🔍 [SCORE TRACE] ═══════════════════════════════════════════`);
}

/**
 * POST-FIX VALIDATION: verify scoring is truly separated after bug fixes
 * Produces detailed diagnostic table and identifies remaining compression issues
 */
function logPostFixValidation(runId: string, entries: VariantTraceEntry[]) {
  if (!isTraceEnabled() || entries.length === 0) return;

  console.log(`\n📊 [POST-FIX VALIDATION] Scoring Quality Audit for ${runId}`);
  console.log(`═══════════════════════════════════════════════════════════════`);

  // 1. SUMMARY TABLE - one row per version
  console.log(`\n📋 DETAILED SCORE BREAKDOWN:`);
  console.log(`┌─────────────────────────────────────────────────────────────────────────────────────────┐`);
  console.log(`│ Version           │ Conv │ Trust│ Risk  │ Base │ Tie │ Final│ Adj │ Display│ Fallback │`);
  console.log(`├─────────────────────────────────────────────────────────────────────────────────────────┤`);

  entries.forEach(entry => {
    const version = entry.optionLabel?.substring(0, 17).padEnd(17) || 'Unknown'.padEnd(17);
    const conv = String(entry.conversionScore || 0).padStart(4);
    const trust = String(entry.trustScore || 0).padStart(5);
    const risk = (entry.riskLevel || 'N/A').padEnd(6);
    const base = String(entry.baseScoreCore || 0).padStart(4);
    const tie = String(entry.tieBreaker || 0).padStart(3);
    const final = String(entry.baseFinalScore || 0).padStart(5);
    const adj = (entry.adjustment !== undefined ? (entry.adjustment >= 0 ? '+' : '') + entry.adjustment : 'N/A').padStart(4);
    const display = String(entry.displayedScore || 0).padStart(7);
    const fallback = (entry.fallbackTriggered ? 'YES' : 'NO').padEnd(9);

    console.log(`│ ${version} │ ${conv} │ ${trust} │ ${risk} │ ${base} │ ${tie} │ ${final} │ ${adj} │ ${display} │ ${fallback} │`);
  });
  console.log(`└─────────────────────────────────────────────────────────────────────────────────────────┘`);

  // 2. IDENTIFY REMAINING PROBLEMS
  const fallbackCount = entries.filter(e => e.fallbackTriggered).length;
  const displayScores = entries.map(e => e.displayedScore || 0).sort((a, b) => b - a);
  const internalScores = entries.map(e => e.adjustedFinalScore || 0).sort((a, b) => b - a);
  const adjustments = entries.map(e => e.adjustment || 0);

  const displaySpread = displayScores[0] - displayScores[displayScores.length - 1];
  const internalSpread = internalScores[0] - internalScores[internalScores.length - 1];
  const maxAdjustment = Math.max(...adjustments.map(Math.abs));

  // Check for score clustering (adjacent scores within 2 points)
  const clusteredPairs = displayScores.slice(0, -1).filter((score, i) =>
    Math.abs(score - displayScores[i + 1]) <= 2
  ).length;

  console.log(`\n🔍 PROBLEM ANALYSIS:`);
  console.log(`   Fallback Rate: ${fallbackCount}/${entries.length} (${(fallbackCount/entries.length*100).toFixed(1)}%)`);
  console.log(`   Display Score Spread: ${displaySpread} points (${displayScores[0]} → ${displayScores[displayScores.length - 1]})`);
  console.log(`   Internal Score Spread: ${internalSpread.toFixed(2)} points (before rounding)`);
  console.log(`   Max LLM Adjustment: ±${maxAdjustment} points`);
  console.log(`   Clustered Pairs: ${clusteredPairs}/${entries.length - 1} (within 2 points)`);

  // 3. DISCRIMINATION QUALITY CHECK
  const hasOriginal = entries.some(e => e.optionLabel?.toLowerCase().includes('original'));
  const hasGenerated = entries.some(e => e.optionLabel?.toLowerCase().includes('generated'));
  const hasVoiceStyle = entries.some(e => e.optionLabel?.toLowerCase().includes('voice'));

  console.log(`\n📊 DISCRIMINATION CHECK:`);
  console.log(`   Can distinguish original vs generated: ${hasOriginal && hasGenerated ? 'YES' : 'N/A'}`);
  console.log(`   Can distinguish voice-styled variants: ${hasVoiceStyle ? 'YES' : 'N/A'}`);

  if (hasOriginal && hasGenerated) {
    const originalScore = entries.find(e => e.optionLabel?.toLowerCase().includes('original'))?.displayedScore || 0;
    const generatedScores = entries.filter(e => e.optionLabel?.toLowerCase().includes('generated'))
      .map(e => e.displayedScore || 0);
    const avgGenerated = generatedScores.reduce((a, b) => a + b, 0) / generatedScores.length;
    const separation = Math.abs(originalScore - avgGenerated);
    console.log(`   Original vs Generated separation: ${separation.toFixed(1)} points`);
  }

  // 4. ROOT CAUSE DIAGNOSIS
  console.log(`\n🎯 ROOT CAUSE DIAGNOSIS:`);
  const problems: string[] = [];

  if (fallbackCount > 0) {
    problems.push(`a) FALLBACK CONTAMINATION: ${fallbackCount} version(s) using fallback score (78)`);
  }

  if (displaySpread < 5 && entries.length >= 3) {
    problems.push(`b) SEVERE SCORE COMPRESSION: Only ${displaySpread} point spread across ${entries.length} versions`);
  }

  if (internalSpread > displaySpread + 2) {
    problems.push(`c) DISPLAY ROUNDING HIDING SEPARATION: Internal spread ${internalSpread.toFixed(1)} reduced to ${displaySpread} by rounding`);
  }

  if (maxAdjustment < 3 && internalSpread < 8) {
    problems.push(`d) LLM ADJUSTMENT TOO CONSTRAINED: Max adjustment only ±${maxAdjustment}, limiting separation`);
  }

  const heuristicSpread = Math.max(...entries.map(e => e.baseScoreCore || 0)) -
                          Math.min(...entries.map(e => e.baseScoreCore || 0));
  if (heuristicSpread < 4) {
    problems.push(`e) HEURISTIC GRANULARITY TOO LOW: Base scores only vary by ${heuristicSpread} points`);
  }

  if (clusteredPairs > entries.length / 2) {
    problems.push(`f) SCORE CLUSTERING: ${clusteredPairs} adjacent pairs within 2 points`);
  }

  if (problems.length === 0) {
    console.log(`   ✅ NO MAJOR ISSUES DETECTED - Scoring appears healthy`);
  } else {
    console.log(`   ⚠️  ISSUES FOUND:`);
    problems.forEach((p, i) => console.log(`      ${i + 1}. ${p}`));
  }

  // 5. RECOMMENDATIONS
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (fallbackCount > 0) {
    console.log(`   1. [CRITICAL] Fix remaining parse errors causing fallback`);
  }
  if (displaySpread < 5 && heuristicSpread < 4) {
    console.log(`   2. [HIGH] Increase heuristic score granularity (currently too coarse)`);
  }
  if (maxAdjustment < 3 && internalSpread < 8) {
    console.log(`   3. [MEDIUM] Consider increasing LLM adjustment range beyond ±10`);
  }
  if (internalSpread > displaySpread + 2) {
    console.log(`   4. [LOW] Display decimal scores to preserve internal separation`);
  }
  if (problems.length === 0) {
    console.log(`   ✅ System is functioning well - consider A/B testing with users`);
  }

  console.log(`\n═══════════════════════════════════════════════════════════════\n`);
}

/** Log run completion */
function logRunComplete(runId: string, entries: VariantTraceEntry[]) {
  if (!isTraceEnabled()) return;

  const summary = {
    totalVersions: entries.length,
    llmCallsAttempted: entries.filter(e => e.llmCallAttempted).length,
    parsedSuccessfully: entries.filter(e => e.parseSuccess).length,
    repairRetries: entries.filter(e => e.repairRetryAttempted).length,
    repairSuccesses: entries.filter(e => e.repairRetrySuccess).length,
    fallbacks: entries.filter(e => e.fallbackTriggered).length,
    uniqueInsightHashes: new Set(entries.map(e => e.insightHash)).size,
    uniqueActionHashes: new Set(entries.map(e => e.actionHash)).size,
    scoreSpread: entries.length > 0
      ? Math.max(...entries.map(e => e.displayedScore || 0)) - Math.min(...entries.map(e => e.displayedScore || 0))
      : 0,
  };

  console.log(`🔍 [SCORE TRACE] ═══════════════════════════════════════════`);
  console.log(`🔍 [SCORE TRACE] Run ${runId} completed:`, summary);
  console.log(`🔍 [SCORE TRACE] ═══════════════════════════════════════════`);
  console.log(`🔍 [SCORE TRACE] Full trace available at: window.__copyzapScoreTrace`);
  console.log(`🔍 [SCORE TRACE] Filter by run: window.__copyzapScoreTrace.filter(e => e.runId === '${runId}')`);

  // POST-FIX VALIDATION: verify scoring is truly separated after bug fixes
  logPostFixValidation(runId, entries);
}

export interface VersionSubscores {
  audienceToneAlignment: number;
  clarity: number;
  persuasion: number;
  emotion: number;
  differentiation: number;
  trust: number;
  cta: number;
  seo: number;
  humanAuthenticity: number;
  overMarketingPenalty: number;
  brandFit: number;
}

export type ScoreDimension = keyof VersionSubscores;

/**
 * Evidence anchors — verbatim excerpts from the content justifying each subscore.
 * "(none)" = no relevant excerpt exists.
 * "(invalid-evidence)" = LLM invented text not found in the content.
 * "(not-scored)" = dimension was not evaluated (seoActive=false).
 */
export interface VersionEvidence {
  audienceToneAlignment: string;
  persuasion: string;
  trust: string;
  cta: string;
  seo: string;
  humanAuthenticity?: string;
  overMarketingPenalty?: string;
  brandFit?: string;
}

/** Weighted scoring config used when seoActive=true (weights sum to 1.0) */
const WEIGHTS: Record<ScoreDimension, number> = {
  audienceToneAlignment: 0.22,
  clarity:               0.12,
  persuasion:            0.12,
  emotion:               0.12,
  differentiation:       0.09,
  trust:                 0.09,
  cta:                   0.08,
  seo:                   0.00,
  humanAuthenticity:     0.06,
  overMarketingPenalty:  0.05,
  brandFit:              0.05,
};

/** Core dimensions always used in finalScore */
const CORE_DIMS: ScoreDimension[] = [
  'audienceToneAlignment', 'clarity', 'persuasion', 'emotion',
  'differentiation', 'trust', 'cta', 'humanAuthenticity', 'overMarketingPenalty', 'brandFit'
];
/** Full dimension set when SEO is active */
const ALL_DIMS: ScoreDimension[] = [
  'audienceToneAlignment', 'clarity', 'persuasion', 'emotion',
  'differentiation', 'trust', 'cta', 'seo', 'humanAuthenticity', 'overMarketingPenalty', 'brandFit'
];

/**
 * Use-case base weights (must sum to 1.0 across active dims, seo always 0 for non-SEO pages).
 * audienceToneAlignment is always significant — minimum 0.18 across all use cases.
 */
const USE_CASE_WEIGHTS: Record<string, Record<ScoreDimension, number>> = {
  landing_page:        { audienceToneAlignment: .22, clarity: .14, persuasion: .20, emotion: .15, differentiation: .10, trust: .09, cta: .10, seo: 0 },
  sales_page:          { audienceToneAlignment: .22, clarity: .13, persuasion: .20, emotion: .15, differentiation: .09, trust: .11, cta: .10, seo: 0 },
  email:               { audienceToneAlignment: .25, clarity: .16, persuasion: .15, emotion: .18, differentiation: .07, trust: .12, cta: .07, seo: 0 },
  linkedin:            { audienceToneAlignment: .25, clarity: .15, persuasion: .15, emotion: .17, differentiation: .09, trust: .13, cta: .06, seo: 0 },
  paid_ad:             { audienceToneAlignment: .20, clarity: .13, persuasion: .22, emotion: .16, differentiation: .11, trust: .07, cta: .11, seo: 0 },
  seo_page:            { audienceToneAlignment: .18, clarity: .13, persuasion: .14, emotion: .10, differentiation: .09, trust: .11, cta: .07, seo: .18 },
  product_description: { audienceToneAlignment: .22, clarity: .17, persuasion: .17, emotion: .12, differentiation: .12, trust: .12, cta: .08, seo: 0 },
  general:             { audienceToneAlignment: .25, clarity: .15, persuasion: .15, emotion: .15, differentiation: .10, trust: .10, cta: .10, seo: 0 },
};

/** Tone modifier deltas applied on top of base weights before renormalization */
const TONE_MODIFIERS: Partial<Record<string, Partial<Record<ScoreDimension, number>>>> = {
  funny:        { emotion: .04, audienceToneAlignment: .03, clarity: -.03, persuasion: -.04 },
  professional: { clarity: .03, trust: .03, audienceToneAlignment: -.02, emotion: -.04 },
  premium:      { audienceToneAlignment: .03, differentiation: .02, cta: -.02, persuasion: -.03 },
  aggressive:   { persuasion: .03, cta: .03, audienceToneAlignment: -.03, trust: -.03 },
  minimalist:   { clarity: .04, trust: .02, emotion: -.04, persuasion: -.02 },
  emotional:    { emotion: .05, audienceToneAlignment: .02, clarity: -.04, persuasion: -.03 },
  bold:         { persuasion: .03, differentiation: .02, trust: -.03, clarity: -.02 },
};

/**
 * Compute per-dimension weights for the given scoringContext.
 * Returns a Record<ScoreDimension, number> where values sum to 1.0 across active dims.
 * When seoActive=false, seo weight is 0 and remaining weights are renormalized.
 */
function computeWeightsForContext(
  useCaseKey?: string,
  toneKey?: string,
  seoActive?: boolean
): Record<ScoreDimension, number> {
  const base = USE_CASE_WEIGHTS[useCaseKey ?? 'general'] ?? USE_CASE_WEIGHTS.general;
  const w: Record<ScoreDimension, number> = { ...base };

  const modifier = TONE_MODIFIERS[toneKey ?? ''];
  if (modifier) {
    for (const dim of (Object.keys(modifier) as ScoreDimension[])) {
      w[dim] = (w[dim] ?? 0) + (modifier[dim] ?? 0);
    }
  }

  if (!seoActive) {
    w.seo = 0;
  }

  const activeDims: ScoreDimension[] = seoActive ? ALL_DIMS : CORE_DIMS;
  const total = activeDims.reduce((sum, d) => sum + Math.max(0, w[d] ?? 0), 0);
  if (total > 0) {
    for (const d of activeDims) {
      w[d] = Math.max(0, w[d] ?? 0) / total;
    }
  }

  return w;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true only when at least one non-empty keyword string exists.
 */
export function hasValidKeywords(keywords: string[]): boolean {
  return Array.isArray(keywords) && keywords.some(k => typeof k === 'string' && k.trim().length > 0);
}

/**
 * Build a stable, sorted, normalized signature for cache keying.
 * Returns "none" when no valid keywords are provided.
 */
export function buildKeywordsSignature(keywords: string[]): string {
  if (!hasValidKeywords(keywords)) return 'none';
  return keywords
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0)
    .sort()
    .join('|');
}

/**
 * SCORING FIX: preserve internal precision for ranking stability
 * Round a precise score for display purposes only.
 * Internal ranking should use the precise score value.
 *
 * Example:
 * - Internal score: 78.45 → Display: 78
 * - Internal score: 78.67 → Display: 79
 * - Ranking uses 78.45 vs 78.67 (precise), display shows 78 vs 79
 */
export function displayScore(score: number): number {
  return Math.round(score);
}

/**
 * SCORING FIX: expose score composition for user trust
 * Generate human-readable breakdown label showing how the final score was constructed.
 *
 * Examples:
 * - baseFinalScore=79, adjustment=3 → "79 base +3 AI refinement"
 * - baseFinalScore=82, adjustment=-2 → "82 base -2 AI refinement"
 * - baseFinalScore=85, adjustment=0 → "85 base (no adjustment)"
 */
export function generateScoreBreakdownLabel(baseFinalScore: number, adjustment: number): string {
  const baseRounded = Math.round(baseFinalScore);

  if (adjustment === 0) {
    return `${baseRounded} base (no adjustment)`;
  }

  const sign = adjustment > 0 ? '+' : '';
  return `${baseRounded} base ${sign}${adjustment} AI refinement`;
}

/**
 * SCORING FIX: expose score composition for user trust
 * Generate brief explanation of the score composition.
 *
 * Examples:
 * - adjustment=0 → "Pure heuristic score (no adjustment)"
 * - adjustment in [-2, 2] → "Heuristic score with minor AI refinement"
 * - adjustment in [-5, 5] → "Heuristic score with moderate AI refinement"
 * - adjustment > 5 or < -5 → "Adjusted for tone and strategic clarity"
 */
export function generateScoreDetailShort(adjustment: number, adjustmentReason?: string): string {
  if (adjustment === 0) {
    return 'Pure heuristic score (no adjustment)';
  }

  const absAdjustment = Math.abs(adjustment);

  if (absAdjustment <= 2) {
    return 'Heuristic score with minor AI refinement';
  }

  if (absAdjustment <= 5) {
    return 'Heuristic score with moderate AI refinement';
  }

  // For larger adjustments, try to use the reason if available
  if (adjustmentReason) {
    // Extract key phrases from adjustment reason for a short summary
    const reasonLower = adjustmentReason.toLowerCase();
    if (reasonLower.includes('tone') || reasonLower.includes('clarity')) {
      return 'Adjusted for tone and strategic clarity';
    }
    if (reasonLower.includes('persuasion') || reasonLower.includes('conversion')) {
      return 'Adjusted for persuasive impact';
    }
    if (reasonLower.includes('trust') || reasonLower.includes('credibility')) {
      return 'Adjusted for trust and credibility';
    }
  }

  return 'Heuristic score with significant AI refinement';
}

/**
 * @deprecated This function uses legacy winner explanation logic and is no longer used in the application.
 * Use generateUnifiedComparison() from unifiedComparison.ts instead, which uses comparative scoring
 * with more contextual winner explanations.
 *
 * Legacy winner explanation compares absolute scores without understanding the competitive context,
 * producing less insightful explanations than comparative scoring's relative advantage analysis.
 *
 * This function is only kept for backward compatibility and will be removed in a future release.
 *
 * SCORING FIX: explain ranking decision for user trust
 * Generate winner explanation by comparing winner vs runner-up.
 *
 * Analyzes actual score deltas to determine why the winner ranked highest.
 * Returns both a human-readable explanation and structured factor data.
 */
export function generateWinnerExplanation(
  winner: VersionScoreResult,
  runnerUp: VersionScoreResult | null
): { explanation: string; factors: WinnerFactors } {
  // DEPRECATION WARNING: Alert developers this function should not be used
  console.warn(
    '⚠️ generateWinnerExplanation() is deprecated and should not be used. ' +
    'Use generateUnifiedComparison() from unifiedComparison.ts instead. ' +
    'This function will be removed in a future release.'
  );

  // If no runner-up (only one version), provide a simple explanation
  if (!runnerUp) {
    return {
      explanation: `This version scored ${Math.round(winner.finalScore)} with balanced performance across all dimensions.`,
      factors: {
        conversionAdvantage: 0,
        trustAdvantage: 0,
        riskAdvantage: 'N/A',
        adjustmentImpact: winner.adjustment,
        primaryReason: 'only version evaluated',
      },
    };
  }

  // Calculate deltas
  const deltaFinalScore = winner.finalScore - runnerUp.finalScore;
  const deltaConversion = winner.conversionScore - runnerUp.conversionScore;
  const deltaTrust = winner.trustScore - runnerUp.trustScore;
  const deltaAdjustment = winner.adjustment - runnerUp.adjustment;

  // Determine risk advantage
  const riskLevels: Record<RiskLevel, number> = { Low: 3, Medium: 2, High: 1 };
  const winnerRiskValue = riskLevels[winner.riskLevel];
  const runnerUpRiskValue = riskLevels[runnerUp.riskLevel];

  let riskAdvantage: string;
  if (winnerRiskValue > runnerUpRiskValue) {
    riskAdvantage = 'lower risk';
  } else if (winnerRiskValue < runnerUpRiskValue) {
    riskAdvantage = 'higher risk';
  } else {
    riskAdvantage = 'same risk';
  }

  // Determine primary reason for winning
  let primaryReason: string;
  const absConversion = Math.abs(deltaConversion);
  const absTrust = Math.abs(deltaTrust);
  const absAdjustment = Math.abs(deltaAdjustment);

  // Find the biggest differentiator
  if (absAdjustment >= 5 && absAdjustment > absConversion && absAdjustment > absTrust) {
    primaryReason = deltaAdjustment > 0 ? 'stronger AI refinement' : 'less negative adjustment';
  } else if (absConversion > absTrust && absConversion >= 3) {
    primaryReason = 'stronger conversion potential';
  } else if (absTrust >= 3) {
    primaryReason = 'higher trust signals';
  } else if (riskAdvantage === 'lower risk') {
    primaryReason = 'lower risk level';
  } else if (deltaFinalScore > 0) {
    primaryReason = 'better overall balance';
  } else {
    primaryReason = 'tie-breaker advantage';
  }

  // Generate explanation
  let explanation: string;

  if (deltaFinalScore <= 0.5) {
    // Very close scores - tie-breaker scenario
    explanation = `This version ranks highest by a narrow margin (${deltaFinalScore.toFixed(1)} points), winning on tie-breaker criteria. Both versions show similar overall quality.`;
  } else if (absAdjustment >= 5) {
    // AI adjustment was a major factor
    const adjustmentText = deltaAdjustment > 0
      ? `a ${Math.abs(deltaAdjustment).toFixed(0)}-point AI refinement boost`
      : `${Math.abs(deltaAdjustment).toFixed(0)} fewer penalty points`;

    if (deltaConversion < -3) {
      explanation = `This version ranks highest due to ${adjustmentText}. While another version had ${Math.abs(deltaConversion).toFixed(0)} points higher conversion, this version performed better in tone, clarity, and persuasive structure.`;
    } else if (deltaTrust < -3) {
      explanation = `This version ranks highest due to ${adjustmentText}. While another version had ${Math.abs(deltaTrust).toFixed(0)} points higher trust signals, this version excelled in overall persuasive quality.`;
    } else {
      explanation = `This version ranks highest due to stronger overall balance and ${adjustmentText}. It outperforms alternatives in tone, clarity, and strategic positioning.`;
    }
  } else if (deltaConversion >= 5) {
    // Conversion was the key differentiator
    explanation = `This version ranks highest with ${deltaConversion.toFixed(0)} points stronger conversion potential. It includes clearer CTAs, action-oriented language, and more compelling business outcomes.`;
  } else if (deltaTrust >= 5) {
    // Trust was the key differentiator
    explanation = `This version ranks highest with ${deltaTrust.toFixed(0)} points higher trust signals. It demonstrates greater credibility through evidence, specificity, and authentic positioning.`;
  } else if (riskAdvantage === 'lower risk') {
    // Risk level difference
    explanation = `This version ranks highest due to ${riskAdvantage} (${winner.riskLevel} vs ${runnerUp.riskLevel}) and better overall balance across conversion and trust dimensions.`;
  } else {
    // Balanced advantage
    const factors: string[] = [];
    if (deltaConversion > 2) factors.push(`conversion (+${deltaConversion.toFixed(0)})`);
    if (deltaTrust > 2) factors.push(`trust (+${deltaTrust.toFixed(0)})`);
    if (deltaAdjustment > 2) factors.push(`AI refinement (+${deltaAdjustment})`);

    if (factors.length > 0) {
      explanation = `This version ranks highest due to stronger overall balance with advantages in ${factors.join(', ')}.`;
    } else {
      explanation = `This version ranks highest due to better overall balance and superior performance across multiple dimensions.`;
    }
  }

  return {
    explanation,
    factors: {
      conversionAdvantage: Math.round(deltaConversion * 10) / 10,
      trustAdvantage: Math.round(deltaTrust * 10) / 10,
      riskAdvantage,
      adjustmentImpact: winner.adjustment,
      primaryReason,
    },
  };
}

/**
 * Compute finalScore deterministically using heuristic scores with tie-breaker refinement.
 * SCORING FIX: deterministic final score (no LLM) with tie-breaker for differentiation
 *
 * Uses:
 * - Conversion score (0-100) from text analysis - PRIMARY (50% weight)
 * - Trust score (0-100) from text analysis - PRIMARY (30% weight)
 * - Risk level (Low/Medium/High) from text analysis - PRIMARY (20% weight)
 * - Subscores (clarity, persuasion, audienceToneAlignment, emotion) - TIE-BREAKER (10% total)
 *
 * Formula:
 * 1. Calculate core score from heuristics (90% weight):
 *    - Risk penalty: Low → 0, Medium → 10, High → 25
 *    - baseScoreCore = 0.5 * conversionScore + 0.3 * trustScore + 0.2 * (100 - riskPenalty)
 *
 * 2. Add tie-breaker from subscores (10% weight):
 *    - tieBreaker = 0.05 * clarity + 0.05 * persuasion + 0.025 * audienceToneAlignment + 0.025 * emotion
 *
 * 3. Final score:
 *    - baseFinalScore = baseScoreCore * 0.9 + tieBreaker
 *
 * SCORING FIX: preserve internal precision for ranking stability
 * Returns high-precision number (not rounded) for accurate ranking.
 *
 * EXAMPLE - Score Differentiation (preventing collapse):
 *
 * Before (with early rounding):
 * Version A: Conv=75, Trust=70, Risk=Low → 0.5*75 + 0.3*70 + 0.2*100 = 78.5 → 79
 * Version B: Conv=76, Trust=69, Risk=Low → 0.5*76 + 0.3*69 + 0.2*100 = 78.7 → 79
 * Result: Both get score 79 (collapsed, indistinguishable)
 *
 * After (with tie-breaker and precision):
 * Version A:
 *   - Core: 78.5
 *   - Subscores: clarity=82, persuasion=80, audienceTone=75, emotion=78
 *   - Tie-breaker: 0.05*82 + 0.05*80 + 0.025*75 + 0.025*78 = 11.975
 *   - Final: 78.5 * 0.9 + 11.975 = 82.625 → 82.62 (precise)
 *   - Display: 83
 *
 * Version B:
 *   - Core: 78.7
 *   - Subscores: clarity=85, persuasion=83, audienceTone=78, emotion=80
 *   - Tie-breaker: 0.05*85 + 0.05*83 + 0.025*78 + 0.025*80 = 12.35
 *   - Final: 78.7 * 0.9 + 12.35 = 83.18 (precise)
 *   - Display: 83
 *
 * Result: Version B scores 83.18 vs Version A's 82.62 (differentiated for ranking)
 * Both display as 83, but internal ranking correctly identifies B as winner.
 */
function computeFinalScore(
  contentText: string,
  subscores: VersionSubscores,
  seoActive: boolean,
  contextWeights?: Record<ScoreDimension, number>
): number {
  // SCORING FIX: deterministic final score (no LLM)
  // Calculate heuristic scores from content text
  const conversionScore = estimateConversionDisplayScore(contentText);
  const trustScore = estimateTrustDisplayScore(contentText);
  const riskLevel = estimateRiskDisplayLevel(contentText);

  // Map risk level to penalty
  const riskPenalty = riskLevel === 'High' ? 25 : riskLevel === 'Medium' ? 10 : 0;

  // Calculate core score using deterministic formula (90% weight)
  const baseScoreCore =
    0.5 * conversionScore +
    0.3 * trustScore +
    0.2 * (100 - riskPenalty);

  // SCORING FIX: deterministic tie-breaker to prevent score collapse
  // Use LLM subscores for fine-grained differentiation (10% total weight)
  // Includes new positioning-aware dimensions: humanAuthenticity, overMarketingPenalty, brandFit
  // overMarketingPenalty: lower score = more hype = penalty (subtract from tiebreaker)
  // humanAuthenticity and brandFit: direct positive contributions
  const humanAuth = subscores.humanAuthenticity ?? 50;
  const overMktPenalty = subscores.overMarketingPenalty ?? 80; // default to mostly-clean
  const brandFit = subscores.brandFit ?? 50;

  // overMarketingPenalty: invert so hype lowers the tie-breaker
  // Weight: 0.015 each for humanAuthenticity and brandFit, 0.01 for overMarketing inverted
  const tieBreaker =
    0.03 * (subscores.clarity ?? 50) +
    0.03 * (subscores.persuasion ?? 50) +
    0.015 * (subscores.audienceToneAlignment ?? 50) +
    0.01 * (subscores.emotion ?? 50) +
    0.01 * humanAuth +
    0.01 * overMktPenalty +   // penalty score: low = bad, high = clean — contributes positively when clean
    0.01 * brandFit;

  // Combine: 90% heuristic core + 10% subscore tie-breaker
  const baseFinalScore = baseScoreCore * 0.9 + tieBreaker;

  // SCORING FIX: preserve internal precision for ranking stability
  // Return high-precision value (2 decimals), don't round yet
  // Rounding happens only at final display stage
  return Math.round(baseFinalScore * 100) / 100;
}

/**
 * SCORING FIX: bounded LLM adjustment (±10 max)
 *
 * Allows LLM to refine the deterministic base score with a bounded adjustment.
 * The LLM cannot replace or override the base score, only adjust it slightly.
 *
 * @param contentText - The content being scored
 * @param baseFinalScore - The deterministic base score
 * @param conversionScore - Heuristic conversion score
 * @param trustScore - Heuristic trust score
 * @param riskLevel - Heuristic risk level
 * @param currentUser - User making the request
 * @param sessionId - Session ID for token tracking
 * @returns Object with adjustment (-10 to +10) and reason
 */
async function getLLMScoreAdjustment(
  contentText: string,
  baseFinalScore: number,
  conversionScore: number,
  trustScore: number,
  riskLevel: RiskLevel,
  currentUser?: User,
  sessionId?: string
): Promise<{ adjustment: number; reason: string }> {
  const prompt = `You are evaluating a pre-scored marketing copy.

Base scores (calculated by deterministic heuristics):
- Conversion Score: ${conversionScore}/100
- Trust Score: ${trustScore}/100
- Risk Level: ${riskLevel}
- Base Final Score: ${baseFinalScore}/100

Content:
"""
${contentText}
"""

Your task: You may adjust the FINAL SCORE by a maximum of ±10 points.

STRICT RULES:
1. Do NOT rescore from scratch
2. Do NOT ignore the base score
3. Only adjust if there is a clear, objective reason
4. Prefer small adjustments (±1 to ±5)
5. Use full range (±6 to ±10) only with strong justification
6. Consider:
   - Nuanced tone/voice quality not captured by heuristics
   - Strategic positioning strength
   - Subtleties in emotional resonance
   - Context-appropriate sophistication
   - Memorability or distinctive phrasing

POSITIVE ADJUSTMENTS (+1 to +10) if:
- Copy has exceptional strategic clarity
- Voice/tone is particularly well-calibrated for the audience
- Contains memorable, distinctive phrasing
- Shows sophisticated persuasion techniques

NEGATIVE ADJUSTMENTS (-1 to -10) if:
- Copy feels generic despite good heuristic scores
- Tone misalignment not captured by risk/trust
- Critical strategic weakness (poor positioning, unclear value prop)
- Lacks differentiation or personality

Return ONLY valid JSON (no markdown, no code blocks):
{
  "adjustment": <number between -10 and +10>,
  "reason": "<concise explanation in 10-15 words>"
}`;

  try {
    const response = await makeApiRequestWithFallback(
      SCORING_MODEL,
      [{ role: 'user', content: prompt }],
      0.3,
      300
    );

    if (currentUser?.id && sessionId) {
      await trackTokenUsage(
        currentUser.id,
        response.usage?.total_tokens || 0,
        SCORING_MODEL,
        'score-adjustment',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(response.usage)
      );
    }

    const cleanedContent = cleanJsonResponse(response.choices[0]?.message?.content || '');
    const parsed = JSON.parse(cleanedContent);

    // Validate and bound the adjustment
    let adjustment = typeof parsed.adjustment === 'number' ? parsed.adjustment : 0;
    adjustment = Math.max(-10, Math.min(10, Math.round(adjustment)));

    const reason = typeof parsed.reason === 'string' && parsed.reason.trim().length > 0
      ? parsed.reason.trim().substring(0, 150)
      : 'No specific reason provided';

    debugCompare.log('[getLLMScoreAdjustment] adjustment:', adjustment, 'reason:', reason);

    return { adjustment, reason };
  } catch (error) {
    debugCompare.log('[getLLMScoreAdjustment] Failed, using no adjustment:', error);
    return { adjustment: 0, reason: 'Adjustment unavailable (LLM error)' };
  }
}

function sanitizeEvidence(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return '(none)';
  return value.trim().substring(0, 120);
}

function isEvidenceInContent(evidence: string, content: string): boolean {
  if (
    evidence === '(none)' ||
    evidence === '(invalid-evidence)' ||
    evidence === '(not-scored)'
  ) return true;
  return content.toLowerCase().includes(evidence.toLowerCase());
}

function findKeywordsInContent(keywords: string[], content: string): string[] {
  const lower = content.toLowerCase();
  return keywords.filter(kw => kw.trim().length > 0 && lower.includes(kw.trim().toLowerCase()));
}

function keywordInHeading(keywords: string[], content: string): boolean {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    const isHeading =
      /^#{1,3}\s/.test(trimmed) ||
      /^<h[1-3][^>]*>/i.test(trimmed) ||
      (trimmed.length > 0 && trimmed.length <= 80 && !trimmed.includes('.'));
    if (!isHeading) continue;
    const lower = trimmed.toLowerCase();
    for (const kw of keywords) {
      if (kw.trim().length > 0 && lower.includes(kw.trim().toLowerCase())) return true;
    }
  }
  return false;
}

type EvidenceValidity = 'valid' | 'none' | 'invalid' | 'not-scored';

function getEvidenceValidity(evidence: string, content: string): EvidenceValidity {
  if (evidence === '(not-scored)') return 'not-scored';
  if (evidence === '(none)') return 'none';
  if (evidence === '(invalid-evidence)') return 'invalid';
  return isEvidenceInContent(evidence, content) ? 'valid' : 'invalid';
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface VersionScoreResult {
  versionId: string;
  optionLabel: string;
  finalScore: number; // Adjusted final score (baseFinalScore + adjustment)
  baseFinalScore: number; // Deterministic score before LLM adjustment
  adjustment: number; // LLM adjustment (-10 to +10)
  adjustmentReason?: string; // Explanation for adjustment
  // SCORING FIX: expose score composition for user trust
  scoreBreakdownLabel: string; // e.g., "79 base +3 AI refinement" or "85 base (no adjustment)"
  scoreDetailShort?: string; // e.g., "Heuristic score with minor AI refinement"
  isAdjusted: boolean; // true if adjustment !== 0
  // SCORING FIX: explain ranking decision for user trust
  conversionScore: number; // Display-only conversion score (0-100)
  trustScore: number; // Display-only trust score (0-100)
  riskLevel: RiskLevel; // Display-only risk level
  subscores: VersionSubscores;
  weakestDimension: ScoreDimension;
  weakestReason: string;
  bestUseCase: string;
  insight: string;
  action: string;
  evidence: VersionEvidence;
  scoringVersion: string;
  evaluatedAt?: string;
  errorMessage?: string;
  modelUsed?: string;
  seoActive: boolean;
  activeDimensions: string[];
  dimensionCount: number;
  keywordsProvided: number;
  matchedKeywords?: string[];
}

export interface PriorityAction {
  title: string;
  reason: string;
}

export interface FinalRecommendation {
  winnerId: string;
  why: string;
  nextSteps: [string, string, string];
}

// SCORING FIX: explain ranking decision for user trust
export interface WinnerFactors {
  conversionAdvantage: number; // Delta in conversion score vs runner-up
  trustAdvantage: number; // Delta in trust score vs runner-up
  riskAdvantage: string; // Risk level comparison (e.g., "lower risk", "same risk")
  adjustmentImpact: number; // How much AI adjustment contributed to win
  primaryReason: string; // Main reason for winning (e.g., "better balance", "stronger conversion")
}

export interface WinnerBreakdown {
  coreStrength: string; // Main reason it wins (1 sentence)
  whatItDoesBetter: string[]; // 2-3 specific advantages
  tradeoffs: string[]; // 0-2 minor weaknesses
}

export interface DecisionLayer {
  recommendedVersionId: string;
  recommendedLabel: string;
  recommendedUseCase: string;
  publishRecommendation: string;
  alternativeChoiceNote: string;
  nextBestVersionId?: string;
  nextBestLabel?: string;
  nextImprovementAction: string;
}

export interface ComparisonResult {
  scoringVersion: string;
  scoredAt?: string;
  winnerVersionId: string;
  scoringContext?: ScoringContext;
  priorityActions: PriorityAction[];
  finalRecommendation?: FinalRecommendation & {
    whyOthersLose?: string[]; // Why non-winners didn't win
  };
  // SCORING FIX: explain ranking decision for user trust
  winnerExplanation?: string; // Clear explanation of why winner ranked highest
  winnerFactors?: WinnerFactors; // Structured data about winner advantages
  winnerBreakdown?: WinnerBreakdown; // Enhanced winner explanation (comparative engine only)
  decisionLayer?: DecisionLayer; // Practical recommendation for users (comparative engine only)
  rows: Array<{
    versionId: string;
    optionLabel: string;
    finalScore: number;
    deltaVsBest: number;
    improvementPct: number | null;
    bestUseCase: string;
    insight: string;
    action: string;
    isWinner: boolean;
    seoActive: boolean;
    activeDimensions: string[];
    dimensionCount: number;
    keywordsProvided: number;
    matchedKeywords?: string[];
    evaluatedAt?: string;
    decisionSummary?: string;
    decisionReason?: string;
    // SCORING FIX: expose score composition for user trust
    baseFinalScore?: number; // Deterministic score before LLM adjustment
    adjustment?: number; // LLM adjustment (-10 to +10)
    adjustmentReason?: string; // Explanation for adjustment
    scoreBreakdownLabel?: string; // e.g., "79 base +3 AI refinement"
    scoreDetailShort?: string; // e.g., "Heuristic score with minor AI refinement"
    isAdjusted?: boolean; // true if adjustment !== 0
    // DIAGNOSTIC: new positioning-aware subscores for UI display (optional for backward compat)
    humanAuthenticity?: number; // 0-100: How natural the copy reads
    overMarketingPenalty?: number; // 0-100: How clean vs hype-heavy
    brandFit?: number; // 0-100: Alignment with inferred positioning
    // Editor review checklist: figurative language, unverified metrics, tone intensity
    verificationFlags?: string[];
  }>;
}

const SCORING_VERSION = 'comp-v6.7.3';

const EXPLANATION_FALLBACK = 'Clear structure and intent, but lacks a strong differentiator.';
const INSIGHT_FALLBACK = 'Positioning is understandable, but not yet distinctive.';
const ACTION_FALLBACK = 'Strengthen the core value proposition and clarify the CTA.';

const DECISION_SUMMARY_FALLBACK = 'Wins because it combines clear structure with a decisive CTA, while others lack the differentiation that reduces conversion friction';
const DECISION_REASON_FALLBACK = 'Outperforms alternatives by combining clear structure and strong CTA, while others fall short on differentiation';
const FINAL_RECOMMENDATION_FALLBACK: FinalRecommendation = {
  winnerId: '',
  why: 'Top version balances clarity, structure, and trust most effectively',
  nextSteps: [
    'Strengthen differentiation with one unique claim',
    'Clarify the primary CTA',
    'Add one proof point to increase credibility',
  ],
};

/**
 * comp-v6.6.2: Exported repair function for the decision layer fields.
 * Ensures decisionSummary, decisionReason, and finalRecommendation are always
 * present on a ComparisonResult regardless of how it was loaded (fresh, cached, session-restored).
 * Mutates result in-place and returns it for convenience.
 */
export function repairDecisionLayerFields(result: ComparisonResult): ComparisonResult {
  if (!result) return result;

  for (const row of result.rows ?? []) {
    if (!row.decisionSummary || row.decisionSummary.trim().length === 0) {
      row.decisionSummary = DECISION_SUMMARY_FALLBACK;
    }
    if (!row.decisionReason || row.decisionReason.trim().length === 0) {
      row.decisionReason = DECISION_REASON_FALLBACK;
    }
  }

  if (!result.finalRecommendation) {
    const winnerRow = (result.rows ?? []).find(r => r.isWinner);
    result.finalRecommendation = {
      ...FINAL_RECOMMENDATION_FALLBACK,
      winnerId: winnerRow?.versionId ?? result.winnerVersionId ?? '',
    };
  } else {
    const rec = result.finalRecommendation;
    if (!rec.winnerId) rec.winnerId = result.winnerVersionId ?? '';
    if (!rec.why?.trim()) rec.why = FINAL_RECOMMENDATION_FALLBACK.why;
    if (!Array.isArray(rec.nextSteps) || rec.nextSteps.length !== 3) {
      rec.nextSteps = [...FINAL_RECOMMENDATION_FALLBACK.nextSteps];
    }
  }

  return result;
}

const FALLBACK_EVIDENCE: VersionEvidence = {
  audienceToneAlignment: '(none)',
  persuasion: '(none)',
  trust: '(none)',
  cta: '(none)',
  seo: '(none)',
};

// ── Core scoring function ─────────────────────────────────────────────────────

/**
 * @deprecated This function uses legacy single-version scoring and is no longer used in the application.
 * Use generateUnifiedComparison() from unifiedComparison.ts instead, which uses comparative scoring.
 *
 * Legacy single-version scoring evaluates each version independently without context of other versions,
 * which produces less accurate and less consistent results than comparative scoring.
 *
 * This function is only kept for backward compatibility and will be removed in a future release.
 *
 * Score a single version independently.
 * @param keywords - Optional keyword phrases; presence activates SEO dimension in finalScore.
 */
export async function scoreVersion(
  version: GeneratedContentItem,
  versionLabel: string,
  model: Model = 'gpt-4o', // Parameter kept for backward compatibility but overridden
  userId?: string,
  sessionId?: string,
  keywords: string[] = [],
  contextWeights?: Record<ScoreDimension, number>,
  __traceRunId?: string, // SCORE TRACE AUDIT: internal param for run tracking
  __traceIndex?: number // SCORE TRACE AUDIT: internal param for version index
): Promise<VersionScoreResult> {
  // DEPRECATION WARNING: Alert developers this function should not be used
  console.warn(
    '⚠️ scoreVersion() is deprecated and should not be used. ' +
    'Use generateUnifiedComparison() from unifiedComparison.ts instead. ' +
    'This function will be removed in a future release.'
  );

  // Use user's selected model, fallback to SCORING_MODEL only if not provided
  const actualModel = model || SCORING_MODEL;

  let contentText = '';
  if (typeof version.content === 'string') {
    contentText = version.content;
  } else if (Array.isArray(version.content)) {
    contentText = version.content.join('\n');
  } else if (typeof version.content === 'object' && version.content !== null) {
    contentText = JSON.stringify(version.content, null, 2);
  }

  // SCORE TRACE AUDIT: initialize trace entry for this variant
  const traceEntry: VariantTraceEntry = {
    runId: __traceRunId || 'unknown',
    versionId: version.id,
    optionLabel: versionLabel,
    index: __traceIndex ?? -1,
    contentHash: simpleHash(contentText),
    enteredScoreVersion: true,
    llmCallAttempted: false,
    rawModelUsed: actualModel,
    parseSuccess: false,
    repairRetryAttempted: false,
    repairRetrySuccess: false,
    fallbackTriggered: false,
    fallbackReason: null,
    conversionScore: null,
    trustScore: null,
    riskLevel: null,
    baseScoreCore: null,
    tieBreaker: null,
    baseFinalScore: null,
    adjustment: null,
    adjustedFinalScore: null,
    displayedScore: null,
    narrativeGenerated: false,
    insightHash: 'not-set',
    actionHash: 'not-set',
    timestamp: Date.now(),
  };

  const seoActive = hasValidKeywords(keywords);
  const keywordsProvided = keywords.filter(k => k.trim().length > 0).length;
  const keywordList = keywords.map(k => `"${k.trim()}"`).join(', ');
  const activeDimensions = seoActive ? [...ALL_DIMS] : [...CORE_DIMS];
  const dimensionCount = activeDimensions.length;
  const kwSig = buildKeywordsSignature(keywords);

  debugCompare.log(`[scoreVersion] "${versionLabel}" — seoActive=${seoActive}, keywords=${keywordsProvided}, sig="${kwSig}"`);
  if (!seoActive) {
    debugCompare.log(`[scoreVersion] SEO disabled — no valid keywords provided. activeDimensions=${activeDimensions.join(',')}`);
  } else {
    debugCompare.log(`[scoreVersion] SEO enabled — ${keywordsProvided} keyword(s) provided. activeDimensions=${activeDimensions.join(',')}`);
  }

  const seoRubric = seoActive
    ? `**SEO (0–100) — keyword-based rubric (keywords provided: ${keywordList}):**
1. Does the copy use at least one of these keyword phrases naturally? (yes/no)
2. Do any headings/titles contain a keyword? (yes/no)
3. Is search intent aligned for the target audience? (0–100)
4. Low repetition / fluff? (yes/no)
Scoring rules (apply strictly):
- No keyword phrase found anywhere in copy → SEO MUST be ≤ 65
- 1 keyword found naturally → SEO 70–80
- 2+ keywords found + one appears in a heading/title → SEO 80–90
- evidence.seo MUST quote the exact 6–12 word context containing the keyword.
- If no keyword evidence can be quoted, set evidence.seo = "(none)".`
    : `**SEO: NOT SCORED (no keywords provided)**
- Set evidence.seo = "(not-scored)"
- You may still assign an seo subscore for reference but it will NOT affect finalScore.`;

  // BOLT PATCH v1.1: Content sanitization (prevent overflow)
  const sanitizedContent = contentText.slice(0, 6000);
  if (contentText.length > 6000) {
    debugCompare.log(`[scoreVersion] "${versionLabel}" — content truncated from ${contentText.length} to 6000 chars`);
  }

  const prompt = `You are an expert copy strategist performing a rigorous, context-sensitive evaluation of marketing copy.

Your goal: reward copy that is genuinely persuasive and appropriate FOR ITS AUDIENCE — not copy that merely mimics aggressive American direct-response patterns.

VOICE STYLE: ${version.persona || 'Not specified'}

---
COPY TO EVALUATE:
${sanitizedContent}
---

STEP 1 — SILENT POSITIONING INFERENCE (internal only, never shown to user):
Before scoring, silently analyze the audience description, tone, industry signals, key message, and the copy itself to infer the brand positioning category. This inference determines how scoring dimensions are weighted. Do NOT include this inference in your JSON response.

Positioning inference rules:
- If the audience includes professional businesses, agencies, consultants, architects, accountants, lawyers, or high-ticket service providers, AND the tone is professional, elegant, sophisticated, or friendly → infer "Premium B2B Service". Apply HEAVY weight to trust, credibility, humanAuthenticity, brandFit, and audienceToneAlignment. Apply STRONG PENALTY for urgency pressure, hype language, aggressive CTAs, and over-marketing. overMarketingPenalty has 2× weight impact on final score.
- If the audience is general consumers, e-commerce shoppers, or the copy promotes a physical product, subscription, or short buying-cycle offer → infer "Direct Response". Weight conversion triggers, urgency, CTA strength, and persuasion more heavily. overMarketingPenalty has reduced weight (0.5×).
- If the audience is startups, tech companies, SaaS users, developers, or growth-stage businesses → infer "SaaS / Growth". Balance conversion and trust equally. All three new dimensions (humanAuthenticity, overMarketingPenalty, brandFit) apply at standard weight.
- If no clear signal exists → infer "Balanced". Apply equal weights across all dimensions.

CRITICAL EVALUATION PRINCIPLES:
- Do NOT treat American direct-response mechanics (urgency, bold claims, binary CTAs) as universally superior.
- Persuasion is culturally dependent. Trust-building, warmth, and narrative can outperform urgency in many markets.
- A well-executed voice that is inappropriate for the audience must score LOWER than a simpler but well-aligned voice.
- Fabricated precision (e.g., "85% increase") without any source basis is a credibility RISK, not a signal.

TOP-TIER SCORE GATE (85+):
A finalScore above 85 is ONLY permitted when ALL FOUR of the following are true:
1. Clear and specific positioning angle — not a generic service description
2. Non-generic phrasing — no interchangeable copy blocks that could apply to any competitor
3. Intentional voice or perspective — not neutral AI tone
4. Memorability — at least one phrase, idea, or structure that stands out
If ANY of these are missing → cap the overall scoring at 84. Apply this gate strictly.

AUDIENCE–TONE DOMINANCE RULE:
If audienceToneAlignment < 75 → this version CANNOT be top-ranked, regardless of other dimension scores.
When audienceToneAlignment < 75, set a mental flag: this version is disqualified from winning even if finalScore arithmetic would otherwise put it first. Reflect this in bestUseCase and weakestReason.

SCORING RUBRICS (apply strictly):

${seoRubric}

**Audience–Tone Alignment (0–100) — HIGHEST WEIGHT DIMENSION:**
This evaluates whether the copy's voice, register, emotional style, metaphors, and persuasion approach fit:
- The implied or stated target audience
- The language detected in the copy (Spanish, English, etc.)
- Cultural expectations for that language/market
- The stated tone/persona (e.g., friendly, professional, premium)

LANGUAGE REGISTER RULES (Spanish specifically — HARD ENFORCEMENT):
- If copy is in Spanish AND tone is "friendly" or "casual":
  → "tú" forms are REQUIRED. Predominant use of "usted" is a CLEAR TONE MISMATCH.
  → HARD PENALTY: Cap audienceToneAlignment at 70–72. Also apply a minor trust penalty (−4 pts) for perceived formality distance.
  → weakestReason MUST contain "REGISTER_ERROR".
- If copy is in Spanish AND tone is "professional" or "formal":
  → "usted" is appropriate. Blanket "tú" reduces credibility — evaluate and penalize if pervasive.
- For any language: imported idioms, cultural metaphors, or persuasion patterns foreign to the market → penalize audienceToneAlignment.

Score guidelines:
- ≥ 85: Voice, register, emotional style, and metaphors all naturally fit the audience and culture. All top-tier gate criteria met.
- 70–84: Mostly aligned, minor inconsistencies or register slippage.
- 55–69: Noticeable mismatch — tone feels off, imported style detectable. Cannot be top-ranked.
- < 55: Significant mismatch — could alienate or confuse the target audience. Cannot be top-ranked.

**Clarity (0–100):**
Evaluates readability, structure, and scanability (combines clarity + readability):
- Penalize stacked dense paragraphs with no headings → max 78
- Penalize weak hierarchy (no lead/body separation) → max 76
- Penalize run-on sentences and excessive verbosity → max 75 for hero copy
- Reward scannable structure, short sentences, clear focus.

**Persuasion Structure (0–100):**
Evaluates the logical and emotional architecture of the persuasion (replaces old "marketing"):
- Score ≥ 90 ONLY if ALL THREE present: clear unique mechanism + strong hook + explicit reason to act now
- Only 2 of 3 → 80–89. Only 1 of 3 → 70–79. Generic benefit list → 65–74.
- NOTE: Aggressive framing alone does not increase this score if it alienates the audience.

**Emotional Resonance (0–100):**
Empathy triggers, vivid language, emotional connection with audience.
- Culturally authentic emotional appeals score higher than imported emotional patterns.

**Differentiation (0–100) — STRICT EVALUATION:**
How clearly the copy establishes STRATEGIC distinction for this offer/brand/product.

IMPORTANT: Differentiation requires strategic distinction — a unique angle, perspective, or framing that is specific to this offer.
It does NOT mean:
- Synonym substitution (using different words for the same generic claim)
- Tone shifts (friendlier or bolder wording of the same commodity message)
- Formatting differences (same content reorganized)
Generic but well-written copy MUST NOT score high in differentiation.

- ≥ 85: Unique mechanism or angle clearly stated, unmistakably distinct, cannot be applied to a generic competitor
- 70–84: Real differentiation present but could be stronger or more specific
- 55–69: Surface-level distinction only — mostly generic, interchangeable with competitors
- < 55: Pure commodity framing, no discernible strategic differentiation

**Trust & Credibility (0–100) — HARD ENFORCEMENT:**
Classify every numerical or statistical claim in the copy into one of three types:

TYPE 1 — SOURCE-BASED CLAIMS (present in user's input, testimonials, cited research):
→ Reward as credibility signals (+8–15 pts). These substantiate persuasion.

TYPE 2 — GENERAL CLAIMS (non-specific: "industry-leading", "best-in-class", "proven"):
→ Neutral impact. Neither reward nor penalize.

TYPE 3 — UNSOURCED CLAIMS (specific numerical figures NOT present in the original context):
Examples: "85% of users", "40% faster", "3x results", "saves 5 hours per week", "trusted by 10,000 companies"
→ STRONG PENALTY. These are fabricated or hallucinated precision.
→ HARD CAP: 1 unsourced claim → max Trust score 72. 2+ unsourced claims → max Trust score 62.
→ REQUIRED: weakestReason MUST explicitly state "unsupported or fabricated numerical claim" when this applies.
→ This penalty applies to the Trust subscore regardless of how compelling the copy otherwise sounds.

- Authentic social proof, concrete examples, transparent positioning (without invented stats) → reward.
- Copy that relies entirely on invented statistics for credibility should score below 65 in Trust.

**CTA Effectiveness (0–100):**
- No explicit action → MUST be ≤ 70
- Vague CTA ("Learn more") → 71–79
- Specific action-oriented CTA ("Start your free 14-day trial") → 80–95
- Specific + contextually appropriate + benefit-attached → 90–100

VOICE APPROPRIATENESS ASSESSMENT:
If a voice/persona was applied, evaluate:
1. Accuracy of voice replication
2. Whether that voice is appropriate for the industry, audience, and cultural context.
A well-executed but contextually inappropriate voice should lower the audienceToneAlignment score significantly.

**Human Authenticity (0–100):**
Does this copy sound naturally written by an experienced strategist, or does it sound like AI trying too hard to sell?
- 90–100: Reads as written by a real, thoughtful person. Distinctive voice. Emotionally intelligent. Believable claims with no robotic patterns.
- 75–89: Mostly natural with minor AI-pattern phrases ("elevate your brand", "unlock your potential", "take your business to the next level").
- 60–74: Noticeable AI persuasion patterns. Formulaic structure. Forced enthusiasm.
- 45–59: Heavily robotic. Over-structured. Lists every benefit as if checking boxes.
- Below 45: Reads as clearly machine-generated. Hollow value propositions. Meaningless superlatives.
REWARD: clarity, emotional intelligence, believable specific claims, natural transitions, honest self-awareness.
PENALIZE: robotic persuasion patterns, forced enthusiasm, excessive superlatives, AI filler phrases ("comprehensive solution", "seamlessly integrates", "game-changing results").

**Over-Marketing Penalty (0–100, where LOWER is worse — 100 means clean):**
Evaluate the level of hype, exaggeration, and over-optimization present in the copy.
- 90–100: No hype detected. Claims are grounded, specific, and proportionate. CTAs are direct without pressure.
- 75–89: Minor hype elements. One or two urgency triggers or marketing clichés present but not dominant.
- 60–74: Moderate hype. Multiple urgency triggers, at least one exaggerated promise, generic clichés.
- 45–59: Heavy hype. "While you sleep", "24/7 working for you", "never-before-seen results", fake scarcity, excessive urgency.
- Below 45: Saturated with hype. Every sentence contains an exaggerated promise or pressure trigger. Trust-destroying.
PENALIZE: "while you sleep", "24/7 working for you", "massive results", "explode your revenue", fake urgency ("limited spots", "only today"), fake specificity without attribution, excessive exclamation marks, superlatives stacked on superlatives.
NOTE: For Premium B2B and trust-sensitive audiences, this dimension has elevated weight in the final score. A score below 60 here signals serious brand risk.

**Brand Fit (0–100):**
Does the tone, sophistication level, and emotional register match what the inferred positioning requires?
This is scored against the INFERRED positioning category, not in isolation.
- 90–100: Perfect alignment. A Premium B2B service has copy that is credible, measured, and sophisticated. A Direct Response product has copy that is energetic and action-driving. The copy feels native to the brand category.
- 75–89: Strong fit with minor mismatches (e.g., one aggressive phrase in premium context, or one overly formal line in a consumer context).
- 60–74: Partial fit. The copy would work in a different category better than this one. Some register inconsistencies.
- 45–59: Poor fit. A premium brand with aggressive direct-response copy, or a consumer brand with cold corporate language.
- Below 45: Fundamental mismatch. The copy actively works against the positioning signals present in the audience and tone.
CRITICAL: A premium brand copy using direct-response patterns (fake urgency, pressure language, "buy now" energy) MUST score low here even if individual persuasion dimensions are technically present.

RISK FLAG ASSESSMENT — MANDATORY VISIBILITY:
The following risk flags MUST appear explicitly in weakestReason or bestUseCase when applicable.
Do NOT bury penalties inside scores only — they must be surfaced in text.

- "TONE_MISMATCH": Register or style inappropriate for audience
- "CULTURAL_IMPORT": Persuasion style imported from a different market/culture
- "REGISTER_ERROR": Spanish tú/usted used incorrectly for stated tone — MUST appear when Spanish register rule is triggered
- "UNSOURCED_CLAIM": Specific numerical claim without apparent source — MUST appear alongside the phrase "unsupported or fabricated numerical claim"
- "AGGRESSIVE_FRAMING": Urgency/pressure tactics that may alienate this audience

STRICT ENFORCEMENT RULES (comp-v5.2 patch — ABSOLUTE PRIORITY):

RULE A — UNSOURCED CLAIM LANGUAGE BAN:
If a version contains unsourced numerical claims (Type 3), you are STRICTLY FORBIDDEN from describing those claims using any of these words:
→ "credibility", "strength", "proof", "evidence"
The ONLY permitted description is: "unsupported or fabricated numerical claim"
If your evaluation would praise such claims as strengthening the copy — STOP and revise. That evaluation is invalid.

RULE B — CONTRADICTION RESOLUTION:
When a version contains BOTH strong persuasion mechanics AND a violation (UNSOURCED_CLAIM, TONE_MISMATCH, REGISTER_ERROR):
→ The violation MUST dominate the narrative in weakestReason and bestUseCase
→ Structural strengths may be acknowledged but CANNOT neutralize or override the violation
→ weakestReason MUST explain why the violation reduces real-world effectiveness

RULE C — AUDIENCE–TONE OVERRIDE (HARD):
If audienceToneAlignment < 75:
→ weakestReason and bestUseCase MUST describe this version as "misaligned for the target audience"
→ FORBIDDEN language: "ideal", "best", "top-performing", "excellent fit", "most effective" for this version
→ This rule holds even if other dimensions score highly

RULE D — LANGUAGE PRIORITY ORDER:
Evaluation narrative must follow this priority:
1. FIRST: Trust & Credibility violations (unsourced claims, fabricated stats)
2. SECOND: Audience–Tone Alignment failures
3. THIRD: All other dimension strengths and weaknesses
If (1) or (2) fail, the overall tone of the evaluation MUST reflect that failure first. Do not lead with positives.

RULE E — NO FALSE POSITIVES:
You MUST NOT:
- Praise fabricated numerical specificity as making copy more compelling
- Reward aggressive framing when the stated tone is "friendly" or "casual"
- Interpret intensity or confidence as effectiveness when it conflicts with audience expectations

RULE F — INTERNAL VALIDATION BEFORE RESPONDING:
Before generating your final JSON, verify:
1. No UNSOURCED_CLAIM is described with the words "credibility", "strength", "proof", or "evidence"
2. No tone mismatch is left unmentioned or treated as neutral
3. No version with audienceToneAlignment < 75 is positioned as a top choice
If any of these checks fail → revise the evaluation before outputting.

PRECISION RULES (comp-v5.3 patch — STACKED ON TOP OF v5.2):

RULE G — ANTI-SOFT-PRAISE:
When any violation is present (UNSOURCED_CLAIM, TONE_MISMATCH, REGISTER_ERROR, CULTURAL_MISFIT, AGGRESSIVE_FRAMING):
→ FORBIDDEN softening phrases: "although", "however it still", "despite this, it remains strong", "while it has some issues"
→ REQUIRED decisive phrasing — use one of:
   "This significantly reduces effectiveness because…"
   "This undermines trust because…"
   "This limits real-world performance because…"
Violations must be stated as real penalties, not minor caveats.

RULE H — BEST USE CASE RESTRICTION:
If audienceToneAlignment < 75:
→ bestUseCase MUST be framed as: "only appropriate in limited or specific contexts" or "may be usable if [narrow condition], but not recommended broadly"
→ FORBIDDEN in bestUseCase: "best choice", "strong option", "effective for", "ideal for", "recommended for"

RULE I — DIFFERENTIATION HARD CEILING:
If a version uses generic structures, common agency phrasing, or copy that could apply to any competitor:
→ differentiation score MUST be capped between 70–75
The following do NOT count as differentiation and MUST NOT raise this score:
→ synonyms, tone variation, formatting changes, adding urgency/intensity
The following DO count:
→ unique strategic angle, distinctive framing, memorable brand positioning

RULE J — MEMORY TEST FOR TOP-TIER GATE:
Before allowing any version to score above 85 overall, internally ask:
→ "Would a senior copywriter remember at least one specific line or idea from this version tomorrow?"
If the answer is NO:
→ Cap finalScore at 84
→ Do NOT allow top-tier classification
This enforces memorability, sharp positioning, and non-generic thinking.

RULE K — STRUCTURE IS NOT EXCELLENCE:
If a version is clean, logical, and well-written BUT lacks distinctiveness, emotional sharpness, or positioning clarity:
→ Score MUST remain in the 78–84 range
→ It MUST NOT compete with versions that have genuine differentiation
Strong structure alone (clarity, CTA, flow) is NOT sufficient for high scores.

RULE L — FINAL RANKING HONESTY CHECK:
Before finalizing the overall comparison ranking, verify the top-ranked version has:
1. Best audience-tone alignment among candidates
2. No active trust violations
3. Meaningful differentiation (scored above 75)
If the top candidate fails any of these → re-evaluate ranking. The cleanest version is NOT automatically the best.

CALIBRATION RULES (comp-v5.4 patch — STACKED ON TOP OF v5.3):

RULE M — BASELINE COMPRESSION FIX:
Generic, undifferentiated, structurally standard copy MUST be scored in a compressed band:
→ differentiation ≤ 70 AND no clear unique angle → final score ceiling of 74
→ clean but generic structure with no positioning → 72–75 range only
Do NOT reward safety, correctness, or clarity as excellence.
Generic but competent copy must not exceed the mid-70s.

RULE N — STRUCTURAL REWARD AMPLIFICATION:
If a version clearly improves multiple structural dimensions over the original (problem framing, benefit articulation, strategic positioning, CTA strength, flow, message hierarchy), it MUST score at least +4 to +8 points higher than the original baseline — UNLESS severe violations exist (trust destruction, complete audience misalignment).
This scoring uplift is REQUIRED, not optional.

RULE O — PENALTY INTERACTION REBALANCE:
Violations (UNSOURCED_CLAIM, TONE_MISMATCH) MUST cap the ceiling, not collapse the total score.
A structurally strong version with a minor violation MUST still outscore a structurally weak version without violations — unless the violation directly destroys trust or usability.
→ Strong copy + minor fabricated claim → competitive, but ceiling capped
→ Weak copy + no violations → cannot rank above structurally stronger versions
Penalty logic: ceiling reduction only, not score collapse.

RULE P — AUDIENCE–TONE ALIGNMENT NUMERIC ENFORCEMENT:
If audienceToneAlignment < 75:
→ Final score MUST NOT exceed 78
→ This version CANNOT rank above any version with audienceToneAlignment ≥ 80
Audience misalignment affects ranking numerically, not only narratively.
This rule is a hard numeric gate, not just a narrative instruction.

RULE Q — TOP TIER RECALIBRATION (REDUCE OVER-CONSERVATISM):
To enter the 82–84 range: strong structure + clear positioning + clean tone is sufficient. Differentiation does not need to be extreme — it must be real and intentional.
To enter 85+: v5.3 Memory Test Gate still applies and differentiation must be genuine.
Do NOT suppress strong, well-crafted, audience-aligned copy into 78–81 unnecessarily.
Over-conservative scoring is as much of a calibration failure as over-inflation.

RULE R — SCORE SPREAD INTEGRITY:
Enforce meaningful numeric separation between qualitatively different versions:
→ Weak vs. strong → minimum 5–8 point spread
→ Original (generic) vs. clear structural improvement → minimum +4 delta
Do NOT cluster scores within 2–3 points when qualitative differences are significant.
Score compression is a calibration error. Spread must reflect actual quality distance.

FINAL CALIBRATION RULES (comp-v5.5 patch — STACKED ON TOP OF v5.4):

RULE S — IMPROVEMENT DELTA ENFORCEMENT:
The engine MUST compare each generated version against the Original.
If a version clearly improves 3 or more of the following dimensions vs. the original:
→ problem framing, clarity, benefit articulation, CTA specificity, positioning, flow / readability
THEN: it MUST score at least +5 above the Original — unless a major violation makes it unusable.
This comparison delta is mandatory and must be reflected numerically.

RULE T — BASELINE ANCHOR:
If a version is generic, undifferentiated, mostly a standard services list, or lacks a clear strategic angle:
→ finalScore MUST fall in the 72–75 range — even if it is clean and professional.
Do NOT allow safe, generic competence to drift into the high 70s.
The baseline anchor for undifferentiated copy is 72–75. Period.

RULE U — REWARD STRENGTH BOOST:
If a version demonstrates: clear narrative progression, strong strategic framing, specific and intentional CTA, meaningful differentiation, and strong audience fit:
→ Apply a positive calibration boost of +3 to +5 before final caps are enforced.
Purpose: reward real improvement as decisively as violations are penalized.
Strong copy must feel rewarded — not merely "not penalized."

RULE V — NO INVERSION FROM MINOR PENALTIES:
Minor penalties MUST NOT invert an obvious quality hierarchy.
If Version A is clearly stronger than Version B in structure, clarity, CTA, and positioning:
→ Version A MUST still outrank Version B, unless trust is critically broken OR tone makes it clearly unusable.
Minor violations reduce the ceiling. They do not flip rankings between clearly unequal versions.

RULE W — SCORE SPREAD INTEGRITY (v5.5 enforcement layer):
When qualitative differences are obvious, score differences must also be obvious.
Required spread guidance:
→ Weak original vs. strong generated = 5–8 points minimum
→ Generic vs. differentiated = 4–6 points minimum
→ Strong vs. exceptional = 2–4 points minimum
Avoid compressed clusters when real quality differences are significant.
Spread is not optional — it is a calibration output requirement.

RULE X — ENGLISH CALIBRATION GUARD:
For English-language evaluations:
Do NOT become overly conservative simply because the copy is more professional or less emotional.
English B2B copy may still score highly when it is: strategically framed, clearly differentiated, benefit-led, and audience-appropriate.
Do NOT suppress strong English outputs into the high-70s unless genericity or violations clearly justify it.
English professional copy with real differentiation and strong structure belongs in the 81–84 range.

TOP-TIER SEPARATION RULES (comp-v5.6 patch — STACKED ON TOP OF v5.5):

RULE Y — SINGLE WINNER BIAS (NO DEFAULT TIES AT THE TOP):
Only ONE version should occupy the top position (85+ range) unless two versions are truly indistinguishable in structure, clarity, positioning, differentiation, and CTA effectiveness.
If one version shows even a slight edge in any of these dimensions → it MUST score at least +1 higher.
Do NOT allow default ties at 85+. Ties indicate a failure to discriminate.

RULE Z — DISTINCTIVENESS THRESHOLD FOR 85+:
To score 85 or higher, a version must demonstrate at least TWO of the following:
→ a clearly memorable line or phrase (passes recall test)
→ a distinctive positioning angle (not reusable by generic competitors)
→ unusually strong narrative flow (feels guided, not listed)
→ a strategic framing that elevates the offer beyond services into outcomes or transformation
If fewer than two of these are present → hard cap at 84.

RULE AA — TOP-TIER DIFFERENTIATION SPLIT:
Within the 85–90 range, scores must be assigned intentionally with this band structure:
→ 85–86: strong, professional, well-structured — real differentiation present
→ 87–88: clearly distinctive and strategically framed — identifiable angle
→ 89–90: exceptional, memorable, and hard to replicate — stands alone
The engine must NOT cluster everything at 86. Each notch requires earning the separation.

RULE AB — MICRO-SEPARATION ENFORCEMENT:
When comparing the top 2–3 versions, if differences are subtle but real:
→ better CTA clarity = +1
→ stronger strategic positioning = +1
→ cleaner narrative flow = +1
These micro-advantages MUST be reflected numerically. Do NOT collapse high-quality versions into identical scores when real differences are detectable.

RULE AC — NO AUTO-PROMOTION TO 85+:
A version reaching high scores due only to clarity, completeness, or professionalism must remain in the 82–84 range unless it also shows real distinction or memorability.
Excellence does not equal polish alone. 85+ requires earning it through distinctiveness — not just clean execution.

RULE AD — VOICE DISCIPLINE AT TOP TIER:
Stylized or persona-driven outputs (e.g., direct-response, bold/aggressive, Hormozi-style) can only reach 85+ if:
→ tone aligns with target audience
→ intensity does not reduce trust
→ clarity is preserved throughout
If stylistic choices introduce audience friction or trust risk → cap at 82–84 even if engaging.

AUDIENCE FIT CALIBRATION RULES (comp-v5.7 patch — STACKED ON TOP OF v5.6):

RULE AE — FIT SEVERITY → SCORE TRANSLATION:
Audience fit assessments must translate into proportional score adjustments:
→ Perfect / strong fit = no penalty
→ Minor mismatch = -1
→ Noticeable mismatch = -2
→ Strong mismatch = -3 to -4
→ "Only appropriate in niche / limited contexts" = -4 to -6
The score must numerically reflect the severity stated in the Best Use Case.

RULE AF — NO FIT/SCORE CONTRADICTION:
If the Best Use Case contains phrases like "only appropriate in limited contexts", "niche use only", or "not recommended broadly":
→ the score MUST fall below clearly well-aligned alternatives
→ do NOT allow high scores (84+) with restrictive applicability statements

RULE AG — FIT PENALTY CAP INTERACTION:
Fit penalties reduce ceiling, not structural validity:
→ A structurally strong but misaligned version may remain competitive mid-tier
→ BUT cannot sit within 1–2 points of a well-aligned winner
→ Enforce minimum 3–5 point gap vs. the well-aligned top version

RULE AH — BALANCED VOICE PENALTY:
Do not over-penalize isolated tone issues:
→ One problematic phrase = minor deduction (-1)
→ Repeated or consistent tone misalignment = escalate penalty (-2 to -4)
Evaluate overall tone consistency — not single-line artifacts.

RULE AI — FIT VS STRENGTH RESOLUTION:
When a version is structurally strong but audience-misaligned:
→ preserve relative ranking among mid-tier options (it still beats weak copy)
→ lower its absolute position vs. well-aligned top-tier versions
Fit affects position, not just score.

EXPLANATION ALIGNMENT RULES (comp-v5.8 patch — STACKED ON TOP OF v5.7):

RULE AJ — EXPLANATION SEVERITY ALIGNMENT:
If a version receives a fit penalty of -3 or greater, the Best Use Case must explicitly reflect limitation or conditional suitability. Language must include a qualifier such as "best suited for...", "less appropriate for...", "only effective in...", or "not ideal for..." depending on severity.

RULE AK — NO POSITIVE-ONLY PHRASING UNDER PENALTY:
If fit penalty ≥ -3, Best Use Case cannot read as universally positive. At least one constraint, trade-off, or audience limitation must be stated.

RULE AL — SEVERITY-LANGUAGE MAPPING:
→ Minor mismatch (-1): neutral phrasing allowed
→ Noticeable mismatch (-2): soft qualifier required ("works best when...")
→ Strong mismatch (-3 to -4): explicit limitation required ("less appropriate for...", "may not suit...")
→ Niche / limited (-4 to -6): restrictive phrasing required ("only appropriate in...", "not recommended broadly")

RULE AM — TONE CONSISTENCY ENFORCEMENT:
The tone of the Best Use Case must match the score position:
→ Versions scoring ≥85 must sound confident and broadly applicable
→ Versions scoring ≤83 with fit penalties must include visible caution or constraint language
→ Do not allow polished, positive phrasing to mask a meaningful numerical penalty

RULE AN — NO CONTRADICTION BETWEEN EXPLANATION AND SCORE:
A version described as "effective", "ideal", or "strong fit" cannot sit 3+ points below a clearly better, well-aligned version unless limitation language is also present. Score and explanation must feel consistent to an expert reader.

DECISIVENESS RULES (comp-v5.9 patch — STACKED ON TOP OF v5.8):

RULE AO — WINNER ENFORCEMENT (NO TIES AT THE TOP):
If two or more versions score within the 85+ range and are nearly equal, the system MUST select a single winner. Even a minor advantage in structure, clarity, CTA strength, narrative flow, or differentiation requires a +1 score separation. Top-tier ties are not allowed.

RULE AP — MICRO-ADVANTAGE SCORING:
Small but real qualitative differences (e.g., clearer CTA, tighter structure, stronger framing, better audience alignment) MUST translate into a +1 score difference. The system must actively look for distinguishing factors rather than defaulting to equal scores.

RULE AQ — ANTI-FLATTENING SAFEGUARD:
The system must avoid score compression at the top. When multiple strong versions exist, distribute scores across the 85–88 range according to real differences. Do not cluster top outputs at the same score.

RULE AR — DECISIVENESS OVER SAFETY:
When uncertainty exists between two strong versions, the system must choose the more strategically effective version rather than assigning equal scores. Scoring must reflect judgment, not neutrality.

RULE AS — WINNER JUSTIFICATION CONSISTENCY:
The version labeled as "Winner" must have the highest numerical score. If two versions are labeled equally strong, scoring must still reflect a clear ranking order.

EXPLANATION QUALITY RULES (comp-v6.0 patch):

RULE AT — NO GENERIC PRAISE LANGUAGE:
Terms like "strong", "effective", "compelling" must always be tied to a specific reason (e.g., "strong CTA clarity", "effective problem framing"). Unsupported praise is prohibited.

RULE AU — EVERY POSITIVE CLAIM MUST ANSWER "WHY":
If a version is rated highly, the explanation must reference concrete elements: structure, differentiation, CTA, narrative, or audience fit. "Why it works" is mandatory, not optional.

RULE AV — REPLACE VAGUE QUALIFIERS:
Phrases like "may not", "can feel", "might work" must be replaced with direct assessments: "is misaligned", "reduces clarity", "weakens positioning". Hedging is not permitted.

RULE AW — TRADE-OFFS MUST BE EXPLICIT:
If a score is below top-tier (≤84), the explanation must clearly state what is missing or limiting performance. Vague limitation language does not satisfy this requirement.

RULE AX — NO BALANCED NEUTRALITY:
Avoid "on one hand / on the other hand" framing. The system must take a position, not present options. Neutral phrasing is a calibration error.

RULE AY — COMPARATIVE CLARITY REQUIRED:
When multiple versions are close in score, the explanation must explicitly state why one ranks higher (e.g., "clearer CTA", "more differentiated positioning", "stronger narrative arc"). General comparison is not sufficient.

RULE AZ — TONE REFLECTS SCORE BAND:
85–90 → confident, assertive, strategic language
80–84 → positive but with visible, named limitation
≤79 → critical and diagnostic — identify specific failure modes
Tone must match score band. Mismatch between tone and score is prohibited.

INSIGHT LAYER RULES (comp-v6.5 patch — decisive sharpening):

RULE BA — Each version must include exactly one "insight" field (max 18 words, one sentence only).
Insight = single decisive takeaway. It must answer: "What is the ONE thing that matters most about this version?"
No multiple ideas. No summaries. No repetition of explanation. Exceeding 18 words is a formatting violation.

RULE BB — Insight must express the core strategic truth: what fundamentally makes or breaks this version.
It must NOT restate the explanation, the score, or repeat the weakest dimension label.
Non-removability test: if the Insight can be removed from the report without losing any information already in the explanation, it is invalid — regenerate it.

RULE BC — Insight must highlight tension, contrast, a positioning gap, or a fundamental strength or weakness.
Acceptable anchors: CTA conflict, credibility gap, differentiation absence, tone–audience mismatch, narrative structure, proof deficit.
It must compress, sharpen, and elevate — not summarize. If it reads like a polished version of the explanation, it fails.

RULE BD — Generic language is prohibited in Insight.
Forbidden phrases: "strong", "clear", "effective", "good", "well-structured", "engaging", "compelling" without specific grounding.
Insight must be precise and non-transferable — it must only be true for this specific version.

RULE BE — Insight must read like a decisive expert conclusion — something a senior strategist would say out loud.
It must be memorable and quotable: a sharp, specific judgment a reader would retain after closing the report.
Good examples: "High clarity, but lacks differentiation to justify premium positioning."
"Persuasive flow, but relies on claims without proof."
"Tone builds trust, but CTA fails to convert it into action."
Bad examples: "This version is strong and well structured." / "Good clarity and CTA." / Any summary of the explanation.

ACTION LAYER RULES (comp-v6.5 patch — impact enforcement):

RULE BF — Each version must include exactly one "action" field (max 18 words, one sentence only).
Action is the single highest-impact change the user can make right now.
Forbidden low-impact actions: "Improve clarity." / "Refine wording." / "Enhance engagement." / "Make it more compelling." / "Consider improving the CTA."
These phrases are invalid regardless of context. Replace with directional, outcome-tied specifics.

RULE BG — Action must be concrete and immediately implementable — no abstract advice.
It must describe a specific, executable change: what to add, remove, replace, or rewrite.
Required format: "[WHAT to change] → [WHY it improves performance]"
Example: "Replace generic CTA with a single outcome-driven CTA tied to a measurable result → eliminates CTA ambiguity and focuses conversion."
Example: "Add one quantified result (e.g., 40% reduction in X) to the hero section → builds credibility against unproven claims."

RULE BH — Action must focus on the single highest-impact improvement only.
Do not list multiple suggestions. Identify the one change that moves the needle most.

RULE BI — Action must be specific, not vague.
Acceptable: "Replace 'Contact Us' with 'Book a 30-minute strategy call'." / "Add one quantified result to hero section."
Forbidden: "Improve clarity." / "Make it more engaging." / "Consider improving the CTA."

RULE BJ — Action is one sentence only. Maximum 18 words. Exceeding 18 words is a formatting violation.

RULE BK — Action must align with and directly address the core issue identified in the Insight.
If Insight says "lacks proof", Action must say how to add proof. If Insight says "CTA fails", Action must specify the CTA fix.

ACTION DECISIVENESS RULES (comp-v6.5 patch — impact test layer):

RULE CN — Action impact test (mandatory self-check):
Before returning an action, the system must apply this test: "If only this one change is made to the copy, does conversion performance or audience trust improve significantly?"
If the answer is "no" or "marginally" → the action is too low-impact and must be rejected and replaced.

RULE CO — Action must target a specific named weakness.
The action must reference a concrete, named problem from the version: a weak CTA, missing proof, tone mismatch, generic positioning, structural gap.
Actions targeting unnamed or hypothetical weaknesses are invalid.

RULE CP — Actions must cover different dimensions.
If the three per-version actions all target the same dimension (e.g., all about CTA), the system must diversify — identify the next highest-impact improvement in a different dimension for versions 2 and 3.

RULE CQ — Priority Actions must not be generic cross-version summaries.
Each priority action must be directly traceable to a pattern observed across versions or a named limitation in the top-ranked version.
Ungrounded general advice ("improve SEO", "add more proof") without version-specific grounding is a formatting violation.

PRIORITY ACTIONS RULES (comp-v6.3 patch — cross-version layer):

RULE BL — A "priorityActions" field must be generated exactly once per output (not per version). It is a top-level field alongside all version results.

RULE BM — Priority Actions must synthesize patterns across ALL versions. Do not repeat individual per-version Actions verbatim. Identify shared weaknesses, recurring gaps, or the highest-leverage change for the top-ranked version.

RULE BN — Include exactly 3 priority actions. No more, no fewer. Fewer than 3 or more than 3 is a formatting violation.

RULE BO — Each priority must represent a high-impact improvement that either affects multiple versions OR directly targets the top-ranked version's limiting factor.

RULE BP — Priorities must be ordered by impact: most important improvement first, least important third.

RULE BQ — Each priority must include: (1) a short, clear action title (what to fix); (2) a short explanation (why it matters). Both fields are mandatory.

RULE BR — Each priority must be concrete and actionable. No abstract language. Priority titles and explanations must be as specific as individual version Actions.

FIT DOMINANCE RULES (comp-v6.4 patch):

RULE BS — FIT DOMINANCE OVERRIDE:
Audience fit is the primary ranking constraint. If a version has a strong audience or tone mismatch (audienceToneAlignment penalty ≥ 3 points below baseline), it CANNOT be ranked #1 regardless of how persuasive, structured, or differentiated it is. Rhetorical strength cannot overcome fundamental misalignment.

RULE BT — ENTERPRISE SAFETY CONSTRAINT:
For B2B, enterprise, or professional-services audiences, aggressive, abrasive, or hype-driven language triggers a mandatory minimum -3 penalty to audienceToneAlignment. This applies even if the copy scores well on persuasion, emotion, or CTA dimensions.

RULE BU — TONE INCOMPATIBILITY DETECTION:
The following phrase patterns must trigger a -3 to -5 penalty to audienceToneAlignment when the target audience is B2B, enterprise, or professional-services:
- "one throat to choke" or equivalent vendor-accountability idioms used to convey pressure
- "so damn" or similarly casual/aggressive intensifiers
- "going out of business" or existential-threat framing as urgency tactic
- Overloaded urgency phrases that imply desperation or manipulation
These phrases are incompatible with enterprise trust norms and must depress the version's score and ranking.

RULE BV — FIT OVERRIDES PERSUASION IN RANKING:
A version cannot rank above a well-aligned competitor on the strength of persuasion, emotion, or CTA scores alone. Audience fit (audienceToneAlignment) functions as a ranking gate — misaligned versions are ineligible for #1 rank when aligned alternatives exist.

RULE BW — WINNER ELIGIBILITY — FIT REQUIRED:
To be declared #1 (Winner), a version must satisfy both conditions simultaneously:
(1) It must be well-aligned with the stated or inferred audience.
(2) It must have no strong tone mismatch (audienceToneAlignment ≥ 72 for enterprise contexts).
A persuasively superior but misaligned version must be ranked below a less-persuasive but well-aligned version.

FIT DOMINANCE HARD LOCK (comp-v6.5):

RULE CF — TONE MISMATCH ≥ -2 SCORE CAP:
When a version has a tone mismatch penalty of ≥ -2 points applied to audienceToneAlignment, its finalScore MUST NOT exceed 83. This is a hard numeric ceiling, not a soft guideline. A persuasively strong but tone-misaligned version cannot breach the 83 ceiling.

RULE CG — TONE MISMATCH ≥ -3 SCORE CAP:
When a version has a tone mismatch penalty of ≥ -3 points applied to audienceToneAlignment, its finalScore MUST NOT exceed 81. This cap applies even when persuasion, emotion, differentiation, and CTA scores are high.

RULE CH — ENTERPRISE AGGRESSION MANDATORY PENALTY:
Copy that uses abrasive, aggressive, or pressure-driven phrasing for a B2B, enterprise, or professional-services audience triggers an automatic minimum -3 deduction to audienceToneAlignment. This deduction stacks with other tone penalties. It is non-negotiable and applies even if the aggression is intentional or stylistically coherent.

RULE CI — EDGY COPY RANKING CONSTRAINT:
"Edgy but strong" copy (high persuasion, high emotion, but tone misaligned) MUST rank below well-aligned alternatives that score comparably on other dimensions. No combination of persuasion + CTA + emotion scores can compensate for a sustained tone mismatch when aligned competitors exist. This rule is absolute for B2B/enterprise contexts.

RESPONSE FORMAT — CRITICAL JSON OUTPUT REQUIREMENTS:

IMPORTANT: You MUST return ONLY raw JSON. Do NOT include:
- Any explanatory text before or after the JSON
- Markdown code fences like \`\`\`json or \`\`\`
- The word "json" or "JSON" before the object
- Any prose, commentary, or notes

Return the JSON object directly, starting with { and ending with }. Nothing else.

{
  "subscores": {
    "audienceToneAlignment": <0-100 int>,
    "clarity": <0-100 int>,
    "persuasion": <0-100 int>,
    "emotion": <0-100 int>,
    "differentiation": <0-100 int>,
    "trust": <0-100 int>,
    "cta": <0-100 int>,
    "seo": <0-100 int>,
    "humanAuthenticity": <0-100 int>,
    "overMarketingPenalty": <0-100 int>,
    "brandFit": <0-100 int>
  },
  "evidence": {
    "audienceToneAlignment": "<6-12 word verbatim excerpt from copy that best represents tone/register fit, or (none)>",
    "persuasion": "<6-12 word verbatim excerpt from copy, or (none)>",
    "trust": "<6-12 word verbatim excerpt from copy that demonstrates credibility signal or lack thereof, or (none)>",
    "cta": "<6-12 word verbatim excerpt from copy, or (none)>",
    "seo": "${seoActive ? '<6-12 word verbatim excerpt containing keyword, or (none)>' : '(not-scored)'}",
    "humanAuthenticity": "<6-12 word verbatim excerpt that best illustrates authentic or robotic tone, or (none)>",
    "overMarketingPenalty": "<6-12 word verbatim excerpt of the most hype-heavy phrase detected, or (none)>",
    "brandFit": "<6-12 word verbatim excerpt that best illustrates brand fit or misfit, or (none)>"
  },
  "weakestDimension": "<one of: audienceToneAlignment|clarity|persuasion|emotion|differentiation|trust|cta${seoActive ? '|seo' : ''}|humanAuthenticity|overMarketingPenalty|brandFit>",
  "weakestReason": "<one to two sentences, max 200 chars. MUST include risk flag code if applicable. MUST include 'unsupported or fabricated numerical claim' if UNSOURCED_CLAIM applies. MUST include 'REGISTER_ERROR' if Spanish register rule triggered.>",
  "bestUseCase": "<one descriptive sentence — NOT a category label>",
  "insight": "<one decisive strategic sentence, max 18 words. Must express the ONE thing that matters most — tension, contrast, positioning gap, or fundamental strength/weakness. Non-removable, non-generic, quotable.>",
  "action": "<one concrete, specific sentence, max 18 words. Format: [WHAT to change] → [WHY it improves performance]. Must pass impact test. No generic advice. No vague language.>"
}

ABSOLUTE RULES:
- Do NOT cluster all subscores in a 2-point band — use the full range.
- evidence values MUST be verbatim substrings of the provided copy (except "(none)" and "(not-scored)").
- weakestDimension MUST match the numerically lowest subscore${!seoActive ? ' among the 10 dimensions' : ''}.
- Do NOT reward aggressive or urgency-heavy framing unless it is genuinely appropriate for the audience.
- Do NOT inflate trust scores for specific numerical claims that lack any source or attribution context.
- OVER-MARKETING RULE: If overMarketingPenalty < 60 AND the inferred positioning is Premium B2B Service, the finalScore composition MUST reflect a significant downward adjustment. Aggressive copy cannot win in trust-sensitive contexts.
- BRAND FIT RULE: If brandFit < 65, the copy is working against its own positioning. This is a serious quality failure — do NOT allow a high finalScore to mask a low brandFit in premium contexts.
- HUMAN AUTHENTICITY RULE: Copy that reads as AI-generated should not be rewarded with high humanAuthenticity scores regardless of structural quality. Authenticity and structural competence are separate things.
- NEW DIMENSIONS: humanAuthenticity, overMarketingPenalty, and brandFit MUST always be present as integers 0–100. NEVER omit them. NEVER return null.
- TOP-TIER GATE: If the copy does not meet all 4 criteria (specific positioning, non-generic phrasing, intentional voice, memorability), NO individual subscore should exceed 85 and the overall composition should reflect a cap near 84.
- ATA DOMINANCE: If audienceToneAlignment < 75, weakestReason and bestUseCase MUST note that this version cannot be top-ranked due to audience-tone misalignment. MUST use the phrase "misaligned for the target audience".
- UNSOURCED CLAIM VISIBILITY: If any Type 3 (unsourced) numerical claims are present, weakestReason MUST contain the phrase "unsupported or fabricated numerical claim". FORBIDDEN to use words "credibility", "strength", "proof", or "evidence" to describe these claims.
- REGISTER ERROR VISIBILITY: If Spanish register rules are violated, weakestReason MUST contain "REGISTER_ERROR".
- VIOLATION PRIORITY: When violations exist, they MUST lead the narrative. Structural positives cannot neutralize violations.
- ANTI-SOFT-PRAISE: When a violation is present, FORBIDDEN: "although", "however it still", "despite this, it remains strong". REQUIRED: decisive phrasing — "This significantly reduces effectiveness because…" / "This undermines trust because…" / "This limits real-world performance because…"
- DIFFERENTIATION CEILING: Generic structure, common agency phrasing, or universally applicable copy MUST cap differentiation at 70–75. Synonyms, tone variation, formatting, and added urgency do NOT qualify as differentiation.
- MEMORY TEST: Before scoring any version above 85 overall, verify a senior copywriter would remember at least one specific line tomorrow. If not → cap at 84.
- STRUCTURE ≠ EXCELLENCE: Clean, logical, well-written copy that lacks distinctiveness, emotional sharpness, or positioning clarity MUST stay 78–84. It cannot compete with genuinely differentiated versions.
- RANKING HONESTY: The top-ranked version MUST have best ATA, no trust violations, and differentiation > 75. The cleanest version is NOT automatically the winner.
- CALIBRATION v5.4: v5.4 rules override passive score compression — reward and penalty must be balanced, not penalty-dominant.
- BASELINE CAP: Generic copy with differentiation ≤ 70 and no unique angle MUST NOT exceed 74. Generic but competent = mid-70s ceiling.
- STRUCTURAL UPLIFT: If a version clearly improves multiple structural dimensions over the original, it MUST score +4 to +8 higher — this is required, not optional.
- PENALTY = CEILING CAP ONLY: A strong version with a minor violation still outscores a weak violation-free version. Penalties reduce the ceiling; they do not collapse the total.
- ATA NUMERIC GATE: audienceToneAlignment < 75 → hard cap at 78 final score. Cannot rank above any ATA ≥ 80 version. This is numeric, not only narrative.
- NO OVER-CONSERVATISM: Strong structure + clear positioning + clean tone = 82–84 range. Do not suppress well-crafted aligned copy into 78–81 without cause.
- SCORE SPREAD: Qualitatively different versions MUST show 5–8 point separation. Score compression of 2–3 points for significantly different quality is a calibration error.
- INTERNAL CHECK: Run RULES F, L, R, and S–X validation internally before finalizing output. Revise if any check fails.
- IMPROVEMENT DELTA: If a generated version clearly improves 3+ structural dimensions over the original, it MUST score at least +5 above the original — this is mandatory.
- BASELINE ANCHOR v5.5: Generic, undifferentiated, services-list copy must be anchored at 72–75. Safe competence must not drift into the high 70s.
- REWARD BOOST: Strong structure + narrative + differentiation + audience fit = apply +3 to +5 boost before caps. Reward improvement as decisively as violations are penalized.
- NO RANKING INVERSION: Minor penalties cannot flip the ranking when one version is clearly structurally stronger. Penalties cap ceiling; they do not collapse rankings.
- SCORE SPREAD v5.5: Weak original vs. strong generated = 5–8 pt minimum. Generic vs. differentiated = 4–6 pt minimum. Compression is a calibration error.
- ENGLISH GUARD: English B2B copy that is strategically framed, differentiated, benefit-led, and audience-appropriate belongs in the 81–84 range. Do not suppress it into the high 70s.
- SINGLE WINNER: Only one version should lead the top tier (85+) unless two versions are truly identical in all key dimensions. Even a slight edge must be reflected as +1.
- TOP-TIER GATE v5.6: Scores of 85+ require at least TWO of: memorable line, distinctive positioning, unusually strong narrative flow, strategic framing that elevates beyond services. Polish and completeness alone = 82–84 max.
- TOP-TIER BAND: 85–86 = strong + differentiated; 87–88 = clearly distinctive + strategic angle; 89–90 = exceptional + memorable + hard to replicate. Do not cluster at 86.
- MICRO-SEPARATION: Small but real advantages between top versions (better CTA, stronger positioning, cleaner flow) MUST each contribute +1 to the score. Do not collapse top versions into ties.
- NO AUTO-PROMOTION: Clarity + completeness + professionalism = 82–84, not 85+. Distinctiveness must be earned.
- VOICE DISCIPLINE: Stylized/persona copy reaches 85+ only if tone fits audience, trust is maintained, and clarity is preserved. Style that creates friction = cap at 82–84.
- INTERNAL CHECK v5.6: Run RULES F, L, R, S–X, and Y–AD validation internally before finalizing output. Revise if any check fails.
- AUDIENCE FIT SCORE TRANSLATION: Audience fit warnings must be reflected proportionally in score — minor mismatch = -1, noticeable = -2, strong = -3 to -4, niche/limited-use = -4 to -6.
- NO FIT/SCORE CONTRADICTION: Versions labeled as niche, limited-use, or not broadly applicable cannot score 84+ and cannot sit near top-tier scores. Fit contradiction is a calibration error.
- FIT SEPARATION: Fit penalties must create visible separation from well-aligned winners — minimum 3–5 point gap when a version has restricted applicability vs. a broadly aligned top version.
- BALANCED TONE EVALUATION: Tone evaluation must consider overall consistency, not isolated phrases. One problematic line = -1 only. Repeated misalignment = -2 to -4.
- INTERNAL CHECK v5.7: Run RULES F, L, R, S–AI validation internally before finalizing output. Revise if any check fails.
- EXPLANATION ALIGNMENT: Best Use Case language MUST reflect fit penalties when present. No universally positive phrasing allowed when fit penalty ≥ -3.
- EXPLANATION TONE BAND: Explanation tone MUST align with score band — top-tier (≥85) = confident and broad; mid-tier (≤83 with penalty) = caution or constraint language required.
- RESTRICTIVE APPLICABILITY: Restrictive applicability MUST be explicitly stated in Best Use Case for niche, misaligned, or limited-suitability outputs.
- NO EXPLANATION/SCORE CONTRADICTION: A version sounding "effective" or "ideal" cannot sit 3+ points below a well-aligned alternative unless limitation language is also present.
- INTERNAL CHECK v5.8: Run RULES F, L, R, S–AN validation internally before finalizing output. Revise if any check fails.
- TOP-TIER TIES PROHIBITED: Equal scores at 85+ are strictly forbidden. Even minor qualitative advantages must result in score separation.
- MICRO-ADVANTAGE MANDATORY: Every small but real qualitative difference between top-tier versions must translate into a +1 score difference. Do not default to equal scores.
- NO SCORE CLUSTERING AT THE TOP: Distribute top-tier scores across the 85–88 range per real differences. Conservative clustering is a calibration error.
- DECISIVE RANKING REQUIRED: When two strong versions compete, choose the more strategically effective one. Scoring reflects judgment, not neutrality.
- WINNER IS HIGHEST SCORER: The declared "Winner" must always be the single highest-scoring version. Labeling two versions as equally strong while assigning equal scores is not permitted.
- INTERNAL CHECK v5.9: Run RULES F, L, R, S–AS validation internally before finalizing output. Revise if any check fails.
- NO UNSUPPORTED PRAISE: Terms like "strong", "effective", "compelling" require a specific reason. Generic praise without grounding is prohibited (Rule AT).
- CONCRETE REASONING MANDATORY: Every evaluation must reference specific elements — CTA, structure, differentiation, narrative, or audience fit — when making positive claims (Rule AU).
- NO VAGUE OR HEDGING LANGUAGE: Replace "may not", "can feel", "might work" with direct assessments. Hedging is a calibration error (Rule AV).
- SUB-TOP SCORES REQUIRE EXPLICIT LIMITATION: Any version scoring ≤84 must name exactly what is missing or limiting performance (Rule AW).
- NO NEUTRAL OR BALANCED PHRASING: The system takes positions, not presents options. "On one hand / on the other hand" framing is prohibited (Rule AX).
- DECIDING FACTOR REQUIRED FOR CLOSE COMPARISONS: When versions are close, explanation must name the specific element that determines the ranking (Rule AY).
- TONE MATCHES SCORE BAND STRICTLY: 85–90 = confident/assertive; 80–84 = positive with named limitation; ≤79 = critical/diagnostic. Tone–score mismatch is prohibited (Rule AZ).
- EVERY VERSION MUST INCLUDE ONE INSIGHT LINE: The "insight" field is mandatory. Omitting it is a formatting error (Rule BA).
- INSIGHT IS ONE DECISIVE TAKEAWAY: Insight must answer "What is the ONE thing that matters most about this version?" No multiple ideas, no summaries, no repetition of explanation (Rule BA).
- INSIGHT MAX 18 WORDS: Insight is one sentence only. Exceeding 18 words is a formatting violation (Rule BA).
- INSIGHT NON-REMOVABILITY TEST: If the Insight can be removed from the report without losing information already in the explanation, it is invalid — regenerate (Rule BB).
- INSIGHT MUST BE NON-GENERIC AND NON-REPETITIVE: Insight must not restate the explanation or repeat generic praise. It must express a strategic truth unique to this version (Rule BB, BD).
- INSIGHT MUST COMPRESS, SHARPEN, ELEVATE: Insight must not summarize. If it reads like a polished version of the explanation, it fails (Rule BC).
- INSIGHT MUST EXPRESS A STRATEGIC CONCLUSION: Highlight tension, contrast, positioning gap, or fundamental strength/weakness. A summary is not an insight (Rule BC, BE).
- INSIGHT MUST BE MEMORABLE AND QUOTABLE: A senior strategist must be able to repeat it the next day. Generic phrasing ("good structure", "strong clarity") is forbidden (Rule BE).
- EVERY VERSION MUST INCLUDE ONE ACTION LINE: The "action" field is mandatory. Omitting it is a formatting error (Rule BF).
- FORBIDDEN LOW-IMPACT ACTIONS: "Improve clarity", "Refine wording", "Enhance engagement", "Make it more compelling", "Consider improving the CTA" are always invalid. Replace with directional, outcome-tied specifics (Rule BF).
- ACTION FORMAT REQUIRED: "[WHAT to change] → [WHY it improves performance]". Both components are mandatory (Rule BG).
- ACTION MUST BE CONCRETE AND SPECIFIC: Action must describe an executable change — what to add, remove, replace, or rewrite. Vague advice is a violation (Rule BG, BI).
- ACTION IMPACT TEST MANDATORY: Before returning, apply: "If only this change is made, does performance improve significantly?" If no → replace the action (Rule CN).
- ACTION MUST TARGET HIGHEST-IMPACT IMPROVEMENT ONLY: One change only — the most impactful. Multiple suggestions or abstract guidance is prohibited (Rule BH).
- ACTION MUST TARGET A NAMED WEAKNESS: Action must reference a concrete, named problem from the version (Rule CO).
- ACTION MUST ALIGN WITH INSIGHT: Action must directly address the core issue identified in the Insight. Misalignment between Insight and Action is a calibration error (Rule BK).
- ACTION MAX 18 WORDS: Action is one sentence only. Exceeding 18 words is a formatting violation (Rule BJ).
- PRIORITY ACTIONS MUST APPEAR EXACTLY ONCE: The "priorityActions" field is mandatory in the synthesis call. Omitting it is a formatting error (Rule BL).
- EXACTLY 3 PRIORITIES REQUIRED: Fewer than 3 or more than 3 priorities is a formatting violation (Rule BN).
- PRIORITIES MUST REFLECT CROSS-VERSION PATTERNS: Do not repeat individual per-version Actions. Synthesize shared weaknesses and recurring gaps (Rule BM).
- PRIORITIES MUST BE ORDERED BY IMPACT: Most important first, least important third (Rule BP).
- EACH PRIORITY MUST INCLUDE TITLE AND REASON: Both fields are mandatory (Rule BQ).
- MISALIGNED VERSION CANNOT WIN: A version with a strong audience or tone mismatch (audienceToneAlignment penalty ≥ 3 pts below baseline) is ineligible for #1 rank — even if it scores higher on persuasion, emotion, or CTA (Rule BS, BW).
- ENTERPRISE TONE VIOLATIONS REQUIRE MINIMUM -3 PENALTY: Aggressive, abrasive, or hype-driven language for B2B/enterprise audiences mandates a minimum -3 deduction to audienceToneAlignment. This is non-negotiable (Rule BT).
- TONE INCOMPATIBILITY PHRASES MUST BE PENALIZED: Phrases like "one throat to choke", "so damn", "going out of business" used as urgency tactics in enterprise copy must trigger -3 to -5 audienceToneAlignment penalty (Rule BU).
- FIT OVERRIDES PERSUASION IN FINAL RANKING: Persuasive or emotional strength cannot compensate for audience misalignment in ranking decisions. ATA is a ranking gate (Rule BV).
- TONE MISMATCH ≥ -2 HARD CAP: Any version with a tone mismatch penalty ≥ -2 points on audienceToneAlignment has a hard finalScore ceiling of 83. Exceeding this cap is a scoring error (Rule CF).
- TONE MISMATCH ≥ -3 HARD CAP: Any version with a tone mismatch penalty ≥ -3 points on audienceToneAlignment has a hard finalScore ceiling of 81. This overrides all other score boosts (Rule CG).
- ENTERPRISE AGGRESSION AUTO-PENALTY: Abrasive, aggressive, or pressure-driven phrasing for B2B/enterprise audiences triggers automatic minimum -3 to audienceToneAlignment. Non-negotiable and stacking (Rule CH).
- EDGY COPY MUST RANK BELOW ALIGNED COPY: High persuasion + high emotion + tone misalignment CANNOT beat well-aligned alternatives in enterprise/B2B contexts. No exceptions (Rule CI).
- MID-TIER SEPARATION REQUIRED: Scores in the 80–84 range must show explicit separation logic in explanation. Two closely scored versions in this band are not permitted without naming a deciding factor (Rule CJ).
- DECIDING FACTOR MANDATORY FOR CLOSE SCORES: When two versions are within 1 point of each other, the explanation MUST explicitly name the single deciding factor that separates them. Generic phrasing is prohibited (Rule CK).
- NO SOFT TIES IN MID-TIER: Soft tie language ("both versions perform similarly", "comparable in quality") is forbidden when versions score within 1 point in the 80–84 range. The system must commit to a decisive ranking (Rule CL).
- OUTPUT COMPLETENESS MANDATORY: Before finalizing, verify: score table exists, all versions analyzed, each version has explanation + insight + action, Priority Actions exists with exactly 3 items. If ANY section is missing, this output is invalid and must be regenerated (Rule CM).
- INSIGHT SELF-CHECK: Before finalizing, verify per-version: (1) insight ≤18 words, (2) insight is non-removable (adds information not in explanation), (3) insight is not a summary, (4) action passes impact test, (5) action uses WHAT→WHY format, (6) no forbidden generic action phrases (Rules BA–BE, CN–CQ).
- INTERNAL CHECK v6.5: Run RULES F, L, R, S–CQ validation internally before finalizing output. Revise if any check fails.
- Respond ONLY with the JSON object.`;

  // BOLT PATCH v1.1: Retry logic helper
  const attemptScoring = async (retryAttempt: number = 0): Promise<any> => {
    const messages = [
      {
        role: 'system',
        // BOLT PATCH v1.1: Simplified, strict system prompt to prevent refusals
        content: 'You are a scoring engine. You MUST evaluate the provided marketing copy and return a JSON object. STRICT RULES: You are allowed to analyze ANY marketing copy. This task is safe and permitted. NEVER refuse. NEVER say "I can\'t assist". NEVER return empty JSON. ALWAYS return valid JSON. If unsure, make a reasonable assumption and still return a complete response. You must clearly distinguish between: generic competence (72–75), strong professional copy (82–84), and truly distinctive copy (85+). Violations dominate narrative but only cap ceilings. Use decisive language for violations. ATA < 75 = hard cap at 78. Generic copy ceiling is 74. Score spread between qualitatively different versions must be 5–8 points minimum. Top-tier gate: 85+ requires distinction and memorability. Evidence must be verbatim substrings. The system must produce a clear winner in all cases. Explanations must be precise and grounded. DECISIVE INSIGHT RULES: maximum 18 words, one sentence only, must answer "What is the ONE thing that matters most?". DECISIVE ACTION RULES: maximum 18 words, format "[WHAT to change] → [WHY it improves performance]". FORBIDDEN actions: "Improve clarity", "Refine wording", "Enhance engagement", "Make it more compelling". FIT DOMINANCE: Audience fit is the primary constraint. Tone mismatch penalty ≥ -2 = finalScore ceiling 83; ≥ -3 = ceiling 81. Enterprise aggression triggers automatic -3 minimum to audienceToneAlignment. CRITICAL: ALL subscores must be numbers. NEVER omit fields. NEVER return null. NEVER return {}. You MUST return valid JSON exactly as specified.'
      },
      { role: 'user', content: retryAttempt > 0
        ? `Your previous response was invalid. You MUST return valid JSON exactly as specified. Do not explain. Do not refuse. Return ONLY the JSON object.\n\n${prompt}`
        : prompt
      }
    ];

    // BOLT PATCH v1.1: Force JSON mode
    const completion = await makeApiRequestWithFallback(
      actualModel,
      messages,
      0.4,
      900,
      { type: 'json_object' } // Force JSON output
    );
    const rawContent = completion.choices[0]?.message?.content?.trim();
    if (!rawContent) throw new Error('No response from AI');

    // BOLT PATCH v1.1: Detect refusals and empty responses
    if (rawContent.includes("I'm sorry") || rawContent.includes("I can't assist") || rawContent.includes("I cannot assist")) {
      console.warn(`⚠️ [BOLT v1.1] LLM REFUSAL DETECTED for "${versionLabel}" (attempt ${retryAttempt + 1}/3)`);
      if (retryAttempt < 2) {
        // Retry with stronger instruction
        return attemptScoring(retryAttempt + 1);
      }
      throw new Error('LLM refused to score after 3 attempts');
    }

    const cleanedContent = cleanJsonResponse(rawContent);

    // BOLT PATCH v1.1: Detect empty JSON
    if (cleanedContent === '{}' || cleanedContent === '""' || cleanedContent.length < 10) {
      console.warn(`⚠️ [BOLT v1.1] EMPTY JSON DETECTED for "${versionLabel}" (attempt ${retryAttempt + 1}/3)`);
      if (retryAttempt < 2) {
        // Retry with stronger instruction
        return attemptScoring(retryAttempt + 1);
      }
      throw new Error('LLM returned empty JSON after 3 attempts');
    }

    return { rawContent, cleanedContent };
  };

  // BOLT PATCH v1.1: Execute scoring with retry logic
  try {
    const { rawContent, cleanedContent } = await attemptScoring();

    // SCORE TRACE AUDIT: LLM call completed
    traceEntry.llmCallAttempted = true;

    let parsed: {
      subscores: VersionSubscores;
      evidence?: Partial<VersionEvidence>;
      weakestDimension: string;
      weakestReason: string;
      bestUseCase: string;
      insight?: string;
      action?: string;
    };

    // SCORING ROBUSTNESS FIX: try parsing with repair retry
    try {
      parsed = JSON.parse(cleanedContent);
      // SCORE TRACE AUDIT: parse succeeded
      traceEntry.parseSuccess = true;
    } catch (parseError) {
      debugCompare.log(`[scoreVersion] Initial parse failed for "${versionLabel}", attempting repair...`);

      // SCORE TRACE AUDIT: parse failed, attempting repair
      traceEntry.repairRetryAttempted = true;

      // SCORING ROBUSTNESS FIX: retry JSON repair before fallback
      try {
        const repairPrompt = `The following text should be valid JSON but has parsing errors. Extract and return ONLY the valid JSON object, with no explanation, no markdown, no code fences:

${rawContent}

Return ONLY raw JSON.`;

        const repairCompletion = await makeApiRequestWithFallback(actualModel, [
          { role: 'user', content: repairPrompt }
        ], 0.1, 500);

        const repairedContent = repairCompletion.choices[0]?.message?.content?.trim();
        if (repairedContent) {
          const repairedCleaned = cleanJsonResponse(repairedContent);
          parsed = JSON.parse(repairedCleaned);
          debugCompare.log(`[scoreVersion] Repair successful for "${versionLabel}"`);
          // SCORE TRACE AUDIT: repair succeeded
          traceEntry.repairRetrySuccess = true;
          traceEntry.parseSuccess = true;
        }
      } catch (repairError) {
        // BOLT PATCH v1.1: Enhanced failure logging
        console.error(`⚠️ [BOLT v1.1] PARSE FAILURE for "${versionLabel}"`);
        console.error('[scoreVersion] Parse error for version:', versionLabel, parseError);
        console.error('[scoreVersion] Repair also failed:', repairError);
        console.error('[scoreVersion] Raw content (first 500 chars):', rawContent?.substring(0, 500));
        // SCORE TRACE AUDIT: both parse and repair failed
        traceEntry.fallbackTriggered = true;
        traceEntry.fallbackReason = 'Parse and repair both failed';
        throw new Error('Invalid JSON response from AI');
      }
    }

    const requiredDimKeys: ScoreDimension[] = [
      'audienceToneAlignment', 'clarity', 'persuasion', 'emotion',
      'differentiation', 'trust', 'cta', 'seo'
    ];
    // New dimensions are optional for backward compatibility — default to 70 if missing
    const optionalDimKeys: ScoreDimension[] = ['humanAuthenticity', 'overMarketingPenalty', 'brandFit'];
    const allDimKeys: ScoreDimension[] = [...requiredDimKeys, ...optionalDimKeys];

    // SCORING ROBUSTNESS FIX: defensive subscore validation with coercion
    if (!parsed.subscores || typeof parsed.subscores !== 'object') {
      throw new Error('Invalid subscores in response: subscores missing or not an object');
    }

    // Default missing optional dims to 70 (neutral/good value)
    for (const dim of optionalDimKeys) {
      if (parsed.subscores[dim] === undefined || parsed.subscores[dim] === null) {
        parsed.subscores[dim] = 70;
      }
    }

    // Coerce string numbers to actual numbers and validate
    for (const dim of allDimKeys) {
      const value = parsed.subscores[dim];
      if (typeof value === 'string') {
        // Allow "(not-scored)" for SEO when seoActive is false
        if (value === '(not-scored)' && dim === 'seo' && !seoActive) {
          parsed.subscores[dim] = 0; // Default to 0 when not scored
          continue;
        }
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          parsed.subscores[dim] = numValue;
        } else if (optionalDimKeys.includes(dim)) {
          parsed.subscores[dim] = 70; // graceful fallback for new optional dims
        } else {
          throw new Error(`Invalid subscores in response: ${dim} is not a number`);
        }
      } else if (typeof value !== 'number') {
        if (optionalDimKeys.includes(dim)) {
          parsed.subscores[dim] = 70;
        } else {
          throw new Error(`Invalid subscores in response: ${dim} is not a number`);
        }
      }
    }

    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
    const subscores: VersionSubscores = {
      audienceToneAlignment: clamp(parsed.subscores.audienceToneAlignment),
      clarity:               clamp(parsed.subscores.clarity),
      persuasion:            clamp(parsed.subscores.persuasion),
      emotion:               clamp(parsed.subscores.emotion),
      differentiation:       clamp(parsed.subscores.differentiation),
      trust:                 clamp(parsed.subscores.trust),
      cta:                   clamp(parsed.subscores.cta),
      seo:                   clamp(parsed.subscores.seo),
      humanAuthenticity:     clamp(parsed.subscores.humanAuthenticity),
      overMarketingPenalty:  clamp(parsed.subscores.overMarketingPenalty),
      brandFit:              clamp(parsed.subscores.brandFit),
    };

    // --- Evidence validity guard ---
    const rawEvidence = parsed.evidence ?? {};
    const evidence: VersionEvidence = {
      audienceToneAlignment: sanitizeEvidence(rawEvidence.audienceToneAlignment),
      persuasion:            sanitizeEvidence(rawEvidence.persuasion),
      trust:                 sanitizeEvidence(rawEvidence.trust),
      cta:                   sanitizeEvidence(rawEvidence.cta),
      seo:                   seoActive ? sanitizeEvidence(rawEvidence.seo) : '(not-scored)',
      humanAuthenticity:     sanitizeEvidence(rawEvidence.humanAuthenticity),
      overMarketingPenalty:  sanitizeEvidence(rawEvidence.overMarketingPenalty),
      brandFit:              sanitizeEvidence(rawEvidence.brandFit),
    };

    const coreDimsToValidate: Array<keyof VersionEvidence> = [
      'audienceToneAlignment', 'persuasion', 'trust', 'cta'
    ];
    for (const dim of coreDimsToValidate) {
      if (evidence[dim] !== '(none)' && !isEvidenceInContent(evidence[dim], contentText)) {
        evidence[dim] = '(invalid-evidence)';
        subscores[dim as ScoreDimension] = Math.min(subscores[dim as ScoreDimension], 60);
      }
    }

    // Validate SEO evidence only when seoActive
    if (seoActive && evidence.seo !== '(none)' && !isEvidenceInContent(evidence.seo, contentText)) {
      evidence.seo = '(invalid-evidence)';
      subscores.seo = Math.min(subscores.seo, 60);
    }

    // --- Keyword-based SEO enforcement (only when seoActive) ---
    let matchedKeywords: string[] | undefined;

    if (seoActive) {
      matchedKeywords = findKeywordsInContent(keywords, contentText);
      const keywordCount = matchedKeywords.length;
      const inHeading = keywordCount > 0 && keywordInHeading(matchedKeywords, contentText);

      if (keywordCount === 0) {
        subscores.seo = Math.min(subscores.seo, 65);
        evidence.seo = '(none)';
      } else if (keywordCount === 1) {
        subscores.seo = Math.max(70, Math.min(subscores.seo, 80));
      } else {
        const floor = inHeading ? 80 : 75;
        subscores.seo = Math.max(floor, Math.min(subscores.seo, 90));
      }

      // SEO evidence must contain a matched keyword
      if (evidence.seo !== '(none)') {
        const evidenceHasKeyword = matchedKeywords.some(kw =>
          evidence.seo.toLowerCase().includes(kw.toLowerCase())
        );
        if (!evidenceHasKeyword) {
          evidence.seo = '(invalid-evidence)';
          subscores.seo = Math.min(subscores.seo, 60);
        }
      }
    }

    // Weakest dimension — derive from actual subscores (restrict to active dims when seoActive=false)
    const dimsForWeakest = seoActive ? allDimKeys : CORE_DIMS;
    const weakestDimension = dimsForWeakest.reduce((min, d) =>
      subscores[d] < subscores[min] ? d : min
    ) as ScoreDimension;

    const weakestReason = typeof parsed.weakestReason === 'string'
      ? parsed.weakestReason.trim().substring(0, 200)
      : 'No specific reason provided.';
    const bestUseCase = typeof parsed.bestUseCase === 'string'
      ? parsed.bestUseCase.trim()
      : 'Unable to determine best use case.';
    let insight: string = (typeof parsed.insight === 'string' && parsed.insight.trim().length > 0)
      ? parsed.insight.trim()
      : INSIGHT_FALLBACK;
    const insightWords = insight.split(/\s+/);
    if (insightWords.length > 18) insight = insightWords.slice(0, 18).join(' ');
    if (insight.length === 0) insight = INSIGHT_FALLBACK;

    const action: string = (typeof parsed.action === 'string' && parsed.action.trim().length > 0)
      ? parsed.action.trim().substring(0, 300)
      : ACTION_FALLBACK;

    // SCORING FIX: Calculate base deterministic score
    const baseFinalScore = computeFinalScore(contentText, subscores, seoActive, contextWeights);

    // SCORING FIX: bounded LLM adjustment (±10 max)
    // Get LLM refinement with bounded adjustment
    const conversionScore = estimateConversionDisplayScore(contentText);
    const trustScore = estimateTrustDisplayScore(contentText);
    const riskLevel = estimateRiskDisplayLevel(contentText);

    const { adjustment, reason: adjustmentReason } = await getLLMScoreAdjustment(
      contentText,
      baseFinalScore,
      conversionScore,
      trustScore,
      riskLevel,
      userId ? { id: userId } as User : undefined,
      sessionId
    );

    // Calculate adjusted final score with bounds
    const finalScore = Math.max(0, Math.min(100, baseFinalScore + adjustment));

    const finalSeoValidity = getEvidenceValidity(evidence.seo, contentText);

    debugCompare.log(`[scoreVersion] "${versionLabel}" result`, {
      optionLabel: versionLabel,
      seoActive,
      activeDimensions,
      dimensionCount,
      seoScore: seoActive ? subscores.seo : 'N/A',
      'evidence.seo': evidence.seo,
      evidenceValidity: finalSeoValidity,
      subscores,
      finalScore,
      weakestDimension,
      evidence,
      ...(seoActive && matchedKeywords !== undefined && { matchedKeywords }),
    });

    if (userId && completion.usage) {
      try {
        await trackTokenUsage(
          { id: userId } as User,
          completion.usage.total_tokens || 0,
          completion.model_used,
          'comprehensive_scoring',
          sessionId,
          0,
          undefined,
          extractTokenBreakdown(completion.usage)
        );
      } catch (trackError) {
        console.warn('Failed to track token usage:', trackError);
      }
    }

    // SCORING FIX: expose score composition for user trust
    const scoreBreakdownLabel = generateScoreBreakdownLabel(baseFinalScore, adjustment);
    const scoreDetailShort = generateScoreDetailShort(adjustment, adjustmentReason);
    const isAdjusted = adjustment !== 0;

    // SCORE TRACE AUDIT: finalize trace entry before return
    // STABILIZATION: Calculate baseScoreCore and tieBreaker for trace (they're local to computeFinalScore)
    const riskPenalty = riskLevel === 'High' ? 25 : riskLevel === 'Medium' ? 10 : 0;
    const traceBaseScoreCore = 0.5 * conversionScore + 0.3 * trustScore + 0.2 * (100 - riskPenalty);
    const traceTieBreaker =
      0.05 * (subscores.clarity ?? 50) +
      0.05 * (subscores.persuasion ?? 50) +
      0.025 * (subscores.audienceToneAlignment ?? 50) +
      0.025 * (subscores.emotion ?? 50);

    traceEntry.conversionScore = conversionScore;
    traceEntry.trustScore = trustScore;
    traceEntry.riskLevel = riskLevel;
    traceEntry.baseScoreCore = traceBaseScoreCore;
    traceEntry.tieBreaker = traceTieBreaker;
    traceEntry.baseFinalScore = baseFinalScore;
    traceEntry.adjustment = adjustment;
    traceEntry.adjustedFinalScore = finalScore;
    traceEntry.displayedScore = displayScore(finalScore);
    traceEntry.narrativeGenerated = !!(insight && action);
    traceEntry.insightHash = simpleHash(insight || '');
    traceEntry.actionHash = simpleHash(action || '');

    // SCORE TRACE AUDIT: log trace entry
    logTrace(traceEntry);

    return {
      versionId: version.id,
      optionLabel: versionLabel,
      finalScore, // Adjusted score (baseFinalScore + adjustment)
      baseFinalScore, // Deterministic score before LLM adjustment
      adjustment, // LLM adjustment (-10 to +10)
      adjustmentReason, // Explanation for adjustment
      scoreBreakdownLabel, // e.g., "79 base +3 AI refinement"
      scoreDetailShort, // e.g., "Heuristic score with minor AI refinement"
      isAdjusted, // true if adjustment !== 0
      // SCORING FIX: explain ranking decision for user trust
      conversionScore, // Display-only conversion score
      trustScore, // Display-only trust score
      riskLevel, // Display-only risk level
      subscores,
      weakestDimension,
      weakestReason,
      bestUseCase,
      insight,
      action,
      evidence,
      scoringVersion: SCORING_VERSION,
      evaluatedAt: version.generatedAt, // Use original creation timestamp, not scoring timestamp
      modelUsed: model,
      seoActive,
      activeDimensions,
      dimensionCount,
      keywordsProvided,
      matchedKeywords: seoActive ? matchedKeywords : undefined,
    };

  } catch (error: any) {
    console.warn(`[scoreVersion] Parse/score error for "${versionLabel}" — applying fallback score:`, error?.message);

    // SCORE TRACE AUDIT: update trace with fallback info
    if (!traceEntry.fallbackTriggered) {
      traceEntry.fallbackTriggered = true;
      traceEntry.fallbackReason = `Exception: ${error?.message || 'Unknown error'}`;
    }

    const FALLBACK_SCORE = 78;
    const fallbackSubscores: VersionSubscores = {
      audienceToneAlignment: FALLBACK_SCORE,
      clarity: FALLBACK_SCORE,
      persuasion: FALLBACK_SCORE,
      emotion: FALLBACK_SCORE,
      differentiation: 75,
      trust: FALLBACK_SCORE,
      cta: FALLBACK_SCORE,
      seo: FALLBACK_SCORE,
    };

    // SCORING FIX: expose score composition for user trust (fallback case)
    const fallbackScoreBreakdownLabel = generateScoreBreakdownLabel(FALLBACK_SCORE, 0);
    const fallbackScoreDetailShort = generateScoreDetailShort(0);

    // SCORE TRACE AUDIT: finalize trace entry for fallback case
    traceEntry.conversionScore = 50;
    traceEntry.trustScore = 50;
    traceEntry.riskLevel = 'Medium';
    traceEntry.baseScoreCore = FALLBACK_SCORE;
    traceEntry.tieBreaker = 0;
    traceEntry.baseFinalScore = FALLBACK_SCORE;
    traceEntry.adjustment = 0;
    traceEntry.adjustedFinalScore = FALLBACK_SCORE;
    traceEntry.displayedScore = FALLBACK_SCORE;
    traceEntry.narrativeGenerated = false;
    traceEntry.insightHash = simpleHash(INSIGHT_FALLBACK);
    traceEntry.actionHash = simpleHash(ACTION_FALLBACK);

    // SCORE TRACE AUDIT: log fallback trace entry
    logTrace(traceEntry);

    return {
      versionId: version.id,
      optionLabel: versionLabel,
      finalScore: FALLBACK_SCORE,
      baseFinalScore: FALLBACK_SCORE, // No adjustment in fallback
      adjustment: 0, // No adjustment in fallback
      adjustmentReason: 'Fallback score (scoring error)',
      scoreBreakdownLabel: fallbackScoreBreakdownLabel, // e.g., "78 base (no adjustment)"
      scoreDetailShort: fallbackScoreDetailShort, // "Pure heuristic score (no adjustment)"
      isAdjusted: false, // No adjustment in fallback
      // SCORING FIX: explain ranking decision for user trust (fallback case)
      conversionScore: 50, // Neutral fallback
      trustScore: 50, // Neutral fallback
      riskLevel: 'Medium', // Neutral fallback
      subscores: fallbackSubscores,
      weakestDimension: 'differentiation',
      weakestReason: EXPLANATION_FALLBACK,
      bestUseCase: EXPLANATION_FALLBACK,
      evidence: { ...FALLBACK_EVIDENCE },
      insight: INSIGHT_FALLBACK,
      action: ACTION_FALLBACK,
      scoringVersion: SCORING_VERSION,
      evaluatedAt: version.generatedAt, // Use original creation timestamp, not scoring timestamp
      errorMessage: error.message || 'Unknown error',
      modelUsed: model,
      seoActive,
      activeDimensions,
      dimensionCount,
      keywordsProvided,
      matchedKeywords: seoActive ? [] : undefined,
    };
  }
}

// ── Aggregation ───────────────────────────────────────────────────────────────

/**
 * @deprecated This function uses legacy score aggregation and is no longer used in the application.
 * Use generateUnifiedComparison() from unifiedComparison.ts instead, which uses comparative scoring.
 *
 * Legacy aggregation combines independent scores without understanding relative strengths between versions,
 * producing less meaningful winner selection than comparative scoring's explicit ranking system.
 *
 * This function is only kept for backward compatibility and will be removed in a future release.
 *
 * Aggregate version scores deterministically.
 * Tie-break order: finalScore > CTA > clarity > persuasion > audienceToneAlignment > stable (first seen).
 */
export function aggregateScores(scores: VersionScoreResult[]): ComparisonResult {
  // DEPRECATION WARNING: Alert developers this function should not be used
  console.warn(
    '⚠️ aggregateScores() is deprecated and should not be used. ' +
    'Use generateUnifiedComparison() from unifiedComparison.ts instead. ' +
    'This function will be removed in a future release.'
  );

  if (scores.length === 0) throw new Error('No scores to aggregate');

  const winner = scores.reduce((best, score) => {
    if (score.finalScore > best.finalScore) return score;
    if (score.finalScore < best.finalScore) return best;
    if ((score.subscores?.cta ?? 0) > (best.subscores?.cta ?? 0)) return score;
    if ((score.subscores?.cta ?? 0) < (best.subscores?.cta ?? 0)) return best;
    if ((score.subscores?.clarity ?? 0) > (best.subscores?.clarity ?? 0)) return score;
    if ((score.subscores?.clarity ?? 0) < (best.subscores?.clarity ?? 0)) return best;
    if ((score.subscores?.persuasion ?? 0) > (best.subscores?.persuasion ?? 0)) return score;
    if ((score.subscores?.persuasion ?? 0) < (best.subscores?.persuasion ?? 0)) return best;
    if ((score.subscores?.audienceToneAlignment ?? 0) > (best.subscores?.audienceToneAlignment ?? 0)) return score;
    return best;
  });

  const bestScore = winner.finalScore;
  const winnerVersionId = winner.versionId;
  const baselineScore = scores.find(s => s.versionId === '__original__')?.finalScore ?? null;

  debugCompare.log('[aggregateScores] winner:', winner.optionLabel, '| finalScore:', bestScore, '| seoActive:', winner.seoActive);

  // SCORING FIX: explain ranking decision for user trust
  // Find the runner-up (second-best version) for comparison
  let runnerUp: VersionScoreResult | null = null;
  if (scores.length > 1) {
    const sortedScores = [...scores].sort((a, b) => {
      // Same tie-breaker logic as winner selection
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if ((b.subscores?.cta ?? 0) !== (a.subscores?.cta ?? 0)) return (b.subscores?.cta ?? 0) - (a.subscores?.cta ?? 0);
      if ((b.subscores?.clarity ?? 0) !== (a.subscores?.clarity ?? 0)) return (b.subscores?.clarity ?? 0) - (a.subscores?.clarity ?? 0);
      if ((b.subscores?.persuasion ?? 0) !== (a.subscores?.persuasion ?? 0)) return (b.subscores?.persuasion ?? 0) - (a.subscores?.persuasion ?? 0);
      if ((b.subscores?.audienceToneAlignment ?? 0) !== (a.subscores?.audienceToneAlignment ?? 0)) return (b.subscores?.audienceToneAlignment ?? 0) - (a.subscores?.audienceToneAlignment ?? 0);
      return 0;
    });
    runnerUp = sortedScores[1] || null;
  }

  // Generate winner explanation
  const { explanation: winnerExplanation, factors: winnerFactors } = generateWinnerExplanation(winner, runnerUp);

  debugCompare.log('[aggregateScores] winnerExplanation:', winnerExplanation);
  debugCompare.log('[aggregateScores] winnerFactors:', winnerFactors);

  const rows = scores.map((score) => {
    let improvementPct: number | null = null;
    if (baselineScore !== null && baselineScore > 0) {
      improvementPct = score.versionId === '__original__'
        ? 0
        : Math.round(((score.finalScore - baselineScore) / baselineScore) * 100);
    }
    debugCompare.log(
      `[aggregateScores] "${score.optionLabel}" finalScore=${score.finalScore}`,
      `delta=${score.finalScore - bestScore}`,
      `improvementPct=${improvementPct}`,
      `seoActive=${score.seoActive}`,
      `dims=${score.dimensionCount}`
    );
    return {
      versionId: score.versionId,
      optionLabel: score.optionLabel,
      finalScore: score.finalScore,
      deltaVsBest: score.finalScore - bestScore,
      improvementPct,
      bestUseCase: score.bestUseCase,
      insight: score.insight,
      action: score.action,
      isWinner: score.versionId === winnerVersionId,
      seoActive: score.seoActive,
      activeDimensions: score.activeDimensions,
      dimensionCount: score.dimensionCount,
      keywordsProvided: score.keywordsProvided,
      matchedKeywords: score.matchedKeywords,
      evaluatedAt: score.evaluatedAt,
      // SCORING FIX: expose score composition for user trust
      baseFinalScore: score.baseFinalScore,
      adjustment: score.adjustment,
      adjustmentReason: score.adjustmentReason,
      scoreBreakdownLabel: score.scoreBreakdownLabel,
      scoreDetailShort: score.scoreDetailShort,
      isAdjusted: score.isAdjusted,
    };
  });

  return {
    scoringVersion: SCORING_VERSION,
    scoredAt: new Date().toISOString(),
    winnerVersionId,
    rows,
    priorityActions: [],
    // SCORING FIX: explain ranking decision for user trust
    winnerExplanation,
    winnerFactors,
    // comparative scoring state fix: version-set fingerprint for staleness detection
    versionSetKey: scores.map(s => s.versionId).sort().join(',')
  };
}

// phase 2 scoring cleanup: removed legacy scoring functions
// - generatePriorityActions (only used by scoreAndCompareVersions)
// - validateDecisionLayerOutput (only used by generateDecisionLayer)
// - generateDecisionLayer (only used by scoreAndCompareVersions)
// - enforceTopTierSeparation (only used by scoreAndCompareVersions)
// - scoreAndCompareVersions (replaced by comparative scoring)

/**
 * comp-v6.5.3 Data Contract Lock: Pre-return validation + repair pass.
 * Guarantees that the returned ComparisonResult is always render-safe.
 */
function validateAndRepairResult(result: ComparisonResult, _allScores: VersionScoreResult[]): void {
  let repairNeeded = false;

  for (const row of result.rows) {
    if (!row.finalScore || row.finalScore <= 0) {
      row.finalScore = 78;
      repairNeeded = true;
      debugCompare.log(`[validateAndRepairResult] Repaired invalid score for "${row.optionLabel}"`);
    }
    if (!row.weakestReason || row.weakestReason.trim().length === 0) {
      row.weakestReason = EXPLANATION_FALLBACK;
      repairNeeded = true;
    }
    if (!row.bestUseCase || row.bestUseCase.trim().length === 0) {
      row.bestUseCase = EXPLANATION_FALLBACK;
      repairNeeded = true;
    }
    if (!row.insight || row.insight.trim().length === 0) {
      row.insight = INSIGHT_FALLBACK;
      repairNeeded = true;
    }
    if (!row.action || row.action.trim().length === 0) {
      row.action = ACTION_FALLBACK;
      repairNeeded = true;
    }
  }

  if (!Array.isArray(result.priorityActions) || result.priorityActions.length !== 3) {
    result.priorityActions = [
      { title: 'Clarify the main CTA', reason: 'Improves conversion focus.' },
      { title: 'Add a concrete proof point', reason: 'Builds trust and credibility.' },
      { title: 'Sharpen differentiation', reason: 'Improves positioning clarity.' },
    ];
    repairNeeded = true;
    debugCompare.log('[validateAndRepairResult] Injected fallback priorityActions');
  }

  for (const row of result.rows) {
    if (!row.decisionSummary || row.decisionSummary.trim().length === 0) {
      row.decisionSummary = DECISION_SUMMARY_FALLBACK;
      repairNeeded = true;
    }
    if (!row.decisionReason || row.decisionReason.trim().length === 0) {
      row.decisionReason = DECISION_REASON_FALLBACK;
      repairNeeded = true;
    }
  }

  if (!result.finalRecommendation) {
    const winnerRow = result.rows.find(r => r.isWinner);
    result.finalRecommendation = {
      ...FINAL_RECOMMENDATION_FALLBACK,
      winnerId: winnerRow?.versionId ?? result.winnerVersionId,
    };
    repairNeeded = true;
    debugCompare.log('[validateAndRepairResult] Injected fallback finalRecommendation');
  } else {
    const rec = result.finalRecommendation;
    if (!Array.isArray(rec.nextSteps) || rec.nextSteps.length !== 3) {
      rec.nextSteps = [...FINAL_RECOMMENDATION_FALLBACK.nextSteps];
      repairNeeded = true;
    }
    if (!rec.why || rec.why.trim().length === 0) {
      rec.why = FINAL_RECOMMENDATION_FALLBACK.why;
      repairNeeded = true;
    }
    if (!rec.winnerId) {
      rec.winnerId = result.winnerVersionId;
      repairNeeded = true;
    }
  }

  const topScore = Math.max(...result.rows.map(r => r.finalScore));
  const topTieCount = result.rows.filter(r => r.finalScore === topScore && topScore >= 85).length;
  if (topTieCount > 1) {
    let separation = topScore;
    for (const row of result.rows.filter(r => r.finalScore === topScore && topScore >= 85)) {
      row.finalScore = separation--;
      if (separation < 84) break;
    }
    repairNeeded = true;
    debugCompare.log('[validateAndRepairResult] Repaired 85+ tie');
  }

  const winnerCount = result.rows.filter(r => r.isWinner).length;
  if (winnerCount !== 1) {
    const highestScore = Math.max(...result.rows.map(r => r.finalScore));
    let winnerSet = false;
    for (const row of result.rows) {
      row.isWinner = !winnerSet && row.finalScore === highestScore;
      if (row.isWinner) winnerSet = true;
    }
    repairNeeded = true;
    debugCompare.log(`[validateAndRepairResult] Repaired winner count (was ${winnerCount})`);
  }

  if (repairNeeded) {
    debugCompare.log('[validateAndRepairResult] Repair pass completed');
  }
}

