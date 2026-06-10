import React from 'react';
import { getScoreTextClass, getScoreBorderClass, getScoreLabel } from '../../utils/scoreColors';

interface ScoreCardProps {
  title?: string;
  overall: number;
  clarity: string;
  persuasiveness: string;
  toneMatch: string;
  engagement: string;
  wordCountAccuracy?: number;
  improvementExplanation?: string;
  suggestions?: string[];
  isLoading: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  title = "Improvement Score",
  overall,
  clarity,
  persuasiveness,
  toneMatch,
  engagement,
  wordCountAccuracy,
  improvementExplanation,
  suggestions,
  isLoading
}) => {
  const getScoreColor = (score: number) => {
    const textClass = getScoreTextClass(score);
    const borderClass = getScoreBorderClass(score);
    return `${borderClass} ${textClass}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <div className={`w-12 h-12 rounded-full border-2 ${getScoreColor(overall)} flex items-center justify-center`}>
            <span className={`text-sm font-bold ${getScoreTextClass(overall)}`}>{isLoading ? "..." : overall || "?"}</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">/100</span>
            {!isLoading && overall > 0 && (
              <span className={`text-[10px] ${getScoreTextClass(overall)} opacity-75`}>
                {getScoreLabel(overall)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {(improvementExplanation || isLoading) && (
          <div className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Why it's improved</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-800 leading-relaxed">
              {isLoading ? "Analyzing content improvements..." : improvementExplanation || "Analysis in progress..."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Score Breakdown</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ScoreItem
              label="Clarity"
              description={isLoading ? "Evaluating clarity..." : clarity || "Waiting for analysis..."}
              isLoading={isLoading}
            />
            <ScoreItem
              label="Persuasiveness"
              description={isLoading ? "Evaluating persuasiveness..." : persuasiveness || "Waiting for analysis..."}
              isLoading={isLoading}
            />
            <ScoreItem
              label="Tone Match"
              description={isLoading ? "Evaluating tone match..." : toneMatch || "Waiting for analysis..."}
              isLoading={isLoading}
            />
            <ScoreItem
              label="Engagement"
              description={isLoading ? "Evaluating engagement..." : engagement || "Waiting for analysis..."}
              isLoading={isLoading}
            />

            {(wordCountAccuracy !== undefined || isLoading) && (
              <ScoreItem
                label="Word Count Accuracy"
                description={isLoading ? "Evaluating word count match..." : `${wordCountAccuracy || "?"}/100 - ${
                  wordCountAccuracy >= 90
                    ? 'Excellent match with target word count'
                    : wordCountAccuracy >= 75
                      ? 'Good match with target word count'
                      : wordCountAccuracy >= 60
                        ? 'Acceptable match with target word count'
                        : 'Significant deviation from target word count'
                }`}
                scoreColor={isLoading ? "text-gray-400" : getScoreTextClass(wordCountAccuracy)}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {overall < 95 && suggestions && suggestions.length > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-md border border-gray-100 dark:border-gray-700 mt-3">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Optimization Suggestions</p>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex">
                  <span className="text-gray-400 mr-1.5">•</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

interface ScoreItemProps {
  label: string;
  description: string;
  scoreColor?: string;
  isLoading?: boolean;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, description, isLoading }) => {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-md p-3 ${isLoading ? 'animate-pulse' : ''}`}>
      <div className="flex items-center mb-1">
        <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 pl-4 leading-relaxed">{description}</p>
    </div>
  );
};

export default React.memo(ScoreCard);
