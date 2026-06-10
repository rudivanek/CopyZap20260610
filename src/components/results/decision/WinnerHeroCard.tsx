import React from 'react';
import { ArrowRight, Award } from 'lucide-react';
import { getScoreTextClass } from '../../../utils/scoreColors';
import { AbsoluteScoreBreakdown } from '../../../types';
import { getComparisonDelta } from '../../../utils/comparisonDelta';

interface WinnerRow {
  versionId: string;
  optionLabel: string;
  finalScore: number;
  decisionSummary?: string;
  decisionReason?: string;
  subScores?: {
    conversion: number;
    trust: number;
    risk: number;
  };
  absoluteScore?: AbsoluteScoreBreakdown;
}

interface FinalRecommendation {
  winnerId: string;
  why: string;
  nextSteps: string[];
}

interface PriorityAction {
  title: string;
  reason: string;
}

interface WinnerBreakdown {
  coreStrength: string;
  whatItDoesBetter: string[];
  tradeoffs: string[];
}

interface DecisionLayer {
  recommendedVersionId: string;
  recommendedLabel: string;
  recommendedUseCase: string;
  publishRecommendation: string;
  alternativeChoiceNote: string;
  nextBestVersionId?: string;
  nextBestLabel?: string;
  nextImprovementAction: string;
}

interface WinnerHeroCardProps {
  winnerRow: WinnerRow;
  finalRecommendation?: FinalRecommendation;
  priorityActions?: PriorityAction[];
  scoringGap?: number;
  onViewWinningCopy?: () => void;
  onJumpToAnalysis?: () => void;
  allVersions?: WinnerRow[];
  winnerBreakdown?: WinnerBreakdown;
  decisionLayer?: DecisionLayer;
  baselineScore?: number | null;
  baselineAbsTotal?: number | null;
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ label, children }) => (
  <div className="border-t border-green-100 dark:border-green-900/30 pt-3 mt-3">
    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
      {label}
    </span>
    <div className="mt-2">{children}</div>
  </div>
);

function deltaBadgeClass(positive: boolean): string {
  return positive
    ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800';
}

export const WinnerHeroCard: React.FC<WinnerHeroCardProps> = ({
  winnerRow,
  finalRecommendation,
  priorityActions,
  onViewWinningCopy,
  winnerBreakdown,
  decisionLayer,
  baselineScore,
  baselineAbsTotal,
}) => {
  const rec = finalRecommendation;
  const steps = rec?.nextSteps?.slice(0, 3) ?? [];
  const fallback = priorityActions?.slice(0, 3).map(p => p.title) ?? [];
  const actions = steps.length > 0 ? steps : fallback;

  const sessionDelta = baselineScore != null
    ? getComparisonDelta(winnerRow.finalScore, baselineScore)
    : null;

  const quickWhyBullets = winnerBreakdown?.whatItDoesBetter?.slice(0, 3).map(item => {
    return item.replace(/^(Compared to|vs\.?)\s+[^,]+,\s*/i, '');
  }) ?? [];

  const comparisonBullets = winnerBreakdown?.whatItDoesBetter?.slice(0, 4).map(item => {
    const match = item.match(/^(Compared to|vs\.?)\s+([^,]+),\s*(.+)$/i);
    if (match) {
      return { version: match[2].trim(), benefit: match[3].trim() };
    }
    return { version: '', benefit: item };
  }) ?? [];

  const coreSummary = winnerBreakdown?.coreStrength || (quickWhyBullets.length > 0 ? quickWhyBullets[0] : null);

  return (
    <div
      id="results-winner"
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden shadow-sm border-l-4 border-l-green-600"
    >
      <div className="px-5 pt-4 pb-5">
        {/* Label row */}
        <div className="flex items-center gap-1.5 mb-3">
          <Award className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
            Best Performing Version
          </span>
        </div>

        {/* Title + Score */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
              {winnerRow.optionLabel}
            </h2>
            {coreSummary && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                {coreSummary}
              </p>
            )}
          </div>

          {/* Session score only */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[9px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">Session</span>
            <span className={`text-2xl font-black tabular-nums leading-none ${getScoreTextClass(winnerRow.finalScore)}`}>
              {winnerRow.finalScore}
            </span>
            {sessionDelta && !sessionDelta.neutral ? (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums whitespace-nowrap ${deltaBadgeClass(sessionDelta.positive)}`}>
                {sessionDelta.label}
              </span>
            ) : (
              <span className="text-[10px] text-gray-300 dark:text-gray-700">—</span>
            )}
          </div>
        </div>

        {/* Why This Wins */}
        {quickWhyBullets.length > 0 && (
          <Section label="Why This Wins">
            <ul className="space-y-1.5">
              {quickWhyBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Recommendation */}
        {decisionLayer && (
          <Section label="Recommendation">
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-0.5">Use this if:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {decisionLayer.recommendedUseCase}
                </p>
              </div>
              {decisionLayer.alternativeChoiceNote && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-0.5">Avoid if:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {decisionLayer.alternativeChoiceNote}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-0.5">Next step:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {decisionLayer.publishRecommendation}
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* Why This Beats Others */}
        {comparisonBullets.length > 0 && (
          <Section label="Why This Beats Others">
            <ul className="space-y-1.5">
              {comparisonBullets.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-green-600 flex-shrink-0">•</span>
                  {item.version ? (
                    <span>
                      <span className="font-semibold">vs {item.version}</span> — {item.benefit}
                    </span>
                  ) : (
                    <span>{item.benefit}</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Minor Considerations */}
        {winnerBreakdown?.tradeoffs && winnerBreakdown.tradeoffs.length > 0 && (
          <Section label="Minor Considerations">
            <ul className="space-y-1.5">
              {winnerBreakdown.tradeoffs.map((tradeoff, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0 mt-0.5">•</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{tradeoff}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Do This Next */}
        {actions.length > 0 && (
          <Section label="Do This Next">
            <ol className="space-y-1.5">
              {actions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* CTA Button */}
        {onViewWinningCopy && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onViewWinningCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
            >
              View winning copy
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
