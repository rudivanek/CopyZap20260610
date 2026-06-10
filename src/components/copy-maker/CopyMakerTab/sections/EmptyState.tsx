import React from 'react';

interface EmptyStateProps {
  tab?: 'create' | 'improve';
  hasOriginalCopy?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ tab, hasOriginalCopy }) => {
  const isImproveMode = tab === 'improve';

  let headline: string;
  let subtext: string;

  if (isImproveMode) {
    headline = hasOriginalCopy ? 'Ready to improve your copy.' : 'Paste copy above to get started.';
    subtext = hasOriginalCopy
      ? 'Fill in your project details and click "Make Copy" to generate an improved version.'
      : 'Switch to "Improve existing copy," paste your text, fill in the required fields, then click "Make Copy."';
  } else {
    headline = 'Your output will appear here.';
    subtext = 'Fill in the form above and click "Make Copy" to generate your first result.';
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-8 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-300 dark:text-gray-600 mb-2">
        {isImproveMode ? 'Improve mode' : 'Generate mode'}
      </p>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{headline}</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">{subtext}</p>
    </div>
  );
};

export default EmptyState;
