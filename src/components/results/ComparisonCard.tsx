import React from 'react';
import { Award, TrendingUp, AlertCircle, CheckCircle, Target, Lightbulb, BarChart3, RefreshCw, RotateCcw, Clock } from 'lucide-react';
import { ComparisonResult } from '../../services/api/comprehensiveScoring'; // phase 1 scoring cleanup: updated import path
import { getScoreTextClass } from '../../utils/scoreColors';
import { Button } from '../ui/button';
import { GeneratedContentItem } from '../../types';
import { SubScoreChips } from './SubScoreChips';
import { calculateMultiScoreDisplay } from '../../utils/multiScoreDisplay';

interface ComparisonCardProps {
  comparison: ComparisonResult;
  analyzedOutputIds?: string[];
  lastAnalyzedAt?: string;
  allOutputs?: GeneratedContentItem[];
  onUpdateAnalysis?: () => void;
  onReanalyzeAll?: () => void;
  isUpdating?: boolean;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({
  comparison,
  analyzedOutputIds = [],
  lastAnalyzedAt,
  allOutputs = [],
  onUpdateAnalysis,
  onReanalyzeAll,
  isUpdating = false
}) => {
  // Calculate which outputs are new (not in the analysis yet)
  const newOutputIds = allOutputs
    .filter(output => !output.comparedContent) // Exclude the analysis card itself
    .filter(output => !analyzedOutputIds.includes(output.id))
    .map(output => output.id);

  const hasNewOutputs = newOutputIds.length > 0;

  return (
    <div className="comparison-card-anchor bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-6 animate-fadeIn">
      {/* Header with Update Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Award className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Best Version Analysis
          </h3>
        </div>

        {/* Update Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          {hasNewOutputs && onUpdateAnalysis && (
            <Button
              onClick={onUpdateAnalysis}
              disabled={isUpdating}
              size="sm"
              className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Updating...' : `Update Analysis (${newOutputIds.length} new)`}
            </Button>
          )}
          {onReanalyzeAll && (
            <Button
              onClick={onReanalyzeAll}
              disabled={isUpdating}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Re-analyze All
            </Button>
          )}
        </div>
      </div>

      {/* Analysis Info */}
      {lastAnalyzedAt && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 mb-6 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">
              Last analyzed: {new Date(lastAnalyzedAt).toLocaleString()} •
              {' '}{analyzedOutputIds.length} output{analyzedOutputIds.length !== 1 ? 's' : ''} analyzed
            </span>
          </div>
          {hasNewOutputs && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              {newOutputIds.length} new output{newOutputIds.length !== 1 ? 's' : ''} detected. Click "Update Analysis" to include {newOutputIds.length === 1 ? 'it' : 'them'}.
            </p>
          )}
        </div>
      )}


