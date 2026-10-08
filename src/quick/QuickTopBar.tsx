import React from 'react';
import { Link } from 'react-router-dom';
import { useCreditsBalance } from '../hooks/useCreditsBalance';

interface QuickTopBarProps {
  onNew: () => void;
  onHistory: () => void;
  onLogout: () => void;
  /** Which of the two main views is showing. */
  view: 'new' | 'history';
  /** True while a process is running: New and History are disabled so a paid run is not lost. */
  isBusy: boolean;
  /** Power users and admins get a link to the Advanced interface (Copy Maker); everyone else has this one only. */
  showComplete: boolean;
  /** Opens the "How it works" explanation. */
  onHelp: () => void;
  /** Whose credits to show. */
  userId: string;
  /** Changes whenever a process has finished, so the credits are read again. */
  creditsTick: number;
}

/** The same short form Copy Maker's menu uses: 5.0M, 12.3K, 420. */
function formatCredits(credits: number): string {
  if (credits >= 1000000) return `${(credits / 1000000).toFixed(1)}M`;
  if (credits >= 1000) return `${(credits / 1000).toFixed(1)}K`;
  return String(credits);
}

/**
 * The credits the user has left. Mounted afresh (by its key) after every
 * process, because the shared hook reads them only when it mounts, when the
 * window gets the focus, and every five minutes.
 */
const CreditsLeft: React.FC<{ userId: string }> = ({ userId }) => {
  const { creditsAllowed, creditsRemaining, isLoading } = useCreditsBalance(userId);
  // The hook reports 0 and 0 when it could not read them; show nothing then, not "0 credits".
  if (isLoading || (creditsAllowed <= 0 && creditsRemaining <= 0)) return null;
  return (
    <span className="inline-flex items-center min-h-[44px] px-2 sm:px-3 text-xs font-medium text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
      {formatCredits(Math.max(0, creditsRemaining))} credits
      {/* On a phone the word "left" is dropped so the bar stays two rows high. */}
      <span className="hidden sm:inline">&nbsp;left</span>
    </span>
  );
};

const navButton =
  'inline-flex items-center min-h-[44px] px-2 sm:px-3 font-medium text-gray-900 dark:text-gray-100 ' +
  'hover:text-primary-700 dark:hover:text-primary-300 disabled:text-gray-400 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 border-b-2 ';

const QuickTopBar: React.FC<QuickTopBarProps> = ({
  onNew,
  onHistory,
  onLogout,
  view,
  isBusy,
  showComplete,
  onHelp,
  userId,
  creditsTick,
}) => (
  <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-[56px] flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
      {/* This is the default screen, so it carries the plain logo, the same as
          the Advanced interface. It leads to a new start, like "New". */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onNew}
          disabled={isBusy}
          aria-label="CopyZap home"
          className="inline-flex items-center min-h-[44px] hover:opacity-80 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <img src="/copyzap.png" alt="CopyZap" className="h-5 sm:h-6 w-auto" />
        </button>
      </div>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={onNew}
          disabled={isBusy}
          aria-current={view === 'new' ? 'page' : undefined}
          className={navButton + (view === 'new' ? 'border-primary-500' : 'border-transparent')}
        >
          New
        </button>
        <button
          type="button"
          onClick={onHistory}
          disabled={isBusy}
          aria-current={view === 'history' ? 'page' : undefined}
          className={navButton + (view === 'history' ? 'border-primary-500' : 'border-transparent')}
        >
          History
        </button>
        <button type="button" onClick={onHelp} className={navButton + 'border-transparent'}>
          Help
        </button>
        {/* The Advanced interface needs a desktop screen, so the link is hidden below 1024px. */}
        {showComplete && (
          <Link
            to="/copy-maker"
            className="hidden lg:inline-flex items-center min-h-[44px] px-3 text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Advanced
          </Link>
        )}
        <CreditsLeft key={creditsTick} userId={userId} />
        <button type="button" onClick={onLogout} className={navButton + 'border-transparent'}>
          Log out
        </button>
      </nav>
    </div>
  </header>
);

export default QuickTopBar;
