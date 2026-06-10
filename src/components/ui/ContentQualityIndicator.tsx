import React, { useState } from 'react';
import { ContentQualityScore } from '../../types';
import { AlertCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { getScoreLabel } from '../../utils/scoreColors';

interface ContentQualityIndicatorProps {
  score?: ContentQualityScore;
  isLoading?: boolean;
}

const ContentQualityIndicator: React.FC<ContentQualityIndicatorProps> = ({ 
  score,
  isLoading = false
}) => {
  const [showTips, setShowTips] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center h-6 mt-2">
        <div className="text-sm text-gray-500">Evaluating...</div>
      </div>
    );
  }

  if (!score) return null;

  // Determine color based on score
  const getScoreColor = (value: number) => {
    if (value >= 90) return 'text-gray-600 dark:text-gray-400'; // Changed from text-green-600
    if (value >= 70) return 'text-gray-500 dark:text-gray-400'; // Changed from text-yellow-600
    return 'text-gray-600 dark:text-gray-500'; // Changed from text-red-600
  };

  // Determine background color based on score
  const getBgColor = (value: number) => {
    if (value >= 90) return 'bg-gray-600'; // Changed from bg-green-500
    if (value >= 70) return 'bg-gray-500'; // Changed from bg-yellow-500
    return 'bg-gray-600'; // Changed from bg-red-500
  };

  // Determine badge background color
  const getBadgeBgColor = (value: number) => {
    if (value >= 90) return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800'; // Changed from bg-green-100, text-green-800, border-green-200
    if (value >= 70) return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800'; // Changed from bg-yellow-100, text-yellow-800, border-yellow-200
    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800'; // Changed from bg-red-100, text-red-800, border-red-200
  };

  return (
    <div className="mt-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality:</div>
          <div className="flex items-center gap-1">
            <div className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${getBadgeBgColor(score.score)}`}>
              {score.score}/100
            </div>
            {score.score > 0 && (
              <span className={`text-xs ${getScoreColor(score.score)} opacity-75`}>
                ({getScoreLabel(score.score)})
              </span>
            )}
          </div>
        </div>
        
        {score.tips && score.tips.length > 0 && (
          <Tooltip content="Click to view improvement tips">
            <button 
              onClick={() => setShowTips(!showTips)}
              className={`ml-2 p-1 rounded-md ${showTips ? 'bg-gray-200 dark:bg-gray-700' : ''} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            >
              <AlertCircle size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-1">
        <div 
          className={`h-2 rounded-full ${getBgColor(score.score)}`}
          style={{ width: `${score.score}%` }}
        ></div>
      </div>

      {showTips && score.tips && score.tips.length > 0 && (
        <div className="text-xs text-gray-700 dark:text-gray-400 mt-3 bg-gray-100 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 animate-fadeIn">
          <div className="font-medium mb-2 text-gray-700 dark:text-gray-300">Improvement Tips:</div>
          <ul className="space-y-2">
            {score.tips.map((tip, index) => (
              <li key={index} className="flex">
                <span className="text-primary-500 mr-1.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContentQualityIndicator;