import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { GOAL_OPTIONS } from '../utils/scoringContextStorage';
import { getAbsoluteScoreMarkClass } from '../utils/scoreColors';
import { deleteQuickResult, listQuickResults, QuickHistoryEntry, renameQuickResult } from '../engine/quickHistory';

interface QuickHistoryProps {
  currentUser: User;
  onOpen: (id: string) => void;
  onNew: () => void;
  /** Tells the page that an entry is gone, in case it is the result currently open. */
  onDeleted: (id: string) => void;
}

const card = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700';
const linkButton =
  'inline-flex items-center min-h-[44px] text-primary-800 dark:text-primary-300 underline ' +
  'hover:text-primary-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500';
const smallButton =
  'inline-flex items-center justify-center min-h-[44px] px-4 bg-white dark:bg-gray-900 border border-gray-400 ' +
  'dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 ' +
  'disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500';

function goalName(key: string | null): string {
  if (!key) return '';
  const option = GOAL_OPTIONS.find(item => item.key === key);
  return option ? option.label.split(' — ')[0] : key;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const QuickHistory: React.FC<QuickHistoryProps> = ({ currentUser, onOpen, onNew, onDeleted }) => {
  const [entries, setEntries] = useState<QuickHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const isMounted = useRef(true);
  const userId = currentUser.id;

  useEffect(() => {
    isMounted.current = true;
    listQuickResults(userId)
      .then(list => {
        if (isMounted.current) setEntries(list);
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
  }, [userId]);

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
          className="inline-flex items-center justify-center min-h-[44px] px-6 bg-primary-500 hover:bg-primary-400 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          New
        </button>
      </div>

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

                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {[goalName(entry.goalKey) && `Goal: ${goalName(entry.goalKey)}`,
                      entry.sourceHost && `From ${entry.sourceHost}`,
                      entry.originalScore != null && `Original: ${entry.originalScore}`,
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
                      <button type="button" onClick={() => onOpen(entry.id)} className={linkButton}>
                        Open
                      </button>
                      <button type="button" onClick={() => startRename(entry)} className={linkButton}>
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(null);
                          setDeletingId(entry.id);
                        }}
                        className="inline-flex items-center min-h-[44px] text-status-critical underline focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
};

export default QuickHistory;
