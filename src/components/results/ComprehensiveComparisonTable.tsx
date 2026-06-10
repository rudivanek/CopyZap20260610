/**
 * Comprehensive Comparison Table — Decision-First Layout (comp-v6.9.1)
 *
 * Layout:
 *  A. Sticky Nav
 *  B. Winner Hero Card
 *  C. Action Panel (absorbed into WinnerHeroCard)
 *  D. Performance Comparison Section
 *     D1. StickyPerformanceSummary — always visible, sticky at top
 *     D2. ExpandableAnalysisList — controlled by expand/collapse state only
 *  E. Scoring Context + Debug Controls
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw, CheckCircle, RotateCcw, PlusCircle,
  Bug, Terminal, Loader2, Target, Layers
} from 'lucide-react';
import { ComparisonResult } from '../../services/api/comprehensiveScoring';
import { VersionDeepAnalysis, ComparisonDeepAnalysisMeta, AbsoluteScoreBreakdown } from '../../types';
import { debugCompare } from '../../utils/debugLogger';
import { DebugInfoModal } from './DebugInfoModal';
import { WinnerHeroCard } from './decision/WinnerHeroCard';
import { ActionPanel } from './decision/ActionPanel';
import { VersionAnalysisCard } from './decision/VersionAnalysisCard';
import { RankingsSnapshotCard } from './decision/RankingsSnapshotCard';
import { StickyResultsNav } from './decision/StickyResultsNav';
import { getComparisonDelta } from '../../utils/comparisonDelta';
import { getDecisionBadgeForVersion, DecisionBadge } from '../../utils/decisionBadges';
import { calculateMultiScoreDisplay } from '../../utils/multiScoreDisplay';

interface ComprehensiveComparisonTableProps {
  comparison: ComparisonResult;
  onVersionClick?: (versionId: string) => void;
  isRescoring?: boolean;
  baselineVersionId?: string;
  missingCount?: number;
  onScoreNewOutputs?: () => void;
  isScoringNewOutputs?: boolean;
  contextChanged?: boolean;
  pendingContextLabel?: string;
  onApplyNewContextRescoreAll?: () => void;
  isApplyingNewContext?: boolean;
  comparisonOutdated?: boolean;
  onRescoreWithUpdatedChanges?: () => void;
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>;
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta;
  onGenerateDetailedAnalysis?: () => void;
  isGeneratingDetails?: boolean;
  onEnsureVersionDeepAnalysis?: (versionId: string) => Promise<void>;
  loadingVersionIds?: Set<string>;
  versionContentMap?: Record<string, string>; // PHASE 1.3: Map versionId to actual copy text for multi-score display
  absoluteScoreMap?: Record<string, AbsoluteScoreBreakdown>; // Absolute scores per versionId
}


export const ComprehensiveComparisonTable: React.FC<ComprehensiveComparisonTableProps> = ({
  comparison,
  onVersionClick,
  isRescoring,
  baselineVersionId,
  missingCount = 0,
  onScoreNewOutputs,
  isScoringNewOutputs,
  contextChanged = false,
  pendingContextLabel,
  onApplyNewContextRescoreAll,
  isApplyingNewContext,
  comparisonOutdated = false,
  onRescoreWithUpdatedChanges,
  versionDeepAnalysis,
  comparisonDeepAnalysisMeta,
  onGenerateDetailedAnalysis,
  isGeneratingDetails,
  onEnsureVersionDeepAnalysis,
  loadingVersionIds,
  versionContentMap,
  absoluteScoreMap,
}) => {
  const [debugEnabled, setDebugEnabled] = useState<boolean>(
    () => localStorage.getItem('copyzap_debugCompare') === '1'
  );
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [expandedVersionIds, setExpandedVersionIds] = useState<Record<string, boolean>>({});
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const safeRows = comparison.rows ?? [];

  useEffect(() => {
    // All cards expanded by default
    const initial: Record<string, boolean> = {};
    (comparison.rows ?? []).forEach(r => { initial[r.versionId] = true; });
    setExpandedVersionIds(initial);
  }, [comparison.winnerVersionId]);

  useEffect(() => {
    if (!comparison) return;
    const missingRows = (comparison.rows ?? []).filter(r => !r.decisionSummary || !r.decisionReason);
    if (missingRows.length > 0) {
      console.error('[comp-v6.7.3] Decision layer fields missing on rows:', missingRows.map(r => r.versionId));
    }
    if (!comparison.finalRecommendation) {
      console.error('[comp-v6.7.3] finalRecommendation missing from comparison result');
    }
  }, [comparison]);

  const handleDebugToggle = () => {
    const next = !debugEnabled;
    setDebugEnabled(next);
    if (next) {
      localStorage.setItem('copyzap_debugCompare', '1');
    } else {
      localStorage.removeItem('copyzap_debugCompare');
    }
  };

  const handleToggleVersionCard = (versionId: string) => {
    setExpandedVersionIds(prev => {
      if (prev[versionId]) {
        const { [versionId]: _, ...rest } = prev;
        return rest;
      } else {
        if (!versionDeepAnalysis?.[versionId] && onEnsureVersionDeepAnalysis) {
          onEnsureVersionDeepAnalysis(versionId);
        }
        return { ...prev, [versionId]: true };
      }
    });
  };

  const handleJumpToBreakdown = (versionId: string, target: 'output' | 'improve') => {
    const anchorId = target === 'output'
      ? `breakdown-${versionId}-output`
      : `breakdown-${versionId}-improve`;

    setExpandedVersionIds(prev => {
      if (prev[versionId]) return prev;
      return { ...prev, [versionId]: true };
    });

    if (!versionDeepAnalysis?.[versionId] && onEnsureVersionDeepAnalysis) {
      onEnsureVersionDeepAnalysis(versionId);
    }

    setTimeout(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }, 150);
  };

  const handleGenerateAllMissing = async () => {
    if (!onEnsureVersionDeepAnalysis || isBulkGenerating) return;
    const allIds = safeRows.map(r => r.versionId);
    const missingIds = allIds.filter(id => !versionDeepAnalysis?.[id]);
    const allExpandedState = Object.fromEntries(allIds.map(id => [id, true]));
    setExpandedVersionIds(allExpandedState);
    setIsBulkGenerating(true);
    setBulkProgress({ done: 0, total: missingIds.length });
    let done = 0;
    for (const id of missingIds) {
      await onEnsureVersionDeepAnalysis(id);
      done += 1;
      setBulkProgress({ done, total: missingIds.length });
    }
    setIsBulkGenerating(false);
    setBulkProgress(null);
    setExpandedVersionIds(allExpandedState);
  };

  const baselineRow = useMemo(() => {
    if (baselineVersionId) return safeRows.find(r => r.versionId === baselineVersionId) ?? null;
    return safeRows.find(r => r.optionLabel === 'Original Copy') ?? null;
  }, [safeRows, baselineVersionId]);

  const sortedRows = useMemo(() => {
    return [...safeRows].sort((a, b) => {
      // comparative scoring state fix: if rows have rank field, use it for sorting
      const aHasRank = typeof a.rank === 'number';
      const bHasRank = typeof b.rank === 'number';

      if (aHasRank && bHasRank) {
        // Both have rank: sort by rank (1 = best, lower rank first)
        return a.rank - b.rank;
      }

      // Legacy sorting: baseline first, then by score
      const aIsBaseline = a.versionId === baselineRow?.versionId;
      const bIsBaseline = b.versionId === baselineRow?.versionId;
      if (aIsBaseline) return -1;
      if (bIsBaseline) return 1;
      return b.finalScore - a.finalScore;
    });
  }, [safeRows, baselineRow]);


  const hasBaseline = !!baselineRow;

  const metaWinnerMatchesScoringWinner =
    !comparisonDeepAnalysisMeta?.winnerVersionId ||
    comparisonDeepAnalysisMeta.winnerVersionId === comparison.winnerVersionId;

  const hasDeepAnalysis =
    (versionDeepAnalysis && Object.keys(versionDeepAnalysis).length > 0) ||
    !!(metaWinnerMatchesScoringWinner && comparisonDeepAnalysisMeta);

  debugCompare.log('[DeepAnalysis] rows:', safeRows.length, '| hasDeepAnalysis:', hasDeepAnalysis);

  const winnerRow = safeRows.find(r => r.isWinner);
  const winnerLabel = winnerRow?.optionLabel ?? 'Best Version';
  const secondRow = safeRows.filter(r => !r.isWinner).sort((a, b) => b.finalScore - a.finalScore)[0];
  const scoringGap = winnerRow && secondRow ? winnerRow.finalScore - secondRow.finalScore : undefined;

  const seoOn = safeRows[0]?.seoActive ?? false;
  const kwCount = safeRows[0]?.keywordsProvided ?? 0;
  const useCaseLabel = comparison.scoringContext?.useCaseLabel ?? null;
  const scoringVersion = comparison.scoringVersion ?? null;

  const missingAnalysisCount = sortedRows.filter(r => !versionDeepAnalysis?.[r.versionId]).length;
  const allAnalysisGenerated = missingAnalysisCount === 0 && sortedRows.length > 0;

  const rankingRows = useMemo(() => {
    const winnerScore = winnerRow?.finalScore ?? 0;
    return sortedRows.map(r => ({
      versionId: r.versionId,
      optionLabel: r.optionLabel,
      finalScore: r.finalScore,
      deltaVsBest: r.finalScore - winnerScore,
      isWinner: r.isWinner,
      evaluatedAt: r.evaluatedAt,
      contentText: versionContentMap?.[r.versionId] || '',
      absoluteScore: absoluteScoreMap?.[r.versionId],
      // DIAGNOSTIC: pass through new positioning-aware subscores if available
      humanAuthenticity: r.humanAuthenticity,
      overMarketingPenalty: r.overMarketingPenalty,
      brandFit: r.brandFit,
      // Verification flags for editor review
      verificationFlags: r.verificationFlags,
    }));
  }, [sortedRows, winnerRow, versionContentMap, absoluteScoreMap]);

  // PHASE 1.4B: Calculate decision badges for all versions (display-only)
  const decisionBadges = useMemo(() => {
    const versionsWithScores = sortedRows.map(row => {
      const contentText = versionContentMap?.[row.versionId] || '';
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

    const badgeMap = new Map<string, DecisionBadge | null>();
    versionsWithScores.forEach(version => {
      const badge = getDecisionBadgeForVersion(version, versionsWithScores);
      badgeMap.set(version.versionId, badge);
    });

    return badgeMap;
  }, [sortedRows, versionContentMap]);

  return (
    <div id="comprehensive-analysis" className="relative">
      {isBulkGenerating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <Loader2 className="w-10 h-10 text-gray-900 dark:text-white animate-spin" />
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900 dark:text-white">Generating Analysis</p>
              {bulkProgress && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {bulkProgress.done} of {bulkProgress.total} versions complete
                </p>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Please wait — do not edit or navigate away</p>
          </div>
        </div>
      )}

      {/* Status banners */}
      {contextChanged && onApplyNewContextRescoreAll && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 mb-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-300 dark:border-amber-600 rounded-xl">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Scoring context changed{pendingContextLabel ? ` to "${pendingContextLabel}"` : ''}.
            </span>
          </div>
          <button
            onClick={onApplyNewContextRescoreAll}
            disabled={isApplyingNewContext}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${isApplyingNewContext ? 'animate-spin' : ''}`} />
            {isApplyingNewContext ? 'Re-scoring...' : 'Apply new context & re-score all'}
          </button>
        </div>
      )}

      {!contextChanged && comparisonOutdated && onRescoreWithUpdatedChanges && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 mb-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-300 dark:border-amber-600 rounded-xl">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              One or more versions were edited.
            </span>
          </div>
          <button
            onClick={onRescoreWithUpdatedChanges}
            disabled={isRescoring}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${isRescoring ? 'animate-spin' : ''}`} />
            {isRescoring ? 'Re-scoring...' : 'Re-score with updated changes'}
          </button>
        </div>
      )}

      {!contextChanged && !comparisonOutdated && missingCount > 0 && onScoreNewOutputs && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 mb-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700 rounded-xl">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            You have {missingCount} new output{missingCount !== 1 ? 's' : ''} not included in this comparison yet.
          </span>
          <button
            onClick={onScoreNewOutputs}
            disabled={isScoringNewOutputs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <PlusCircle className={`w-4 h-4 ${isScoringNewOutputs ? 'animate-spin' : ''}`} />
            {isScoringNewOutputs ? 'Scoring...' : 'Score & add new outputs'}
          </button>
        </div>
      )}

      {/* Sticky Nav */}
      <StickyResultsNav winnerLabel={winnerLabel} hasVersionCards={sortedRows.length > 0} />

      <div>
        {/* D. Performance Comparison (Rankings) — TOP */}
        <div
          id="results-versions"
          className="performance-table-wrapper rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-sm mb-4"
          style={{ display: 'block', height: 'auto', overflow: 'visible' }}
        >
          {/* Header row */}
          <div className="performance-summary-sticky rounded-t-xl bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-5 py-3 gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Performance Comparison
                  </h3>
                  {hasBaseline && (
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                      Compare every version against the original baseline.
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-600 font-normal flex-shrink-0">
                  ({sortedRows.length})
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                {isBulkGenerating && bulkProgress && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {bulkProgress.done} / {bulkProgress.total} generating
                  </span>
                )}

                {onEnsureVersionDeepAnalysis && allAnalysisGenerated && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-3 h-3" />
                    All analyses ready
                  </span>
                )}

                {onEnsureVersionDeepAnalysis && !allAnalysisGenerated && (
                  <button
                    type="button"
                    onClick={handleGenerateAllMissing}
                    disabled={isBulkGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBulkGenerating ? 'animate-spin' : ''}`} />
                    {isBulkGenerating ? 'Generating...' : 'Generate all analyses'}
                  </button>
                )}

                {!onEnsureVersionDeepAnalysis && onGenerateDetailedAnalysis && !hasDeepAnalysis && (
                  <button
                    type="button"
                    onClick={onGenerateDetailedAnalysis}
                    disabled={isGeneratingDetails}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingDetails ? 'animate-spin' : ''}`} />
                    {isGeneratingDetails ? 'Generating...' : 'Generate analysis'}
                  </button>
                )}
              </div>
            </div>

            {rankingRows.length > 0 && (
              <div className="px-4 pb-3">
                <RankingsSnapshotCard
                  rows={rankingRows}
                  baselineVersionId={baselineRow?.versionId}
                  baselineScore={baselineRow?.finalScore ?? null}
                  onRowClick={onVersionClick}
                />
              </div>
            )}
          </div>

          <div className="px-5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 rounded-b-xl">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Deep analysis provides narrative guidance and is separate from numeric scoring. The winner is determined solely by the scoring engine.
            </p>
          </div>
        </div>

        {/* B. Best Performing Version — below rankings */}
        {winnerRow && (
          <div className="mb-4">
            <WinnerHeroCard
              winnerRow={{ ...winnerRow, absoluteScore: absoluteScoreMap?.[winnerRow.versionId] }}
              finalRecommendation={comparison.finalRecommendation}
              priorityActions={comparison.priorityActions}
              scoringGap={scoringGap}
              onViewWinningCopy={() => onVersionClick?.(winnerRow.versionId)}
              onJumpToAnalysis={() => handleJumpToBreakdown(winnerRow.versionId, 'output')}
              allVersions={comparison.rows}
              winnerBreakdown={comparison.winnerBreakdown}
              decisionLayer={comparison.decisionLayer}
              baselineScore={baselineRow?.finalScore ?? null}
              baselineAbsTotal={baselineRow ? (absoluteScoreMap?.[baselineRow.versionId]?.total ?? null) : null}
            />
          </div>
        )}

        {/* C. ActionPanel slot — absorbed into WinnerHeroCard, renders null */}
        <ActionPanel
          finalRecommendation={comparison.finalRecommendation}
          priorityActions={comparison.priorityActions}
          winnerLabel={winnerLabel}
        />

        {/* E. Per-version Analysis Cards */}
        <div className="space-y-3">
          {sortedRows.map((row) => {
            const analysis = versionDeepAnalysis?.[row.versionId];
            const isLoadingThis = loadingVersionIds?.has(row.versionId) ?? false;
            const isExpanded = expandedVersionIds[row.versionId] === true;
            const isRowBaseline = row.versionId === baselineRow?.versionId;
            const delta = isRowBaseline ? null : getComparisonDelta(row.finalScore, baselineRow?.finalScore);
            const contentText = versionContentMap?.[row.versionId] || '';
            const decisionBadge = decisionBadges.get(row.versionId);
            const baselineAbsTotal = baselineRow ? (absoluteScoreMap?.[baselineRow.versionId]?.total ?? null) : null;

            const isWinner = row.versionId === comparison.winnerVersionId;
            const winnerExplanation = isWinner ? comparison.winnerExplanation : undefined;
            const winnerFactors = isWinner ? comparison.winnerFactors : undefined;
            const winnerBreakdown = isWinner ? comparison.winnerBreakdown : undefined;
            const decisionLayer = isWinner ? comparison.decisionLayer : undefined;

            return (
              <VersionAnalysisCard
                key={row.versionId}
                row={row}
                analysis={analysis}
                isExpanded={isExpanded}
                isLoading={isLoadingThis}
                isBaseline={isRowBaseline}
                deltaPoints={delta?.deltaPoints ?? null}
                deltaPercent={delta?.deltaPercent ?? null}
                onToggle={() => handleToggleVersionCard(row.versionId)}
                onViewOutput={() => onVersionClick?.(row.versionId)}
                onEnsureAnalysis={
                  onEnsureVersionDeepAnalysis
                    ? () => onEnsureVersionDeepAnalysis(row.versionId)
                    : undefined
                }
                contentText={contentText}
                decisionBadge={decisionBadge}
                allVersions={comparison.rows}
                winnerExplanation={winnerExplanation}
                winnerFactors={winnerFactors}
                winnerBreakdown={winnerBreakdown}
                decisionLayer={decisionLayer}
                absoluteScore={absoluteScoreMap?.[row.versionId]}
                baselineAbsTotal={baselineAbsTotal}
              />
            );
          })}

          {isGeneratingDetails && !hasDeepAnalysis && (
            <div className="flex flex-col items-center gap-3 py-8 text-gray-500 dark:text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
              <p className="text-sm font-medium">Generating detailed analysis...</p>
            </div>
          )}
        </div>

        {/* F. Scoring Context + Debug */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-600">
              Scoring context:
            </span>
            {useCaseLabel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                <Target className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                {useCaseLabel}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
              seoOn
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
            }`}>
              SEO: {seoOn ? 'On' : 'Off'}
            </span>
            {kwCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                Keywords: {kwCount}
              </span>
            )}
            {scoringVersion && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 font-mono">
                {scoringVersion}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {debugEnabled && (
              <button
                onClick={() => setShowDebugModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                View Logs
              </button>
            )}
            <button
              onClick={handleDebugToggle}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                debugEnabled
                  ? 'text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                  : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              Debug
              <span className={`ml-1 w-2 h-2 rounded-full ${debugEnabled ? 'bg-gray-600 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`} />
            </button>
          </div>
        </div>
      </div>

      {showDebugModal && (
        <DebugInfoModal onClose={() => setShowDebugModal(false)} />
      )}
    </div>
  );
};
