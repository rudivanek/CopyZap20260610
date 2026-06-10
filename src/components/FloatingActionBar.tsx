import React, { useState } from 'react';
import { Save, FileText, Code, FileCode, Sparkles, FlaskConical } from 'lucide-react';
import { FormState, GeneratedContentItem, User, VersionDeepAnalysis, ComparisonDeepAnalysisMeta } from '../types';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { toast } from 'react-hot-toast';
import { ComparisonResult } from '../services/api/comprehensiveScoring'; // phase 1 scoring cleanup: updated import path
import { formatAsEnhancedMarkdown, exportAsFormattedHtml, exportLLMEvaluationMarkdown, exportLLMEvaluationAudit } from '../utils/enhancedExports';

interface FloatingActionBarProps {
  formState: FormState;
  generatedOutputCards: GeneratedContentItem[];
  originalInputScore?: any;
  currentUser?: User;
  onSaveOutput: () => void;
  onViewPrompts: () => void;
  onGenerateFaqSchema: () => void;
  comparisonResult?: ComparisonResult | null;
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>;
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta;
  loadingVersionIds?: Set<string>;
}

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  formState,
  generatedOutputCards,
  originalInputScore,
  currentUser,
  onSaveOutput,
  onViewPrompts,
  onGenerateFaqSchema,
  comparisonResult,
  versionDeepAnalysis,
  comparisonDeepAnalysisMeta,
  loadingVersionIds
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Check if current user is admin using centralized admin service
  const { isAdmin } = useIsAdmin(currentUser);

  // Check if we have any content to work with (for export/save actions)
  const hasContent = (generatedOutputCards && generatedOutputCards.length > 0) ||
                    originalInputScore;

  // Handle copying all content as markdown
  const handleCopyAllMarkdown = () => {
    try {
      const markdown = formatAsEnhancedMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta
      );

      navigator.clipboard.writeText(markdown);
      toast.success('Content copied as Markdown!');
    } catch (error) {
      console.error('Error copying markdown:', error);
      toast.error('Failed to copy content as Markdown');
    }
  };

  // Handle exporting to formatted HTML file
  const handleExportToHtml = () => {
    try {
      exportAsFormattedHtml(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
        loadingVersionIds
      );
      toast.success('Content exported as formatted HTML!');
    } catch (error) {
      console.error('Error exporting to HTML:', error);
      toast.error('Failed to export content as HTML');
    }
  };

  // Handle exporting as LLM Evaluation Markdown
  const handleExportLLMEvaluation = () => {
    try {
      exportLLMEvaluationMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta
      );
      toast.success('LLM Evaluation file exported!');
    } catch (error) {
      console.error('Error exporting LLM evaluation:', error);
      toast.error('Failed to export LLM evaluation file');
    }
  };

  // Handle exporting as LLM Evaluation Audit (blind comparison)
  const handleExportLLMEvaluationAudit = () => {
    try {
      // Debug logging to help troubleshoot validation issues
      console.group('LLM Evaluation Audit Export - Debug Info');
      console.log('Has comparisonResult:', !!comparisonResult);
      // Support both old and new formats
      const winnerId = (comparisonResult as any)?.winnerVersionId || comparisonResult?.winner;
      const rankingData = (comparisonResult as any)?.rows || comparisonResult?.ranking;
      const explanation = (comparisonResult as any)?.winnerExplanation || comparisonResult?.shortWhyWinner || comparisonResult?.whyWinner;
      console.log('Winner (new: winnerVersionId, old: winner):', winnerId);
      console.log('Ranking length (new: rows, old: ranking):', rankingData?.length);
      console.log('Scores count (new: in rows, old: scores):',
        (comparisonResult as any)?.rows?.length ||
        (comparisonResult?.scores ? Object.keys(comparisonResult.scores).length : 0)
      );
      console.log('Has explanation (new: winnerExplanation, old: shortWhyWinner/whyWinner):', !!explanation);
      console.log('Has versionDeepAnalysis:', !!versionDeepAnalysis);
      console.log('versionDeepAnalysis keys:', versionDeepAnalysis ? Object.keys(versionDeepAnalysis) : []);
      if (winnerId && versionDeepAnalysis) {
        const winnerAnalysis = versionDeepAnalysis[winnerId];
        console.log('Winner has analysis:', !!winnerAnalysis);
        console.log('Winner keyStrengths count:', winnerAnalysis?.keyStrengths?.length ?? 0);
        console.log('Winner suggestedImprovements count:', winnerAnalysis?.suggestedImprovements?.length ?? 0);
      } else {
        console.log('Winner has analysis:', false);
      }
      console.groupEnd();

      exportLLMEvaluationAudit(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta
      );
      toast.success('LLM Evaluation Audit file exported!');
    } catch (error) {
      console.error('Error exporting LLM evaluation audit:', error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to export LLM evaluation audit file';

      // For incomplete data errors, show a more detailed toast
      if (errorMessage.includes('complete evaluation data')) {
        toast.error(errorMessage, {
          duration: 6000,
          style: {
            maxWidth: '500px'
          }
        });
      } else {
        toast.error('Failed to export LLM evaluation audit file');
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  // Don't render the floating bar at all if no content AND not admin
  if (!hasContent && !isAdmin) {
    return null;
  }

  return (
    <div className="fixed top-1/2 right-2 sm:right-4 transform -translate-y-1/2 z-40">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
        {/* Save Output */}
        {hasContent && (
          <button
            onClick={onSaveOutput}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Save Output"
            disabled={!generatedOutputCards || generatedOutputCards.length === 0}
          >
            <Save size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

        {/* Copy as Markdown */}
        {hasContent && (
          <button
            onClick={handleCopyAllMarkdown}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Copy as Markdown"
          >
            <FileText size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

        {/* Export to Formatted HTML */}
        {hasContent && (
          <button
            onClick={handleExportToHtml}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Export as Formatted HTML"
          >
            <FileCode size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

        {/* Export for LLM Evaluation */}
        {hasContent && isAdmin && (
          <button
            onClick={handleExportLLMEvaluation}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Export for LLM Evaluation (.md)"
          >
            <Sparkles size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

        {/* Export for LLM Evaluation Audit (Blind Comparison) */}
        {hasContent && comparisonResult && isAdmin && (
          <button
            onClick={handleExportLLMEvaluationAudit}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Export for LLM Evaluation Audit (.md)"
          >
            <FlaskConical size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

        {/* View Prompts - Always visible for admin */}
        {isAdmin && (
          <button
            onClick={onViewPrompts}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="View Prompts"
          >
            <Code size={14} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingActionBar;