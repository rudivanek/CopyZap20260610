import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { getAbsoluteScoreMarkClass } from '../utils/scoreColors';
import { quickGoalName } from '../engine/buildQuickFormState';
import { TIPS } from './tips';
import { formatVersionTime } from '../utils/versionTime';
import { Link } from 'react-router-dom';
import { deleteQuickResult, listQuickResults, adminListQuickResults, QuickHistoryEntry, renameQuickResult, loadQuickResult, adminLoadQuickResult } from '../engine/quickHistory';
import { getSessionUsage, adminGetSessionUsage, SessionUsage, formatUsd } from '../engine/quickCredits';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { FileText } from 'lucide-react';
import BriefRecordBox from './BriefRecordBox';
import type { QuickBriefRecord } from '../engine/runQuickPipeline';

export interface ViewingUser {
  id: string;
  email: string;
}

interface QuickHistoryProps {
  currentUser: User;
  onOpen: (id: string) => void;
  onNew: () => void;
  /** Tells the page that an entry is gone, in case it is the result currently open. */
  onDeleted: (id: string) => void;
  /** When set, an admin is viewing another user's history: list via the admin RPC, hide Rename/Delete, show a banner. */
  viewingUser?: ViewingUser | null;
}

const card = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700';
const linkButton =
  'inline-flex items-center min-h-[44px] text-primary-800 dark:text-primary-300 underline ' +
  'hover:text-primary-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500';
const smallButton =
  'inline-flex items-center justify-center min-h-[44px] px-4 bg-white dark:bg-gray-900 border border-gray-400 ' +
  'dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 ' +
  'disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500';

/** The same format as the times of the versions on a result: "Oct 12, 2026, 11:37". */
function formatDate(value: string): string {
  return formatVersionTime(value);
}

function usageText(u: SessionUsage, isAdmin: boolean): string | null {
  const part = (credits: number, usd: number | null) =>
    `${credits.toLocaleString('en-US')} credits` + (isAdmin && usd != null ? ` (${formatUsd(usd)})` : '');
  if (u.briefCredits > 0) {
    return `Brief: ${part(u.briefCredits, u.briefUsd)} · Improve: ${part(u.runCredits, u.runUsd)}`;
  }
  if (u.runCredits > 0) return part(u.runCredits, u.runUsd);
  return null;
}

