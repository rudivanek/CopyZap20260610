import React from 'react';
import { Link } from 'react-router-dom';
import { useCreditsBalance } from '../hooks/useCreditsBalance';
import { supabase } from '../services/supabaseClient';
import { TIPS } from './tips';

interface QuickTopBarProps {
  onNew: () => void;
  onHistory: () => void;
  onLogout: () => void;
  /** Which of the main views is showing. */
  view: 'new' | 'history' | 'help';
  /** True while a process is running: New and History are disabled so a paid run is not lost. */
  isBusy: boolean;
  /** Power users and admins get a link to the Advanced interface (Copy Maker); everyone else has this one only. */
  showComplete: boolean;
  /**
   * The saved result that is open, if one is. The Advanced link then opens that
   * result in Copy Maker (as a separate project) and says so; otherwise it
   * opens Copy Maker empty.
   */
  openResultId: string | null;
  /** Opens the help page, or closes it when it is open. */
  onHelp: () => void;
  /** Whose credits to show. */
  userId: string;
  /** The signed-in account's email, shown when no name is known, and always in the tip. */
  userEmail: string;
  /** A name from the sign-in (for example from Google), used when the account record has none. */
  userMetaName?: string;
  /** Changes whenever a process has finished, so the credits are read again. */
  creditsTick: number;
}

/**
 * The exact number, with thousands separators: 89,082. A rounded form such as
 * "89.1K" only moves every hundred credits, so a run of sixty looks like no
 * change at all. Only from a million up is it shortened (5.00M).
 */
function formatCredits(credits: number): string {
  if (credits >= 1000000) return `${(credits / 1000000).toFixed(2)}M`;
  return Math.round(credits).toLocaleString('en-US');
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

/** Longest name or email shown in the bar; the rest is cut with "…" and the whole is in the tip. */
const ACCOUNT_MAX_CHARS = 24;

/**
 * Which account is signed in: the name from the account record (the one an
 * admin sets in Manage Users), else the name from the sign-in, else the email.
 * Hidden on narrow screens, where the bar is already full.
 */
const AccountName: React.FC<{ userId: string; email: string; metaName?: string }> = ({ userId, email, metaName }) => {
  const [recordName, setRecordName] = React.useState<string | null>(null);
  React.useEffect(() => {
    let live = true;
    supabase
      .from('pmc_users')
      .select('name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const name = typeof data?.name === 'string' ? data.name.trim() : '';
        if (live) setRecordName(name || null);
      });
    return () => {
      live = false;
    };
  }, [userId]);

  const full = (recordName || (metaName || '').trim() || email || '').trim();
  if (!full) return null;
  const shown = full.length > ACCOUNT_MAX_CHARS ? `${full.slice(0, ACCOUNT_MAX_CHARS - 1).trimEnd()}…` : full;
  return (
    <span
      data-tip={email ? `Signed in as ${email}` : undefined}
      className="hidden md:inline-flex items-center min-h-[44px] pl-3 text-xs font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap"
    >
      {shown}
      <span className="pl-3 text-gray-400 dark:text-gray-600" aria-hidden="true">
        ·
      </span>
    </span>
  );
};

/**
 * For prepaid (bought or trial) credits: when the first credits run out, next to the
 * balance. "250 expire Nov 14" when only part expires first, "until Jan 15" when all
 * expire together. Amber in the last 7 days; the full list shows on hover.
 * Accounts on the monthly plan get nothing here.
 */
const CreditsExpiry: React.FC<{ userId: string }> = ({ userId }) => {
  const [note, setNote] = React.useState<{ text: string; title: string; soon: boolean } | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: balance } = await supabase.rpc('get_user_credits_balance', { user_id_param: userId });
      if (cancelled || !balance || balance.mode !== 'prepaid') return;
      const { data: rows } = await supabase
        .from('credit_grants')
        .select('remaining, expires_at')
        .eq('user_id', userId)
        .gt('remaining', 0)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at');
      if (cancelled || !rows || rows.length === 0) return;
      const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const longDay = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      // Group by calendar day
      const groups: { date: string; credits: number }[] = [];
      for (const r of rows as { remaining: number; expires_at: string }[]) {
        const last = groups[groups.length - 1];
        if (last && day(last.date) === day(r.expires_at)) last.credits += r.remaining;
        else groups.push({ date: r.expires_at, credits: r.remaining });
      }
      const total = groups.reduce((sum, g) => sum + g.credits, 0);
      const first = groups[0];
      const text = first.credits === total
        ? `until ${day(first.date)}`
        : `${first.credits.toLocaleString('en-US')} expire ${day(first.date)}`;
      const title = groups
        .map(g => `${g.credits.toLocaleString('en-US')} credits valid until ${longDay(g.date)}`)
        .join('\n');
      const soon = new Date(first.date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
      setNote({ text, title, soon });
    })();
    return () => { cancelled = true; };
  }, [userId]);
  if (!note) return null;
  return (
    <span
      title={note.title}
      className={
        'hidden sm:inline-flex items-center min-h-[44px] -ml-2 pr-2 text-xs tabular-nums whitespace-nowrap ' +
        (note.soon ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-500 dark:text-gray-400')
      }
    >
      · {note.text}
    </span>
  );
};

/**
 * "Buy credits" link, shown only to accounts allowed to use the paywall
 * (admins and testers while it is hidden, everyone once it is public).
 */
const BuyCreditsLink: React.FC = () => {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    supabase.rpc('can_use_paywall').then(({ data }) => {
      if (!cancelled) setShow(data === true);
    });
    return () => { cancelled = true; };
  }, []);
  if (!show) return null;
  return (
    <Link
      to="/buy"
      className="inline-flex items-center min-h-[44px] px-2 sm:px-3 font-medium text-primary-700 dark:text-primary-300 underline hover:text-primary-800 dark:hover:text-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      Buy credits
    </Link>
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
  openResultId,
  userId,
  userEmail,
  userMetaName,
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
          data-tip={TIPS.new}
          className={navButton + (view === 'new' ? 'border-primary-500' : 'border-transparent')}
        >
          New
        </button>
        <button
          type="button"
          onClick={onHistory}
          disabled={isBusy}
          aria-current={view === 'history' ? 'page' : undefined}
          data-tip={TIPS.history}
          className={navButton + (view === 'history' ? 'border-primary-500' : 'border-transparent')}
        >
          History
        </button>
        <a
          href="https://copyzap.app/help/"
          target="_blank"
          rel="noopener noreferrer"
          className={navButton + 'border-transparent'}
        >
          Help
        </a>
        {/* The Advanced interface needs a desktop screen, so the link is hidden below 1024px. */}
        {showComplete && (
          <Link
            to={openResultId ? `/copy-maker?savedOutputId=${openResultId}` : '/copy-maker'}
            className="hidden lg:inline-flex items-center min-h-[44px] px-3 text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {openResultId ? 'Open in Advanced' : 'Advanced'}
          </Link>
        )}
        <AccountName userId={userId} email={userEmail} metaName={userMetaName} />
        <CreditsLeft key={creditsTick} userId={userId} />
        <CreditsExpiry key={`expiry-${creditsTick}`} userId={userId} />
        <BuyCreditsLink />
        <button type="button" onClick={onLogout} className={navButton + 'border-transparent'}>
          Log out
        </button>
      </nav>
    </div>
  </header>
);

export default QuickTopBar;
