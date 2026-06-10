/**
 * MULTI-SCORE DISPLAY COMPONENT - PHASE 1.2 (With Explanations)
 *
 * IMPORTANT: This component displays UI-ONLY explanatory scores.
 * These scores DO NOT affect ranking, winner selection, or final scores.
 * They are derived heuristics to help users understand version differences.
 */

import React, { useState } from 'react';
import { TrendingUp, Shield, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import {
  calculateMultiScoreDisplay,
  calculateMultiScoreDisplayDetailed,
  getRiskLevelColor,
  getRiskLevelBg,
  getShortRiskLabel,
  getRiskLevelLabel
} from '../../utils/multiScoreDisplay';
import { getScoreLabel, generateScoreSummary } from '../../utils/scoreInterpretation';

interface MultiScoreDisplayProps {
  text: string;
  compact?: boolean; // Always defaults to compact for consistency
  showExplanation?: boolean; // Phase 1.2: Whether to show explanation trigger
}

/**
 * MultiScoreDisplay - Shows Conversion, Trust, and Risk scores
 *
 * Phase 1.2: Added "Why?" explanations with inline expansion.
 * These are display-only heuristics that do not affect ranking.
 */
export const MultiScoreDisplay: React.FC<MultiScoreDisplayProps> = ({
  text,
  compact = true,
  showExplanation = true
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const scores = calculateMultiScoreDisplay(text);
  const detailedScores = isExplanationOpen ? calculateMultiScoreDisplayDetailed(text) : null;

  return (
    <div className="inline-flex flex-col gap-2 w-full">
      {/* Compact inline badges with optional explanation toggle */}
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        {/* Conversion Score with Label */}
        <div
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
          title="Conversion Score: Potential to drive action"
        >
          <TrendingUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 tabular-nums">
            {scores.conversion}
          </span>
          <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
            ({getScoreLabel(scores.conversion)})
          </span>
        </div>

        {/* Trust Score with Label */}
        <div
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
          title="Trust Score: Credibility and authenticity"
        >
          <Shield className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 tabular-nums">
            {scores.trust}
          </span>
          <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
            ({getScoreLabel(scores.trust)})
          </span>
        </div>

        {/* Risk Level */}
        <div
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${getRiskLevelBg(scores.risk)}`}
          title={getRiskLevelLabel(scores.risk)}
        >
          <AlertTriangle className={`w-3 h-3 ${getRiskLevelColor(scores.risk)}`} />
          <span className={`text-[10px] font-medium ${getRiskLevelColor(scores.risk)}`}>
            {getShortRiskLabel(scores.risk)}
          </span>
        </div>

        {/* Phase 1.2: Explanation Toggle */}
        {showExplanation && (
          <button
            type="button"
            onClick={() => setIsExplanationOpen(!isExplanationOpen)}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={isExplanationOpen ? 'Hide explanation' : 'Show why these scores'}
            title="Click to see why these scores"
          >
            <Info className="w-3 h-3" />
            <span>Why?</span>
            {isExplanationOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Phase 1.2-1.3: Inline Explanation Panel */}
      {isExplanationOpen && detailedScores && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-xs animate-fadeIn">
          {/* Decision-oriented summary (NEW) */}
          <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800 font-medium">
            {generateScoreSummary(detailedScores.conversion.score, detailedScores.trust.score, detailedScores.risk.level)}
          </p>

          <div className="space-y-2.5">
            {/* Conversion Explanation with Label */}
            {detailedScores.conversion.reasons.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-[11px] text-gray-700 dark:text-gray-300">
                    Conversion: {detailedScores.conversion.score} ({getScoreLabel(detailedScores.conversion.score)})
                  </span>
                </div>
                <ul className="space-y-0.5 ml-4">
                  {detailedScores.conversion.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className={reason.isPositive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}>
                        {reason.isPositive ? '+' : '−'}
                      </span>
                      <span className="text-[11px] text-gray-600 dark:text-gray-400">{reason.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust Explanation with Label */}
            {detailedScores.trust.reasons.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-[11px] text-gray-700 dark:text-gray-300">
                    Trust: {detailedScores.trust.score} ({getScoreLabel(detailedScores.trust.score)})
                  </span>
                </div>
                <ul className="space-y-0.5 ml-4">
                  {detailedScores.trust.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className={reason.isPositive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}>
                        {reason.isPositive ? '+' : '−'}
                      </span>
                      <span className="text-[11px] text-gray-600 dark:text-gray-400">{reason.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Explanation */}
            {detailedScores.risk.reasons.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-[11px] text-gray-700 dark:text-gray-300">
                    Risk: {getShortRiskLabel(detailedScores.risk.level)}
                  </span>
                </div>
                <ul className="space-y-0.5 ml-4">
                  {detailedScores.risk.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-gray-600 dark:text-gray-500">•</span>
                      <span className="text-[11px] text-gray-600 dark:text-gray-400">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Phase 1.3: Quiet empty state */}
            {detailedScores.conversion.reasons.length === 0 &&
             detailedScores.trust.reasons.length === 0 &&
             detailedScores.risk.reasons.length === 0 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-500 italic">
                No strong display signals detected
              </p>
            )}
          </div>

          <p className="text-[10px] text-gray-500 dark:text-gray-500 italic mt-2.5 pt-2 border-t border-gray-200 dark:border-gray-800">
            Display-only signals • Do not affect ranking
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Helper text component - Shows once above sections
 * Phase 1.1: More concise, non-intrusive explanation
 */
export const MultiScoreHelperText: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded px-3 py-2 mb-3">
      <p className="text-xs text-gray-600 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">Sub-scores:</span>{' '}
        Conversion, Trust, and Risk signals help explain version differences. These do not affect ranking.
      </p>
    </div>
  );
};