const QuickHistory: React.FC<QuickHistoryProps> = ({ currentUser, onOpen, onNew, onDeleted, viewingUser }) => {
  const isViewingOther = !!viewingUser;
  const [entries, setEntries] = useState<QuickHistoryEntry[] | null>(null);
  // Usage per session id, split into the brief part and the run part. Read after
  // the list; when the read fails, the lines simply show no credits.
  const [usage, setUsage] = useState<Record<string, SessionUsage>>({});
  const { isAdmin } = useIsAdmin(currentUser);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [briefOpenId, setBriefOpenId] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<Record<string, QuickBriefRecord | null | 'error'>>({});
  const [briefLoadingId, setBriefLoadingId] = useState<string | null>(null);
  const isMounted = useRef(true);
  const userId = viewingUser?.id ?? currentUser.id;

  useEffect(() => {
    isMounted.current = true;
    const listPromise = isViewingOther ? adminListQuickResults(userId) : listQuickResults(userId);
    listPromise
      .then(list => {
        if (!isMounted.current) return;
        setEntries(list);
        // An admin viewing another user's history reads that user's usage through the admin RPC.
        const ids = list.map(entry => entry.sessionId).filter((id): id is string => !!id);
        (isViewingOther ? adminGetSessionUsage(userId, ids) : getSessionUsage(ids))
          .then(map => {
            if (isMounted.current) setUsage(map);
          })
          .catch(() => undefined);
      })
      .catch(loadError => {
        if (isMounted.current) {
          setEntries([]);
          setError(loadError instanceof Error ? loadError.message : 'History could not be loaded.');
        }
      });
    return () => {
      isMounted.current = false;
    };
  }, [userId, isViewingOther]);

  const startRename = (entry: QuickHistoryEntry) => {
    setDeletingId(null);
    setRenamingId(entry.id);
    setDraft(entry.title);
  };

  const saveRename = async (id: string) => {
    if (!draft.trim()) return;
    setWorkingId(id);
    setError(null);
    try {
      const title = await renameQuickResult(id, draft);
      if (!isMounted.current) return;
      setEntries(list => (list ?? []).map(entry => (entry.id === id ? { ...entry, title } : entry)));
      setRenamingId(null);
    } catch (renameError) {
      if (isMounted.current) setError(renameError instanceof Error ? renameError.message : 'The name could not be changed.');
    } finally {
      if (isMounted.current) setWorkingId(null);
    }
  };

  const toggleBrief = async (id: string) => {
    if (briefOpenId === id) { setBriefOpenId(null); return; }
    setBriefOpenId(id);
    if (briefs[id] !== undefined && briefs[id] !== 'error') return;
    setBriefLoadingId(id);
    try {
      const loaded = isViewingOther ? await adminLoadQuickResult(id) : await loadQuickResult(id);
      if (isMounted.current) setBriefs(map => ({ ...map, [id]: loaded?.result.briefRecord ?? null }));
    } catch {
      if (isMounted.current) setBriefs(map => ({ ...map, [id]: 'error' }));
    } finally {
      if (isMounted.current) setBriefLoadingId(null);
    }
  };

  const confirmDelete = async (id: string) => {
    setWorkingId(id);
    setError(null);
    try {
      await deleteQuickResult(id);
      if (!isMounted.current) return;
      setEntries(list => (list ?? []).filter(entry => entry.id !== id));
      setDeletingId(null);
      onDeleted(id);
    } catch (deleteError) {
      if (isMounted.current) setError(deleteError instanceof Error ? deleteError.message : 'The result could not be deleted.');
    } finally {
      if (isMounted.current) setWorkingId(null);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-gray-900 dark:text-white">History</h1>
          <p className="text-gray-600 dark:text-gray-400">Every run is saved automatically, newest first.</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          data-tip={TIPS.new}
          className="inline-flex items-center justify-center min-h-[44px] px-6 bg-primary-500 hover:bg-primary-400 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          New
        </button>
      </div>

      {isViewingOther && viewingUser && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4`}>
          <p className="text-gray-900 dark:text-gray-100">
            Viewing history of <span className="font-semibold">{viewingUser.email}</span>
          </p>
          <Link
            to="/manage-users"
            className="inline-flex items-center min-h-[36px] px-3 text-primary-800 dark:text-primary-300 underline hover:text-primary-900 dark:hover:text-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Back to Manage users
          </Link>
        </div>
      )}

      {error && (
        <div role="alert" className={`${card} flex items-start gap-2.5 p-4`}>
          <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-critical" aria-hidden="true" />
          <p className="text-gray-900 dark:text-gray-100 break-words">{error}</p>
        </div>
      )}

      {entries === null && (
        <p className="text-gray-600 dark:text-gray-400" role="status">
          Loading your results…
        </p>
      )}

      {entries !== null && entries.length === 0 && !error && (
        <div className={`${card} p-6 flex flex-col gap-1`}>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Nothing here yet.</p>
          <p className="text-gray-600 dark:text-gray-400">Run a piece of copy and it will appear in this list.</p>
        </div>
      )}

      {entries !== null && entries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {entries.map(entry => {
            const isRenaming = renamingId === entry.id;
            const isDeleting = deletingId === entry.id;
            const isWorking = workingId === entry.id;
            return (
              <li key={entry.id} className={`${card} px-5 py-3 flex flex-col gap-2`}>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                  {isRenaming ? (
                    <div className="flex flex-wrap items-center gap-2 flex-[1_1_320px] min-w-0">
                      <label htmlFor={`rename-${entry.id}`} className="sr-only">
                        Name
                      </label>
                      <input
                        id={`rename-${entry.id}`}
                        type="text"
                        value={draft}
                        maxLength={120}
                        onChange={event => setDraft(event.target.value)}
                        onKeyDown={event => {
                          if (event.key === 'Enter') saveRename(entry.id);
                          if (event.key === 'Escape') setRenamingId(null);
                        }}
                        className="flex-[1_1_220px] min-w-0 min-h-[44px] px-3.5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button type="button" onClick={() => saveRename(entry.id)} disabled={isWorking || !draft.trim()} className={smallButton}>
                        Save
                      </button>
                      <button type="button" onClick={() => setRenamingId(null)} disabled={isWorking} className={smallButton}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpen(entry.id)}
                      className="min-h-[44px] flex-[1_1_320px] min-w-0 text-left font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-800 dark:hover:text-primary-300 break-words focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {entry.title}
                    </button>
                  )}
                  <span className="inline-flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {entry.score != null ? (
                      <>
                        <span className={`w-1 h-5 ${getAbsoluteScoreMarkClass(entry.score)}`} aria-hidden="true" />
                        {entry.score} / 100
                      </>
                    ) : (
                      <span className="font-normal text-gray-600 dark:text-gray-400">Not scored</span>
                    )}
                  </span>
                </div>

                {entry.briefPiece && (
                  <div className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                    <p className="break-words whitespace-pre-line line-clamp-2">From brief: {entry.briefPiece}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {[entry.goalKey && `Goal: ${quickGoalName(entry.goalKey, entry.goalLabel)}`,
                      entry.sourceHost && `From ${entry.sourceHost}`,
                      entry.originalScore != null && `Original: ${entry.originalScore}`,
                      entry.sessionId && usage[entry.sessionId] && usageText(usage[entry.sessionId], isAdmin),
                      formatDate(entry.createdAt),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {isDeleting ? (
                    <span className="inline-flex flex-wrap items-center gap-3">
                      <span className="text-gray-900 dark:text-gray-100">Delete this result?</span>
                      <button
                        type="button"
                        onClick={() => confirmDelete(entry.id)}
                        disabled={isWorking}
                        className="inline-flex items-center min-h-[44px] text-status-critical underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        Yes, delete
                      </button>
                      <button type="button" onClick={() => setDeletingId(null)} disabled={isWorking} className={linkButton}>
                        Keep
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex flex-wrap items-center gap-4">
                      <button type="button" onClick={() => onOpen(entry.id)} data-tip={TIPS.open} className={linkButton}>
                        Open
                      </button>
                      {entry.briefPiece && (
                        <button type="button" onClick={() => toggleBrief(entry.id)} aria-expanded={briefOpenId === entry.id} className={linkButton}>
                          {briefOpenId === entry.id ? 'Hide brief' : 'Brief'}
                        </button>
                      )}
                      {!isViewingOther && (
                        <button type="button" onClick={() => startRename(entry)} data-tip={TIPS.rename} className={linkButton}>
                          Rename
                        </button>
                      )}
                      {!isViewingOther && (
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingId(null);
                            setDeletingId(entry.id);
                          }}
                          data-tip={TIPS.remove}
                          className="inline-flex items-center min-h-[44px] text-status-critical underline focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          Delete
                        </button>
                      )}
                    </span>
                  )}
                </div>

                {briefOpenId === entry.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    {briefLoadingId === entry.id ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading the brief…</p>
                    ) : briefs[entry.id] === 'error' ? (
                      <p className="text-sm text-status-critical">The brief could not be loaded. Click Brief to try again.</p>
                    ) : briefs[entry.id] ? (
                      <>
                        <BriefRecordBox brief={briefs[entry.id] as QuickBriefRecord} copyText="text-gray-700 dark:text-gray-300 [&_ul]:list-disc [&_ol]:list-decimal" open />
                        <button type="button" onClick={() => onOpen(entry.id)} className={`${linkButton} self-start`}>Open the result</button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No brief was saved for this run.</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
};

export default QuickHistory;
