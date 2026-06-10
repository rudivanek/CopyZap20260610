import React, { useState, useMemo } from 'react';
import GeneratedCopyCard from '../../../GeneratedCopyCard';
import { ComprehensiveComparisonTable } from '../../../results/ComprehensiveComparisonTable';
import ComparisonWarningModal from '../../../ComparisonWarningModal';
import ScoringContextModal from '../modals/ScoringContextModal';
import NextStepSuggestion from '../../guidance/NextStepSuggestion';
import UpgradeHint from '../../guidance/UpgradeHint';
import { BestElementsCard } from '../../../results/BestElementsCard';
import { GeneratedContentItem, GeneratedContentItemType, FormState, User, VersionDeepAnalysis, ComparisonDeepAnalysisMeta, ScoringContext, AbsoluteScoreBreakdown } from '../../../../types';
import { ComparisonResult } from '../../../../services/api/comprehensiveScoring';
import { Button } from '../../../ui/button';
import { Sparkles, Lock, Brain, RefreshCw, GitMerge, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface ResultsPanelProps {
  generatedVersions: GeneratedContentItem[];
  formState: FormState;
  currentUser?: User;
  onAlternative: (item: GeneratedContentItem) => void;
  onRestyle: (item: GeneratedContentItem, persona: string, instructions?: string) => void;
  onScore: (item: GeneratedContentItem) => void;
  onGenerateFaqSchema: (content: string) => void;
  onModify: (item: GeneratedContentItem, instruction: string) => void;
  onDelete: (item: GeneratedContentItem) => void;
  targetWordCount: number;
  comparisonResult?: ComparisonResult | null;
  onBlendVersions?: (grokAnalysisContent?: string) => void;
  isBlending?: boolean;
  onSaveAsBrandVoice?: (content: string) => void;
  onCompareWithGrok?: (isIncremental?: boolean, scoringContext?: ScoringContext) => void;
  onRescoreAll?: () => void;
  onScoreNewOutputs?: () => void;
  isScoringNewOutputs?: boolean;
  onAddToComparison?: (card: GeneratedContentItem) => void;
  isLoading?: boolean;
  onUpdateCard?: (cardId: string, updates: Partial<GeneratedContentItem>) => void;
  comparisonOutdated?: boolean;
  onBoost?: (item: GeneratedContentItem) => void;
  // Deep analysis props
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>;
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta;
  onGenerateDetailedAnalysis?: () => void;
  isGeneratingDetails?: boolean;
  onEnsureVersionDeepAnalysis?: (versionId: string) => Promise<void>;
  loadingVersionIds?: Set<string>;
  showScoringContextModal?: boolean;
  onSetShowScoringContextModal?: (show: boolean) => void;
  modalInitialContext?: ScoringContext | undefined;
  onSetModalInitialContext?: (context: ScoringContext | undefined) => void;
  onScoringContextConfirm?: (ctx: ScoringContext) => void;
  bestElementsResult?: import('../../../../services/api/bestElements').BestElementsResult;
  onCompileBestElements?: () => void;
  isCompiling?: boolean;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  generatedVersions,
  formState,
  currentUser,
  onAlternative,
  onRestyle,
  onScore,
  onGenerateFaqSchema,
  onModify,
  onDelete,
  targetWordCount,
  comparisonResult,
  onBlendVersions,
  isBlending,
  onSaveAsBrandVoice,
  onCompareWithGrok,
  onRescoreAll,
  onScoreNewOutputs,
  isScoringNewOutputs,
  onAddToComparison,
  isLoading,
  onUpdateCard,
  comparisonOutdated = false,
  onBoost,
  versionDeepAnalysis,
  comparisonDeepAnalysisMeta,
  onGenerateDetailedAnalysis,
  isGeneratingDetails,
  onEnsureVersionDeepAnalysis,
  loadingVersionIds,
  showScoringContextModal: externalShowScoringContextModal,
  onSetShowScoringContextModal,
  modalInitialContext: externalModalInitialContext,
  onSetModalInitialContext,
  onScoringContextConfirm,
  bestElementsResult,
  onCompileBestElements,
  isCompiling,
}) => {
  const [showWarningModal, setShowWarningModal] = useState(false);
  // Use external state if provided, otherwise use local state
  const [localShowScoringContextModal, setLocalShowScoringContextModal] = useState(false);
  const [localModalInitialContext, setLocalModalInitialContext] = useState<ScoringContext | undefined>(undefined);

  const showScoringContextModal = externalShowScoringContextModal ?? localShowScoringContextModal;
  const setShowScoringContextModal = onSetShowScoringContextModal ?? setLocalShowScoringContextModal;
  const modalInitialContext = externalModalInitialContext ?? localModalInitialContext;
  const setModalInitialContext = onSetModalInitialContext ?? setLocalModalInitialContext;

  const [pendingNewContext, setPendingNewContext] = useState<ScoringContext | null>(null);
  const [isContextChangeMode, setIsContextChangeMode] = useState(false);
  const [showOutputs, setShowOutputs] = useState(true);
  const [nextStepDismissed, setNextStepDismissed] = useState(false);

  const contextChanged = pendingNewContext !== null;

  React.useEffect(() => {
    setPendingNewContext(null);
  }, [comparisonResult]);

  React.useEffect(() => {
    setNextStepDismissed(false);
  }, [generatedVersions.length]);


  // Calculate if we have enough items to compare
  const originalCopy = formState.tab === 'improve' ? formState.originalCopy : undefined;
  const totalItems = (originalCopy ? 1 : 0) + generatedVersions.length;
  const canCompare = totalItems >= 2;

  // Check if there's already an AI comparison result
  const hasAiComparison = !!comparisonResult;

  // Recommended maximum outputs for comparison
  const RECOMMENDED_MAX_OUTPUTS = 5;

  // PHASE 1.3: Create content map for multi-score display in expanded version analysis
  const versionContentMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Add generated versions
    generatedVersions.forEach(item => {
      if (typeof item.content === 'string') {
        map[item.id] = item.content;
      } else if (Array.isArray(item.content)) {
        // For headline arrays, join them
        map[item.id] = item.content.join('\n');
      } else if (item.content && typeof item.content === 'object') {
        // For structured content, extract all text values
        const structuredContent = item.content as Record<string, any>;
        const allText = Object.values(structuredContent)
          .filter(val => typeof val === 'string')
          .join('\n\n');
        map[item.id] = allText;
      }
    });

    // Add original copy if present
    if (originalCopy && typeof originalCopy === 'string') {
      map['__original__'] = originalCopy;
    }

    return map;
  }, [generatedVersions, originalCopy]);

  const absoluteScoreMap = useMemo(() => {
    const map: Record<string, AbsoluteScoreBreakdown> = {};
    generatedVersions.forEach(item => {
      if (item.absoluteScore) map[item.id] = item.absoluteScore;
    });
    return map;
  }, [generatedVersions]);

  const openScoringModal = (initial?: ScoringContext) => {
    setModalInitialContext(initial);
    setShowScoringContextModal(true);
  };

  const handleAnalyzeClick = () => {
    if (totalItems > RECOMMENDED_MAX_OUTPUTS) {
      setModalInitialContext(undefined);
      setShowWarningModal(true);
    } else {
      openScoringModal(undefined);
    }
  };

  const handleProceedWithAnalysis = () => {
    setShowWarningModal(false);
    openScoringModal(undefined);
  };

  const handleChangeContext = () => {
    setIsContextChangeMode(true);
    openScoringModal(pendingNewContext ?? comparisonResult?.scoringContext ?? undefined);
  };

  const handleScoringContextConfirm = (ctx: ScoringContext) => {
    setShowScoringContextModal(false);
    setIsContextChangeMode(false);

    if (isContextChangeMode && comparisonResult) {
      const locked = comparisonResult.scoringContext;
      const isSame = locked?.useCaseKey === ctx.useCaseKey && locked?.useCaseLabel === ctx.useCaseLabel;
      if (!isSame) {
        setPendingNewContext(ctx);
      }
      return;
    }

    // Use external handler if provided, otherwise fall back to onCompareWithGrok
    if (onScoringContextConfirm) {
      onScoringContextConfirm(ctx);
    } else {
      onCompareWithGrok?.(false, ctx);
    }
  };

  const handleApplyNewContextRescoreAll = () => {
    if (!pendingNewContext) return;
    onCompareWithGrok?.(false, pendingNewContext);
  };

  const handleRescoreWithUpdatedChanges = () => {
    onCompareWithGrok?.(false, comparisonResult?.scoringContext ?? undefined);
  };

  // Determine the analysis mode from the first card (all cards from same generation should have same mode)
  const analysisMode = generatedVersions.length > 0 ? generatedVersions[0].analysisMode : undefined;

  // Debug logging for comparison result
  React.useEffect(() => {
    console.log('🎯 ResultsPanel received comparisonResult:', {
      hasComparisonResult: !!comparisonResult,
      comparisonResult: comparisonResult
    });
  }, [comparisonResult]);

  // Count output cards not yet in the comparison
  const missingFromComparison = React.useMemo(() => {
    if (!comparisonResult) return 0;
    const comparedIds = new Set((comparisonResult.rows ?? []).map((r) => r.versionId));
    return generatedVersions.filter((v) => !v.comparedContent && !comparedIds.has(v.id)).length;
  }, [comparisonResult, generatedVersions]);

  // Sort generatedVersions: regular outputs first, analysis cards (with comparedContent) at the bottom
  const sortedGeneratedVersions = React.useMemo(() => {
    const regularOutputs = generatedVersions.filter(card => !card.comparedContent);
    const analysisCards = generatedVersions.filter(card => card.comparedContent);
    return [...regularOutputs, ...analysisCards];
  }, [generatedVersions]);

  const topPerformerRow = React.useMemo(() => {
    if (!comparisonResult) return null;
    return (comparisonResult.rows ?? []).find(r => r.isWinner) ?? null;
  }, [comparisonResult]);

  const comparisonInsight = React.useMemo(() => {
    if (!comparisonResult || (comparisonResult.rows ?? []).length < 2) return null;
    const sorted = [...(comparisonResult.rows ?? [])].sort((a, b) => b.finalScore - a.finalScore);
    const first = sorted[0];
    const second = sorted[1];
    const gap = first.finalScore - second.finalScore;
    if (gap <= 3) return `${first.optionLabel} and ${second.optionLabel} are very close in score.`;
    if (second.bestUseCase) {
      return `${first.optionLabel} leads in score. ${second.optionLabel} is ${second.bestUseCase.toLowerCase()}.`;
    }
    return `${first.optionLabel} leads by ${gap} points over ${second.optionLabel}.`;
  }, [comparisonResult]);

  const nextStep = React.useMemo((): { message: string; actionLabel?: string; onAction?: () => void } | null => {
    const regularVersions = generatedVersions.filter(v => !v.comparedContent);
    if (hasAiComparison) {
      return { message: 'Export the winner or try a different voice style.' };
    }
    if (regularVersions.length === 1) {
      return { message: 'Generate another version to compare side by side.' };
    }
    if (regularVersions.length >= 2 && canCompare && onCompareWithGrok) {
      return {
        message: 'Compare versions and pick the strongest one.',
        actionLabel: 'Run Analysis',
        onAction: handleAnalyzeClick,
      };
    }
    return null;
  }, [generatedVersions, hasAiComparison, canCompare, onCompareWithGrok]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 mb-16">
        <h2 className="text-base font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5">Generated Copies</h2>

        {/* Analysis Mode Indicator */}
        {analysisMode && (
          <div className={`mb-4 p-3 rounded-lg border ${
            analysisMode === 'batch'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
          }`}>
            <div className="flex items-center gap-2">
              {analysisMode === 'batch' ? (
                <>
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    Batch Analysis Mode Active
                  </span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    On-Demand Analysis Mode
                  </span>
                </>
              )}
            </div>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
              {analysisMode === 'batch'
                ? 'Analyses were generated automatically based on selected options.'
                : 'Generate analyses only for the outputs you choose.'}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Collapsible generated copies section */}
          <div>
            <button
              type="button"
              onClick={() => setShowOutputs(prev => !prev)}
              className="flex items-center gap-2 w-full text-left mb-3 group"
            >
              {showOutputs
                ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
              }
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                {showOutputs ? 'Hide' : 'Show'} Output Cards ({sortedGeneratedVersions.length})
              </span>
            </button>

            {(topPerformerRow || comparisonInsight) && (
              <div className="mb-3 flex flex-col gap-0.5">
                {topPerformerRow && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Top performer: <span className="font-medium text-gray-700 dark:text-gray-300">{topPerformerRow.optionLabel}</span>
                    <span className="ml-1 text-gray-400 dark:text-gray-600">· Session {topPerformerRow.finalScore}/100</span>
                    {absoluteScoreMap[topPerformerRow.versionId] && (
                      <span className="ml-1 font-medium" style={{ color: (() => { const t = absoluteScoreMap[topPerformerRow.versionId].total; return t <= 65 ? '#dc2626' : t <= 75 ? '#d97706' : t <= 85 ? '#16a34a' : '#1d4ed8'; })() }}>
                        · Abs {absoluteScoreMap[topPerformerRow.versionId].total}/100
                      </span>
                    )}
                  </p>
                )}
                {comparisonInsight && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{comparisonInsight}</p>
                )}
              </div>
            )}

            {showOutputs && (
              <div className="space-y-10">
                {sortedGeneratedVersions
                  .filter(card => card.type !== GeneratedContentItemType.GeoOptimized)
                  .map((card, index) => {
                    const geoPackage = sortedGeneratedVersions.find(
                      v => v.type === GeneratedContentItemType.GeoOptimized && v.sourceId === card.id
                    );
                    return (
                      <React.Fragment key={card.id}>
                        {index === 0 && nextStep && !nextStepDismissed && (
                          <div
                            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-5 py-4"
                            style={{ marginBottom: 4 }}
                          >
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {hasAiComparison
                                ? 'You can now export the winner or refine further.'
                                : generatedVersions.filter(v => !v.comparedContent).length === 1
                                  ? 'Create another version to compare results.'
                                  : 'Before choosing, compare your versions to see which performs best.'}
                            </p>
                            {nextStep.actionLabel && nextStep.onAction && (
                              <button
                                type="button"
                                onClick={nextStep.onAction}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                              >
                                {nextStep.actionLabel}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                        <div id={`output-card-${card.id}`}>
                          <GeneratedCopyCard
                            card={card}
                            isPrimary={index === 0}
                            indentationLevel={0}
                            isLastInThread={true}
                            formState={formState}
                            currentUser={currentUser}
                            onCreateAlternative={() => onAlternative(card)}
                            onApplyVoiceStyle={(persona, instructions) => onRestyle(card, persona, instructions)}
                            onGenerateScore={() => onScore(card)}
                            onGenerateFaqSchema={onGenerateFaqSchema}
                            onModifyContent={(instruction) => onModify(card, instruction)}
                            onDelete={() => onDelete(card)}
                            targetWordCount={targetWordCount}
                            onSaveAsBrandVoice={onSaveAsBrandVoice}
                            onBlendVersions={onBlendVersions}
                            isBlending={isBlending}
                            onUpdateCard={onUpdateCard}
                            allCards={sortedGeneratedVersions}
                            comparisonResult={comparisonResult}
                            onAddToComparison={onAddToComparison}
                            versionScores={formState.copyResult?.versionScores}
                            onPerformanceBoost={onBoost ? () => onBoost(card) : undefined}
                            geoPackage={geoPackage}
                          />
                        </div>
                      </React.Fragment>
                    );
                  })}
              </div>
            )}
          </div>

          {comparisonResult && onCompareWithGrok && (
            <div className="flex justify-end items-center gap-2 mb-3 pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleRescoreWithUpdatedChanges}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Re-Score
              </button>
              <button
                onClick={handleChangeContext}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3 h-3" />
                Change scoring context
              </button>
            </div>
          )}

          <div className="performance-table-wrapper" style={{ display: 'block', height: 'auto', overflow: 'visible' }}>
            {bestElementsResult && (
              <div className="mb-6">
                <BestElementsCard
                  result={bestElementsResult}
                  onJumpToVersion={(versionId) => {
                    const el = document.getElementById(`output-${versionId}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  onCompile={onCompileBestElements}
                  isCompiling={isCompiling}
                />
              </div>
            )}
            {comparisonResult && (
              <ComprehensiveComparisonTable
                comparison={comparisonResult}
                baselineVersionId={
                  (comparisonResult.rows ?? []).some(r => r.versionId === '__original__')
                    ? '__original__'
                    : undefined
                }
                onVersionClick={(versionId) => {
                  if (versionId === '__original__') return;
                  const element = document.getElementById(`output-${versionId}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                isRescoring={isLoading}
                missingCount={missingFromComparison}
                onScoreNewOutputs={contextChanged ? undefined : onScoreNewOutputs}
                isScoringNewOutputs={isScoringNewOutputs}
                contextChanged={contextChanged}
                pendingContextLabel={pendingNewContext?.useCaseLabel}
                onApplyNewContextRescoreAll={handleApplyNewContextRescoreAll}
                isApplyingNewContext={isLoading}
                comparisonOutdated={comparisonOutdated && !contextChanged}
                onRescoreWithUpdatedChanges={handleRescoreWithUpdatedChanges}
                versionDeepAnalysis={versionDeepAnalysis}
                comparisonDeepAnalysisMeta={comparisonDeepAnalysisMeta}
                onGenerateDetailedAnalysis={onGenerateDetailedAnalysis}
                isGeneratingDetails={isGeneratingDetails}
                onEnsureVersionDeepAnalysis={onEnsureVersionDeepAnalysis}
                loadingVersionIds={loadingVersionIds}
                versionContentMap={versionContentMap}
                absoluteScoreMap={absoluteScoreMap}
              />
            )}
          </div>

          {hasAiComparison && (
            <UpgradeHint versionCount={generatedVersions.length} />
          )}

        </div>

        {/* Next-step guidance */}
        {nextStep && !nextStepDismissed && (
          <div className="mt-6">
            <NextStepSuggestion
              message={nextStep.message}
              actionLabel={nextStep.actionLabel}
              onAction={nextStep.onAction}
              onDismiss={() => setNextStepDismissed(true)}
            />
          </div>
        )}

        {/* Warning Modal for Large Number of Outputs */}
        <ComparisonWarningModal
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          onProceed={handleProceedWithAnalysis}
          outputCount={totalItems}
          recommendedMax={RECOMMENDED_MAX_OUTPUTS}
        />

        {/* Scoring Context Modal */}
        <ScoringContextModal
          isOpen={showScoringContextModal}
          onClose={() => { setShowScoringContextModal(false); setIsContextChangeMode(false); }}
          onConfirm={handleScoringContextConfirm}
          initialContext={modalInitialContext}
          isChangeContext={isContextChangeMode}
        />

    </div>
  );
};

export default ResultsPanel;