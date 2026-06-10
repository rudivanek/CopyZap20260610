import React from 'react';
import { PromptEvaluation as PromptEvaluationType } from '../../types';
import { ArrowDown } from 'lucide-react';
import { getScoreTextClass, getScoreBgClass, getScoreLabel } from '../../utils/scoreColors';

interface PromptEvaluationProps {
  evaluation: PromptEvaluationType;
  isLoading: boolean;
}

const PromptEvaluation: React.FC<PromptEvaluationProps> = ({ evaluation, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 animate-pulse">
        <div className="h-7 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  // Determine color based on score
  const getScoreColor = (score: number) => {
    const textClass = getScoreTextClass(score);
    return `${textClass} bg-gray-100 dark:bg-gray-900/30`;
  };

  const getScoreBarColor = (score: number) => {
    return getScoreBgClass(score);
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6">
      <div className="flex items-center mb-5">
        <div className="w-0.5 h-4 rounded bg-gray-300 dark:bg-gray-600 mr-2"></div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Input Evaluation</h3>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 dark:text-gray-400">Quality Score</span>
          <div className="flex flex-col items-end">
            <span className={`font-medium px-3 py-1 rounded-full text-sm ${getScoreColor(evaluation.score)}`}>
              {evaluation.score}/100
            </span>
            {evaluation.score > 0 && (
              <span className={`text-xs ${getScoreTextClass(evaluation.score)} opacity-75 mt-1`}>
                ({getScoreLabel(evaluation.score)})
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${getScoreBarColor(evaluation.score)}`}
            style={{ width: `${evaluation.score}%` }}
          ></div>
        </div>
      </div>
      
      {evaluation.tips && evaluation.tips.length > 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Improvement Tips</p>
          <ul className="space-y-3">
            {evaluation.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                <span className="text-gray-700 dark:text-gray-300">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(PromptEvaluation);