      {/* Overall Verdict Section */}
      {(comparison.bestForMarketing || comparison.bestForClarity || comparison.bestForSimplicity) && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Overall Verdict
            </h4>
          </div>
          <div className="space-y-2 text-sm">
            {comparison.bestForMarketing && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-900 dark:text-white min-w-fit">Best for marketing:</span>
                <span className="text-gray-700 dark:text-gray-300">✅ {
                  comparison.bestForMarketingId ? (
                    <a
                      href={`#output-${comparison.bestForMarketingId}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(`output-${comparison.bestForMarketingId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      {comparison.bestForMarketing}
                    </a>
                  ) : comparison.bestForMarketing
                }</span>
              </div>
            )}
            {comparison.bestForClarity && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-900 dark:text-white min-w-fit">Best for clarity and structure:</span>
                <span className="text-gray-700 dark:text-gray-300">✅ {
                  comparison.bestForClarityId ? (
                    <a
                      href={`#output-${comparison.bestForClarityId}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(`output-${comparison.bestForClarityId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      {comparison.bestForClarity}
                    </a>
                  ) : comparison.bestForClarity
                }</span>
              </div>
            )}
            {comparison.bestForSimplicity && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-900 dark:text-white min-w-fit">Best for simplicity and readability:</span>
                <span className="text-gray-700 dark:text-gray-300">✅ {
                  comparison.bestForSimplicityId ? (
                    <a
                      href={`#output-${comparison.bestForSimplicityId}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(`output-${comparison.bestForSimplicityId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      {comparison.bestForSimplicity}
                    </a>
                  ) : comparison.bestForSimplicity
                }</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Winner Section */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {comparison.bestVersionTitle}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overall Score: <span className={`${getScoreTextClass(comparison.overallScore)} font-bold`}>{comparison.overallScore}/100</span>
            </p>
          </div>
        </div>
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
          {comparison.reasoning}
        </p>
      </div>

      {/* Strengths */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
            Key Strengths
          </h5>
        </div>
        <ul className="space-y-2">
          {comparison.strengths.map((strength, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
            >
              <span className="text-gray-900 dark:text-white mt-1">•</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Improvements */}
      {comparison.improvements.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
              Suggested Improvements
            </h5>
          </div>
          <ul className="space-y-2">
            {comparison.improvements.map((improvement, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
              >
                <span className="text-gray-900 dark:text-white mt-1">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strategic Recommendation */}
      {comparison.strategicRecommendation && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
              Strategic Recommendation
            </h5>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
            {comparison.strategicRecommendation}
          </p>
        </div>
      )}

      {/* Detailed Comparison */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
            All Versions Breakdown
          </h5>
        </div>

        <div className="space-y-4">
          {comparison.comparisonDetails.map((detail, idx) => {
            const analysisId = detail.versionId ? `analysis-${detail.versionId}` : undefined;

            // Debug: Log the analysis section ID
            if (analysisId) {
              console.log(`📍 Creating analysis section: "${detail.versionTitle}" with ID: ${analysisId}`);
            } else {
              console.warn(`⚠️ No versionId for analysis section: "${detail.versionTitle}"`);
            }

            return (
              <div
                key={idx}
                id={analysisId}
                className={`border rounded-lg p-4 ${
                  idx === comparison.bestVersionIndex
                    ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col gap-1">
                  <h6 className="font-semibold text-gray-900 dark:text-white">
                    {detail.versionId ? (
                      <a
                        href={`#output-${detail.versionId}`}
                        className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(`output-${detail.versionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      >
                        {detail.versionTitle}
                      </a>
                    ) : detail.versionTitle}
                    {idx === comparison.bestVersionIndex && ' 👑'}
                  </h6>
                  {detail.versionId && (
                    <div className="flex items-center gap-3">
                      <a
                        href={`#output-${detail.versionId}`}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline cursor-pointer flex items-center gap-1"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(`output-${detail.versionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      >
                        ← View Output Card
                      </a>
                      {detail.improvements && detail.improvements.length > 0 && (
                        <a
                          href={`#improvements-${detail.versionId}`}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline cursor-pointer flex items-center gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(`improvements-${detail.versionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        >
                          ↓ Suggested Improvements
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-bold ${getScoreTextClass(detail.score)}`}>
                    {detail.score}/100
                  </span>
                </div>
              </div>

              {/* Sub-Score Display - Unified chip format */}
              {detail.copyText && (() => {
                const subScores = calculateMultiScoreDisplay(detail.copyText);
                return (
                  <div className="mb-3 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Sub-scores:</span>
                      <SubScoreChips
                        conversion={subScores.conversion}
                        trust={subScores.trust}
                        risk={subScores.risk}
                        compact={true}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Copy Text Preview */}
              {detail.copyText && (() => {
                try {
                  // Try to parse as JSON structured content
                  const parsed = JSON.parse(detail.copyText);

                  // Check if it's structured content with headline and sections
                  if (parsed.headline && Array.isArray(parsed.sections)) {
                    return (
                      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                        <h4 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">
                          {parsed.headline}
                        </h4>
                        {parsed.sections.slice(0, 2).map((section: any, idx: number) => (
                          <div key={idx} className="mb-2">
                            {section.title && (
                              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                {section.title}
                              </h5>
                            )}
                            {section.content && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {section.content}
                              </p>
                            )}
                            {section.listItems && section.listItems.length > 0 && (
                              <ul className="text-xs text-gray-600 dark:text-gray-400 pl-4 list-disc">
                                {section.listItems.slice(0, 2).map((item: string, iIdx: number) => (
                                  <li key={iIdx} className="line-clamp-1">{item}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                        {parsed.sections.length > 2 && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">
                            + {parsed.sections.length - 2} more section{parsed.sections.length > 3 ? 's' : ''}...
                          </p>
                        )}
                      </div>
                    );
                  }

                  // If JSON but not structured, show as formatted text
                  return (
                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-4">
                        {JSON.stringify(parsed, null, 2)}
                      </p>
                    </div>
                  );
                } catch {
                  // Not JSON, display as plain text
                  return (
                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-4">
                        {detail.copyText}
                      </p>
                    </div>
                  );
                }
              })()}

              {/* Metrics Table */}
              {detail.metrics && (
                <div className="my-3 bg-gray-100 dark:bg-gray-900/60 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      PERFORMANCE METRICS
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Tone:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{detail.metrics.tone}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Readability:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{detail.metrics.readability}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Persuasion:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{detail.metrics.persuasion}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Emotional Appeal:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{detail.metrics.emotionalAppeal}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Differentiation:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{detail.metrics.differentiation}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Conversion Potential:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{detail.metrics.conversionPotential}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Best Used For */}
              {detail.bestUsedFor && (
                <div className="mb-3 text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">Best used for:</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">{detail.bestUsedFor}</span>
                </div>
              )}

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    PROS
                  </p>
                  <ul className="space-y-1">
                    {detail.pros.map((pro, pIdx) => (
                      <li
                        key={pIdx}
                        className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1"
                      >
                        <span className="text-gray-900 dark:text-white">✅</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {detail.cons.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      CONS
                    </p>
                    <ul className="space-y-1">
                      {detail.cons.map((con, cIdx) => (
                        <li
                          key={cIdx}
                          className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1"
                        >
                          <span className="text-gray-900 dark:text-white">❌</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Version-Specific Analysis */}
              {(detail.strengths || detail.improvements || detail.strategicRecommendation) && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-4">
                  {/* Key Strengths */}
                  {detail.strengths && detail.strengths.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        <h6 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Key Strengths
                        </h6>
                      </div>
                      <ul className="space-y-1">
                        {detail.strengths.map((strength, sIdx) => (
                          <li
                            key={sIdx}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="text-gray-900 dark:text-white mt-0.5">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Improvements */}
                  {detail.improvements && detail.improvements.length > 0 && (
                    <div id={`improvements-${detail.versionId}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        <h6 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Suggested Improvements
                        </h6>
                      </div>
                      <ul className="space-y-1">
                        {detail.improvements.map((improvement, iIdx) => (
                          <li
                            key={iIdx}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="text-gray-900 dark:text-white mt-0.5">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strategic Recommendation */}
                  {detail.strategicRecommendation && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        <h6 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Strategic Recommendation
                        </h6>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                        {detail.strategicRecommendation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default ComparisonCard;
