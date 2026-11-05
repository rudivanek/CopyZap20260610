/**
 * Quick — "Check before you publish": the best version's claims, one line
 * each, under the copy (see engine/claimReview.ts). Each claim is kept
 * ("It's true"), taken out ("Remove it") or rewritten by the user ("Edit it"),
 * and every choice can be undone. Also the box that asks before "Re-score".
 */
import React, { useEffect, useRef, useState } from 'react';
import type { ClaimDecision } from '../engine/claimReview';
import { findClaim, RESCORE_CREDITS_RANGE, RESCORE_SECONDS_ESTIMATE } from '../engine/claimReview';
import { CLAIM_MAX_POINTS, CLAIM_POINTS } from '../engine/sourceClaims';
import GrowingField from './GrowingField';

export interface ClaimItem {
  claim: string;
  /** What the user decided; null while the claim is open. */
  decision: ClaimDecision | null;
  /** The sentence the claim stands in now. Null when it is no longer in the text. */
  sentence: string | null;
}

/**
 * True when a claim left the copy with another one's change (its sentence was
 * rewritten or removed): nothing is left to decide. It keeps its place and its
 * number in the list, so the other cards do not move.
 */
export const isGone = (item: ClaimItem) => !item.decision && !item.sentence;
/** True while a claim still waits for a decision. */
export const isOpen = (item: ClaimItem) => !item.decision && !!item.sentence;

interface ClaimChecklistProps {
  items: ClaimItem[];
  /** True while something else runs (a change, a scoring): nothing can be decided. */
  disabled: boolean;
  onKeep: (claim: string) => void;
  onRemove: (claim: string) => Promise<void>;
  /** The sentence the claim stands in, rewritten. Empty takes the sentence out. */
  onEdit: (claim: string, sentence: string) => void;
  onUndo: (claim: string) => void;
  /** Where the claims were looked for: "your original" by default; "your answers or your website" for a draft from Brief (2). */
  sourceName?: string;
}

const smallButton =
  'inline-flex items-center justify-center min-h-[44px] px-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';
const lightButton = `${smallButton} bg-white border border-gray-400 text-gray-900 hover:bg-gray-100`;
const darkButton = `${smallButton} bg-gray-900 border border-gray-900 text-white hover:bg-gray-700`;
const accentButton = `${smallButton} bg-primary-500 hover:bg-primary-400 text-white`;
const undoButton =
  'inline-flex items-center min-h-[44px] px-2 text-sm text-primary-800 underline disabled:opacity-50 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';

/** The yellow of a claim in the copy, also used for its number here. */
export const CLAIM_MARK_BACKGROUND = '#FFE9A8';
export const CLAIM_MARK_LINE = '#C98A00';

/** The sentence with the claim in bold. */
const SentenceWithClaim: React.FC<{ sentence: string; claim: string }> = ({ sentence, claim }) => {
  const found = findClaim(sentence, claim);
  if (!found) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, found.start)}
      <strong className="font-semibold text-gray-900">{sentence.slice(found.start, found.end)}</strong>
      {sentence.slice(found.end)}
    </>
  );
};

