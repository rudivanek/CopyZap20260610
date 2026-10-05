import React from 'react';
import { Link } from 'react-router-dom';

interface QuickTopBarProps {
  onNew: () => void;
  onLogout: () => void;
  /** True while a run is in progress: New is disabled so a paid run is not lost. */
  isBusy: boolean;
}

const navButton =
  'inline-flex items-center min-h-[44px] px-3 font-medium text-gray-900 dark:text-gray-100 ' +
  'hover:text-primary-700 dark:hover:text-primary-300 disabled:text-gray-400 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';

const QuickTopBar: React.FC<QuickTopBarProps> = ({ onNew, onLogout, isBusy }) => (
  <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-[56px] flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-gray-900 dark:text-white">CopyZap</span>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick</span>
      </div>
      <nav aria-label="Quick" className="flex flex-wrap items-center gap-1">
        <button type="button" onClick={onNew} disabled={isBusy} className={navButton}>
          New
        </button>
        {/* The Complete interface needs a desktop screen, so the link is hidden below 1024px. */}
        <Link
          to="/copy-maker"
          className="hidden lg:inline-flex items-center min-h-[44px] px-3 text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Open Complete
        </Link>
        <button type="button" onClick={onLogout} className={navButton}>
          Log out
        </button>
      </nav>
    </div>
  </header>
);

export default QuickTopBar;
