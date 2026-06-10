import React from 'react';
import { ChevronUp, ChevronDown, Award, Table, Sparkles } from 'lucide-react';
import { GeneratedContentItem, GeneratedContentItemType } from '../types';

interface FloatingOutputNavigationProps {
  generatedVersions: GeneratedContentItem[];
  hasComparison: boolean;
  hasBestElements?: boolean;
}

const FloatingOutputNavigation: React.FC<FloatingOutputNavigationProps> = ({
  generatedVersions,
  hasComparison,
  hasBestElements,
}) => {
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const hasOutputs = generatedVersions.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Go to Top */}
          <button
            onClick={scrollToTop}
            className="flex-shrink-0 px-2 py-1 text-[11px] font-normal text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Go to Top"
          >
            <ChevronUp className="h-3 w-3 inline mr-1" />
            Top
          </button>

          {hasOutputs && (
            <>
              <div className="h-4 w-px bg-gray-400 dark:bg-gray-600 flex-shrink-0"></div>

              {/* Output Links */}
              {generatedVersions
                .filter(item => item.type !== GeneratedContentItemType.GeoOptimized)
                .map((item, index) => {
                const isComparison = item.sourceDisplayName?.toLowerCase().includes('comparison');
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToElement(`output-${item.id}`)}
                    className="flex-shrink-0 px-2 py-1 text-[11px] font-normal text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors truncate max-w-[200px]"
                    title={item.sourceDisplayName || `Output ${index + 1}`}
                  >
                    {isComparison && <Table className="h-3 w-3 inline mr-1" />}
                    {item.sourceDisplayName || `Output ${index + 1}`}
                  </button>
                );
              })}

              {/* Go to Comparison */}
              {hasComparison && (
                <>
                  <div className="h-4 w-px bg-gray-400 dark:bg-gray-600 flex-shrink-0"></div>
                  <button
                    onClick={() => {
                      const comparisonEl = document.getElementById('comprehensive-analysis');
                      if (comparisonEl) {
                        comparisonEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="flex-shrink-0 px-2 py-1 text-[11px] font-normal text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Go to Comparison"
                  >
                    <Award className="h-3 w-3 inline mr-1" />
                    Comparison
                  </button>
                </>
              )}

              {/* Go to Best Elements Summary */}
              {hasBestElements && (
                <>
                  <div className="h-4 w-px bg-gray-400 dark:bg-gray-600 flex-shrink-0"></div>
                  <button
                    onClick={() => scrollToElement('best-elements-summary')}
                    className="flex-shrink-0 px-2 py-1 text-[11px] font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
                    title="Go to Best Elements Summary"
                  >
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Best Elements
                  </button>
                </>
              )}

              <div className="h-4 w-px bg-gray-400 dark:bg-gray-600 flex-shrink-0"></div>
            </>
          )}

          {/* Go to Bottom */}
          <button
            onClick={scrollToBottom}
            className="flex-shrink-0 px-2 py-1 text-[11px] font-normal text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Go to Bottom"
          >
            <ChevronDown className="h-3 w-3 inline mr-1" />
            Bottom
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingOutputNavigation;
