import React from 'react';
import { CheckSquare, Layers } from 'lucide-react';

interface StickyResultsNavProps {
  winnerLabel: string;
  hasVersionCards?: boolean;
}

const NAV_ITEMS = [
  { id: 'results-winner',   label: 'Decision',     Icon: CheckSquare },
  { id: 'results-versions', label: 'Comparison',   Icon: Layers },
];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const StickyResultsNav: React.FC<StickyResultsNavProps> = ({ winnerLabel, hasVersionCards }) => {
  return (
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 mb-4 -mx-6 px-6 py-0">
      <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
        {NAV_ITEMS.filter(item => item.id !== 'results-versions' || hasVersionCards).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-300 dark:text-gray-700 whitespace-nowrap flex-shrink-0 hidden sm:block">
          {winnerLabel}
        </span>
      </nav>
    </div>
  );
};