const ClaimChecklist: React.FC<ClaimChecklistProps> = ({ items, disabled, onKeep, onRemove, onEdit, onUndo, sourceName = 'your original' }) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const open = items.filter(isOpen).length;
  const busy = disabled || removing !== null;

  const startEdit = (item: ClaimItem) => {
    setEditing(item.claim);
    setDraft(item.sentence ?? item.claim);
    window.setTimeout(() => document.getElementById(`quick-claim-edit-${items.indexOf(item) + 1}`)?.focus(), 30);
  };
  const saveEdit = (claim: string) => {
    onEdit(claim, draft);
    setEditing(null);
  };
  const remove = async (claim: string) => {
    setRemoving(claim);
    try {
      await onRemove(claim);
    } finally {
      setRemoving(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <section
      id="quick-claims"
      aria-labelledby="quick-claims-title"
      className="bg-white border border-gray-200 dark:border-gray-600 p-5 sm:p-6 flex flex-col gap-4 scroll-mt-20"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id="quick-claims-title" className="text-gray-900">
          Check before you publish
        </h2>
        <span className="text-xs font-semibold text-gray-900 inline-flex items-center gap-2">
          <span className={`w-1 h-4 ${open > 0 ? 'bg-status-warning' : 'bg-status-good'}`} aria-hidden="true" />
          {open > 0 ? `${open} of ${items.length} open` : 'All checked'}
        </span>
      </div>
      <p className="text-gray-700">
        We couldn't find these in {sourceName}. Keep what's true, remove the rest, or say it in your own words. Each
        open claim costs {CLAIM_POINTS} points (up to {CLAIM_MAX_POINTS}). A claim you keep, remove or reword stops costing
        points right away, and the copy you copy or export has your changes. After you remove or reword one, Re-score,
        next to the score, scores the changed text.
      </p>

      <ol className="flex flex-col gap-3">
        {items.map((item, index) => {
          const n = index + 1;
          const isEditing = editing === item.claim && !item.decision;
          const action = item.decision?.action;
          const gone = isGone(item);
          // Other open claims in the same sentence: the new wording settles them too.
          const sharing = isEditing
            ? items
                .map((other, at) => ({ other, number: at + 1 }))
                .filter(({ other }) => other !== item && isOpen(other) && other.sentence === item.sentence)
                .map(({ number }) => number)
            : [];
          return (
            <li
              key={item.claim}
              id={`quick-claim-${n}`}
              className="border border-gray-200 p-4 flex flex-wrap items-start gap-x-4 gap-y-3 scroll-mt-24"
            >
              <span
                aria-hidden="true"
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-gray-900"
                style={{ background: CLAIM_MARK_BACKGROUND }}
              >
                {n}
              </span>
              <div className="flex-[999_1_320px] min-w-0 flex flex-col gap-1">
                <p className="font-semibold text-gray-900 break-words">
                  <span className="sr-only">Claim {n}: </span>“{item.claim}”
                </p>
                {item.sentence && item.sentence.trim() !== item.claim.trim() && !action && (
                  <p className="text-sm text-gray-600 break-words">
                    In: <SentenceWithClaim sentence={item.sentence} claim={item.claim} />
                  </p>
                )}
              </div>
              <div className="flex-[1_1_auto] flex flex-wrap items-center justify-end gap-2">
                {isOpen(item) && !isEditing && (
                  <>
                    <button type="button" onClick={() => startEdit(item)} disabled={busy || !item.sentence} className={lightButton}>
                      Edit it
                    </button>
                    <button type="button" onClick={() => onKeep(item.claim)} disabled={busy} className={lightButton}>
                      It's true
                    </button>
                    <button type="button" onClick={() => remove(item.claim)} disabled={busy} className={darkButton}>
                      {removing === item.claim ? 'Removing…' : 'Remove it'}
                    </button>
                  </>
                )}
                {gone && (
                  <span className="text-sm font-semibold text-gray-900">No longer in the copy: it went with another change</span>
                )}
                {action === 'kept' && (
                  <span className="text-sm font-semibold text-gray-900">Kept: you confirmed it</span>
                )}
                {action === 'removed' && (
                  <span className="text-sm font-semibold text-gray-900">Removed from the copy</span>
                )}
                {action === 'edited' && (
                  <span className="text-sm font-semibold text-gray-900 break-words">Changed to your words</span>
                )}
                {item.decision && (
                  <button type="button" onClick={() => onUndo(item.claim)} disabled={busy} className={undoButton}>
                    Undo
                  </button>
                )}
              </div>
              {isEditing && (
                <div className="basis-full flex flex-col gap-2 sm:pl-11">
                  <label htmlFor={`quick-claim-edit-${n}`} className="text-sm font-semibold text-gray-900">
                    Your wording for this sentence <span className="font-normal text-gray-600">(empty removes it)</span>
                  </label>
                  {sharing.length > 0 && (
                    <p className="text-sm text-gray-600">
                      This sentence also holds {sharing.length === 1 ? 'claim' : 'claims'} {sharing.join(' and ')}. Your wording
                      replaces the whole sentence, so it settles {sharing.length === 1 ? 'that one' : 'those'} too.
                    </p>
                  )}
                  <GrowingField
                    id={`quick-claim-edit-${n}`}
                    value={draft}
                    onChange={setDraft}
                    onEnter={() => saveEdit(item.claim)}
                    disabled={busy}
                    className="w-full"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setEditing(null)} className={lightButton}>
                      Cancel
                    </button>
                    <button type="button" onClick={() => saveEdit(item.claim)} disabled={busy} className={accentButton}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-sm text-gray-600">
        Read the full copy once before you publish. We flag what we can't verify; you know your business best.
      </p>
    </section>
  );
};

/** Asks before "Re-score": what it does, what it costs, how long it takes. */
export const RescoreDialog: React.FC<{ onYes: () => void; onNo: () => void }> = ({ onYes, onNo }) => {
  const noRef = useRef<HTMLButtonElement>(null);
  // The latest onNo, so the key listener is set once and focus is not moved on every render.
  const onNoRef = useRef(onNo);
  onNoRef.current = onNo;
  useEffect(() => {
    noRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onNoRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onNo}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-rescore-title"
        onClick={event => event.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-6 flex flex-col gap-4"
      >
        <h2 id="quick-rescore-title" className="text-gray-900 dark:text-white">
          Re-score your changed version?
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          CopyZap scores the best version again with your changes, so the number matches what you publish.
        </p>
        <dl className="border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col gap-1.5">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600 dark:text-gray-400">Cost</dt>
            <dd className="font-semibold text-gray-900 dark:text-gray-100">{RESCORE_CREDITS_RANGE} credits, more for long copy</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600 dark:text-gray-400">Time</dt>
            <dd className="font-semibold text-gray-900 dark:text-gray-100">about {RESCORE_SECONDS_ESTIMATE} seconds</dd>
          </div>
        </dl>
        <p className="text-sm text-gray-600 dark:text-gray-400">The score can go up or down. Your text stays exactly as it is.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            ref={noRef}
            type="button"
            onClick={onNo}
            className="inline-flex items-center justify-center min-h-[44px] px-5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            No, keep it
          </button>
          <button
            type="button"
            onClick={onYes}
            className="inline-flex items-center justify-center min-h-[44px] px-5 bg-primary-500 hover:bg-primary-400 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Yes, re-score
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimChecklist;
