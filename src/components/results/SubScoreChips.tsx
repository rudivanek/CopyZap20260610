/**
 * SubScoreChips - Display-only component
 *
 * Renders Conversion, Trust, and Risk scores as readable inline chips
 * with subtle color coding for better scannability.
 *
 * IMPORTANT: This is pure UI - does NOT affect scoring logic or calculations.
 *
 * When `hasSignal` is false, Conversion and Trust are the untouched neutral
 * baseline (the heuristics matched nothing — true for non-English copy and for
 * very short English copy). In that case both chips render muted with an em
 * dash instead of a number, and a qualifier line explains why. Risk is
 * pattern-based and stays live regardless.
 */

import React from 'react';

const NO_SIGNAL_QUALIFIER =
  'Conversion and Trust are estimated from English-language cues and aren\u2019t available for this copy.';

interface SubScoreChipsProps {
  conversion: number;
  trust: number;
  risk: string;
  compact?: boolean;
  showExplanation?: boolean;
  hasSignal?: boolean;
}

// Helper functions to generate human-readable explanations
function getConversionExplanation(score: number): string {
  if (score >= 80) {
    return "Strong persuasive elements and clear value proposition drive action effectively.";
  } else if (score >= 60) {
    return "Moderate persuasiveness with room to strengthen urgency and call-to-action.";
  } else if (score >= 40) {
    return "Value is present but lacks compelling urgency or strong motivators for action.";
  } else {
    return "Limited persuasive elements; needs stronger value proposition and clearer call-to-action.";
  }
}

function getTrustExplanation(score: number): string {
  if (score >= 80) {
    return "Highly credible with authentic tone, strong proof points, and trustworthy language.";
  } else if (score >= 60) {
    return "Generally credible but could benefit from more proof or softer claims.";
  } else if (score >= 40) {
    return "Some credibility concerns; claims may feel exaggerated or lack supporting evidence.";
  } else {
    return "Credibility issues detected; tone or claims may seem untrustworthy or overly aggressive.";
  }
}

function getRiskExplanation(risk: string): string {
  if (risk === 'Low') {
    return "Safe, professional tone with no red flags for spam or compliance issues.";
  } else if (risk === 'Medium') {
    return "Generally safe but contains elements that could raise minor concerns in certain contexts.";
  } else {
    return "Contains language patterns that may trigger spam filters or compliance concerns.";
  }
}

export const SubScoreChips: React.FC<SubScoreChipsProps> = ({
  conversion,
  trust,
  risk,
  compact = false,
  showExplanation = false,
  hasSignal = true,
}) => {
  const baseChipClass = compact
    ? 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium'
    : 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium';

  // Muted treatment for Conversion/Trust when the heuristic matched nothing.
  const mutedConvClass = `${baseChipClass} bg-gray-50 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700`;
  const mutedTrustClass = mutedConvClass;

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-1.5 flex-wrap">
      {/* Conversion - Blue tone, or muted when no signal */}
      {hasSignal ? (
        <span
          className={`${baseChipClass} bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900`}
        >
          <span className="font-normal text-blue-600 dark:text-blue-500">Conversion</span>
          <span className="font-semibold tabular-nums">
            {conversion}
            <span className="font-normal text-blue-400 dark:text-blue-600">/100</span>
          </span>
        </span>
      ) : (
        <span className={mutedConvClass}>
          <span className="font-normal">Conversion</span>
          <span className="font-semibold tabular-nums">&mdash;</span>
        </span>
      )}

      {/* Trust - Purple tone, or muted when no signal */}
      {hasSignal ? (
        <span
          className={`${baseChipClass} bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900`}
        >
          <span className="font-normal text-purple-600 dark:text-purple-500">Trust</span>
          <span className="font-semibold tabular-nums">
            {trust}
            <span className="font-normal text-purple-400 dark:text-purple-600">/100</span>
          </span>
        </span>
      ) : (
        <span className={mutedTrustClass}>
          <span className="font-normal">Trust</span>
          <span className="font-semibold tabular-nums">&mdash;</span>
        </span>
      )}

      {/* Risk - Neutral/warning tone based on level (always live) */}
      <span
        className={`${baseChipClass} ${
          risk === 'High'
            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900'
            : risk === 'Medium'
            ? 'bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-900'
            : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900'
        }`}
      >
        <span className={`font-normal ${
          risk === 'High'
            ? 'text-amber-600 dark:text-amber-500'
            : risk === 'Medium'
            ? 'text-gray-500 dark:text-gray-500'
            : 'text-green-600 dark:text-green-500'
        }`}>
          Risk
        </span>
        <span className="font-semibold">{risk}</span>
      </span>
      </div>

      {/* Qualifier line when the heuristic matched nothing */}
      {!hasSignal && (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {NO_SIGNAL_QUALIFIER}
        </p>
      )}

      {/* Explanation panel */}
      {showExplanation && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 animate-fadeIn">
          {hasSignal ? (
            <>
              <div>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Conversion:</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">
                  {getConversionExplanation(conversion)}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Trust:</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">
                  {getTrustExplanation(trust)}
                </p>
              </div>
            </>
          ) : (
            <div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Conversion &amp; Trust:</span>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">
                {NO_SIGNAL_QUALIFIER}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Risk:</span>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">
              {getRiskExplanation(risk)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
