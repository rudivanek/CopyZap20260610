import React from 'react';
import { X } from 'lucide-react';
import { CopyResult } from '../../types';
import { getScoreTextClass } from '../../utils/scoreColors';

interface ScoreComparisonModalProps {
  copyResult: CopyResult;
  onClose: () => void;
  isOpen: boolean;
  selectedPersona?: string;
}

const ScoreComparisonModal: React.FC<ScoreComparisonModalProps> = ({
  copyResult,
  onClose,
  isOpen,
  selectedPersona = ''
}) => {
  if (!isOpen) return null;

  // Helper function to determine if we have any scores to display
  const hasScores = () => {
    return !!(
      // Original scores
      copyResult.improvedCopyScore ||
      copyResult.alternativeCopyScore ||
      // Restyled content scores
      copyResult.restyledImprovedCopyScore ||
      copyResult.restyledAlternativeCopyScore ||
      // Multiple versions scores
      (copyResult.alternativeVersionScores && copyResult.alternativeVersionScores.length > 0)
    );
  };

  // Helper function to get a color class based on a score
  const getScoreColorClass = (score: number) => {
    return `${getScoreTextClass(score)} font-semibold`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Score Comparison
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-auto p-4">
          {!hasScores() ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No score data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Output Type</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Overall</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Word Count</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Why It's Improved</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {/* Standard Content Scores */}
                  {/* Improved Copy Score */}
                  {copyResult.improvedCopyScore && (
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Improved Copy
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-lg ${getScoreColorClass(copyResult.improvedCopyScore.overall)}`}>
                          {copyResult.improvedCopyScore.overall}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {copyResult.improvedCopyScore.wordCountAccuracy !== undefined && (
                          <span className={getScoreColorClass(copyResult.improvedCopyScore.wordCountAccuracy)}>
                            {copyResult.improvedCopyScore.wordCountAccuracy}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {copyResult.improvedCopyScore.improvementExplanation || 'No explanation provided'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="space-y-1">
                          <div><span className="font-medium">Clarity:</span> {copyResult.improvedCopyScore.clarity}</div>
                          <div><span className="font-medium">Persuasiveness:</span> {copyResult.improvedCopyScore.persuasiveness}</div>
                          <div><span className="font-medium">Tone Match:</span> {copyResult.improvedCopyScore.toneMatch}</div>
                          <div><span className="font-medium">Engagement:</span> {copyResult.improvedCopyScore.engagement}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Multiple Alternative Versions Scores */}
                  {copyResult.alternativeVersionScores && copyResult.alternativeVersionScores.length > 0 ? (
                    copyResult.alternativeVersionScores.map((score, index) => (
                      <tr key={`alt-score-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {`${index + 1}.) Alternative Version`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg ${getScoreColorClass(score.overall)}`}>
                            {score.overall}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {score.wordCountAccuracy !== undefined && (
                            <span className={getScoreColorClass(score.wordCountAccuracy)}>
                              {score.wordCountAccuracy}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {score.improvementExplanation || 'No explanation provided'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="space-y-1">
                            <div><span className="font-medium">Clarity:</span> {score.clarity}</div>
                            <div><span className="font-medium">Persuasiveness:</span> {score.persuasiveness}</div>
                            <div><span className="font-medium">Tone Match:</span> {score.toneMatch}</div>
                            <div><span className="font-medium">Engagement:</span> {score.engagement}</div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Legacy single alternative copy score
                    copyResult.alternativeCopyScore && (
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          Alternative Copy
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg ${getScoreColorClass(copyResult.alternativeCopyScore.overall)}`}>
                            {copyResult.alternativeCopyScore.overall}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {copyResult.alternativeCopyScore.wordCountAccuracy !== undefined && (
                            <span className={getScoreColorClass(copyResult.alternativeCopyScore.wordCountAccuracy)}>
                              {copyResult.alternativeCopyScore.wordCountAccuracy}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {copyResult.alternativeCopyScore.improvementExplanation || 'No explanation provided'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="space-y-1">
                            <div><span className="font-medium">Clarity:</span> {copyResult.alternativeCopyScore.clarity}</div>
                            <div><span className="font-medium">Persuasiveness:</span> {copyResult.alternativeCopyScore.persuasiveness}</div>
                            <div><span className="font-medium">Tone Match:</span> {copyResult.alternativeCopyScore.toneMatch}</div>
                            <div><span className="font-medium">Engagement:</span> {copyResult.alternativeCopyScore.engagement}</div>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                  
                  {/* Restyled Content Scores - New Section */}
                  
                  {/* Restyled Improved Copy Score */} // Changed from bg-blue-50/30
                  {copyResult.restyledImprovedCopyScore && (
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-blue-50/30 dark:bg-blue-900/20">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {selectedPersona ? `${selectedPersona}'s Improved Copy` : 'Restyled Improved Copy'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-lg ${getScoreColorClass(copyResult.restyledImprovedCopyScore.overall)}`}>
                          {copyResult.restyledImprovedCopyScore.overall}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {copyResult.restyledImprovedCopyScore.wordCountAccuracy !== undefined && (
                          <span className={getScoreColorClass(copyResult.restyledImprovedCopyScore.wordCountAccuracy)}>
                            {copyResult.restyledImprovedCopyScore.wordCountAccuracy}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {copyResult.restyledImprovedCopyScore.improvementExplanation || 'No explanation provided'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="space-y-1">
                          <div><span className="font-medium">Clarity:</span> {copyResult.restyledImprovedCopyScore.clarity}</div>
                          <div><span className="font-medium">Persuasiveness:</span> {copyResult.restyledImprovedCopyScore.persuasiveness}</div>
                          <div><span className="font-medium">Tone Match:</span> {copyResult.restyledImprovedCopyScore.toneMatch}</div>
                          <div><span className="font-medium">Engagement:</span> {copyResult.restyledImprovedCopyScore.engagement}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Multiple Restyled Alternative Versions */}
                  {copyResult.restyledAlternativeVersionScores && 
                   copyResult.restyledAlternativeVersionScores.length > 0 ? ( // Changed from bg-blue-50/30
                    copyResult.restyledAlternativeVersionScores.map((score, index) => (
                      <tr key={`restyled-alt-score-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-blue-50/30 dark:bg-blue-900/20">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {`${index + 1}.) ${selectedPersona}'s Alternative Version`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg ${getScoreColorClass(score.overall)}`}>
                            {score.overall}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {score.wordCountAccuracy !== undefined && (
                            <span className={getScoreColorClass(score.wordCountAccuracy)}>
                              {score.wordCountAccuracy}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {score.improvementExplanation || 'No explanation provided'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="space-y-1">
                            <div><span className="font-medium">Clarity:</span> {score.clarity}</div>
                            <div><span className="font-medium">Persuasiveness:</span> {score.persuasiveness}</div>
                            <div><span className="font-medium">Tone Match:</span> {score.toneMatch}</div>
                            <div><span className="font-medium">Engagement:</span> {score.engagement}</div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Legacy single restyled alternative copy score
                    copyResult.restyledAlternativeCopyScore && ( // Changed from bg-blue-50/30
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-blue-50/30 dark:bg-blue-900/20">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {selectedPersona ? `${selectedPersona}'s Alternative Copy` : 'Restyled Alternative Copy'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg ${getScoreColorClass(copyResult.restyledAlternativeCopyScore.overall)}`}>
                            {copyResult.restyledAlternativeCopyScore.overall}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {copyResult.restyledAlternativeCopyScore.wordCountAccuracy !== undefined && (
                            <span className={getScoreColorClass(copyResult.restyledAlternativeCopyScore.wordCountAccuracy)}>
                              {copyResult.restyledAlternativeCopyScore.wordCountAccuracy}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {copyResult.restyledAlternativeCopyScore.improvementExplanation || 'No explanation provided'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="space-y-1">
                            <div><span className="font-medium">Clarity:</span> {copyResult.restyledAlternativeCopyScore.clarity}</div>
                            <div><span className="font-medium">Persuasiveness:</span> {copyResult.restyledAlternativeCopyScore.persuasiveness}</div>
                            <div><span className="font-medium">Tone Match:</span> {copyResult.restyledAlternativeCopyScore.toneMatch}</div>
                            <div><span className="font-medium">Engagement:</span> {copyResult.restyledAlternativeCopyScore.engagement}</div>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-300 dark:border-gray-800">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-md text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreComparisonModal;