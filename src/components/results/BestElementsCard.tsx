import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, ExternalLink, Wand2 } from 'lucide-react';
import { BestElementsResult } from '../../services/api/bestElements';

interface BestElementsCardProps {
  result: BestElementsResult;
  onJumpToVersion?: (versionId: string) => void;
  onCompile?: () => void;
  isCompiling?: boolean;
}

const DIMENSION_COLORS: Record<string, string> = {
  'Headline / Opening Hook':    'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
  'Problem Statement':           'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  'Treatment Explanation':       'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  'Social Proof / Testimonials': 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  'Call to Action':              'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
  'Credibility / Authority':     'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
};

function getDimensionColor(dimension: string): string {
  return DIMENSION_COLORS[dimension] || DIMENSION_COLORS['Credibility / Authority'];
}

export const BestElementsCard: React.FC<BestElementsCardProps> = ({
  result,
  onJumpToVersion,
  onCompile,
  isCompiling,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      id="best-elements-summary"
      className="rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-950 overflow-hidden shadow-sm"
      style={{ borderLeftWidth: '3px', borderLeftColor: '#9333ea', borderLeftStyle: 'solid' }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(p => !p)}
        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block">
              Best Elements Summary
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              What to take from each version
            </span>
          </div>
        </div>
        {isExpanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">

          {/* Elements grid */}
          <div className="space-y-3 mt-4">
            {result.elements.map((el, idx) => {
              const colorClass = getDimensionColor(el.dimension);
              return (
                <div
                  key={idx}
                  className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                      {el.dimension}
                    </span>
                    {onJumpToVersion && el.versionId && (
                      <button
                        type="button"
                        onClick={() => onJumpToVersion(el.versionId)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400 hover:underline flex-shrink-0"
                      >
                        <ExternalLink size={9} />
                        Jump
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 truncate">
                    From: {el.versionName}
                  </p>

                  {el.excerpt && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed mb-1.5 border-l-2 border-purple-300 dark:border-purple-700 pl-2">
                      "{el.excerpt}"
                    </p>
                  )}

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    {el.reason}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Assembly note */}
          {result.assemblyNote && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">
                How to assemble your final version
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {result.assemblyNote}
              </p>
            </div>
          )}

          {/* Compile button */}
          {onCompile && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onCompile}
                disabled={isCompiling}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white transition-colors shadow-sm disabled:cursor-not-allowed"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isCompiling ? 'animate-pulse' : ''}`} />
                {isCompiling ? 'Compiling…' : 'Compile Best Elements → New Output'}
              </button>
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5 leading-snug">
                Assembles the 6 best elements into one cohesive final version and adds it as a new output card.
              </p>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-3 text-right">
            Generated {new Date(result.generatedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};
