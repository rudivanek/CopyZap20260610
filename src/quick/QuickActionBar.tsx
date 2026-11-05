/**
 * Quick result: the action bar at the bottom of the screen.
 *
 * The user should never have to look for what to do next. The bar shows one
 * main button, the recommended next step, with a short line saying why, and
 * the other actions always in the same place. The recommended step changes
 * with the result (see nextStep below), in this order:
 *   1. claims still open      → "Check N claims" (jumps to the list)
 *   2. the text changed       → "Re-score" (asks first, then scores)
 *   3. weak call to action    → "Strengthen the call to action"
 *   4. details missing        → "Answer and run again"
 *   5. nothing left to do     → "Copy"
 * Nothing that costs credits starts by itself: every step is a click, and
 * Re-score still asks first.
 */
import React, { useEffect, useRef, useState } from 'react';
import { RESCORE_CREDITS_RANGE } from '../engine/claimReview';
import { TIPS } from './tips';

export interface QuickNextStep {
  label: string;
  /** One short line: why this is the next step. */
  reason: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface QuickNextStepInput {
  isRescoring: boolean;
  scored: boolean;
  openClaims: number;
  scoreStale: boolean;
  /** Where the claims come from, for the reason line: "your original", "your answers or your website". */
  claimSource: string;
  ctaPersuasion: number | null;
  runAgainMissing: string[] | null;
  originalHigher: boolean;
  copied: boolean;
  onScoreAgain: () => void;
  onCheckClaims: () => void;
  onRescore: () => void;
  onStrengthenCta?: () => void;
  onRunAgain?: () => void;
  onCopy: () => void;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** The recommended next step for the result as it is now. */
export function nextStep(input: QuickNextStepInput): QuickNextStep & { isCopy: boolean } {
  if (input.isRescoring) {
    return { label: 'Scoring…', reason: 'Scoring your copy. This takes about half a minute.', onClick: () => {}, disabled: true, isCopy: false };
  }
  if (!input.scored) {
    return { label: 'Score again', reason: 'Scoring did not finish, so this version has no score yet.', onClick: input.onScoreAgain, isCopy: false };
  }
  if (input.openClaims > 0) {
    const n = input.openClaims;
    return {
      label: n === 1 ? 'Check 1 claim' : `Check ${n} claims`,
      reason: `${n === 1 ? '1 claim is' : `${n} claims are`} not in ${input.claimSource}. Keep, remove or reword ${n === 1 ? 'it' : 'them'} before you publish.`,
      onClick: input.onCheckClaims,
      isCopy: false,
    };
  }
  if (input.scoreStale) {
    return {
      label: 'Re-score',
      reason: `Your copy changed, so the score is for the text before. Re-scoring costs ${RESCORE_CREDITS_RANGE} credits.`,
      onClick: input.onRescore,
      isCopy: false,
    };
  }
  if (input.onStrengthenCta && input.ctaPersuasion != null) {
    return {
      label: 'Strengthen the call to action',
      reason: `The call to action scores low (${input.ctaPersuasion}/25 on Persuasion). One pass uses credits; it is kept only if it scores clearly higher.`,
      onClick: input.onStrengthenCta,
      isCopy: false,
    };
  }
  if (input.onRunAgain && input.runAgainMissing) {
    return {
      label: 'Answer and run again',
      reason:
        input.runAgainMissing.length > 0
          ? `Your copy is missing ${joinList(input.runAgainMissing)}. A new run uses credits.`
          : 'A few details would make it stronger. A new run uses credits.',
      onClick: input.onRunAgain,
      isCopy: false,
    };
  }
  return {
    label: input.copied ? 'Copied' : 'Copy',
    reason: input.originalHigher
      ? 'Your original scores higher: keep it, and take from this version only the parts you like.'
      : 'All checked. Copy it, or export the report.',
    onClick: input.onCopy,
    isCopy: true,
  };
}

export interface QuickMoreItem {
  label: string;
  tip?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionBarProps {
  step: QuickNextStep & { isCopy: boolean };
  copied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  editDisabled: boolean;
  onChange: () => void;
  changeDisabled: boolean;
  more: QuickMoreItem[];
  /** Shown above the buttons: the "copy anyway?" question, an export error. */
  notice?: React.ReactNode;
  /** The "Jump to" links, under the buttons. */
  jumpRow: React.ReactNode;
}

const mainButton =
  'shrink-0 inline-flex items-center justify-center min-h-[44px] px-5 bg-primary-500 hover:bg-primary-400 ' +
  'text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
const otherButton =
  'shrink-0 inline-flex items-center justify-center min-h-[44px] px-4 bg-white dark:bg-gray-900 ' +
  'border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium ' +
  'hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';

const QuickActionBar: React.FC<QuickActionBarProps> = ({
  step,
  copied,
  onCopy,
  onEdit,
  editDisabled,
  onChange,
  changeDisabled,
  more,
  notice,
  jumpRow,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') setMoreOpen(false);
        return;
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [moreOpen]);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      {notice && <div className="px-4 sm:px-6 pt-2">{notice}</div>}
      <div
        role="toolbar"
        aria-label="Next step and actions"
        className="px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-3 gap-y-2"
      >
        <div className="flex items-center gap-3 min-w-0 flex-[1_1_420px]">
          <button type="button" onClick={step.onClick} disabled={step.disabled} className={mainButton}>
            {step.label}
          </button>
          <p role="status" className="min-w-0 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            <span className="sr-only">Next step: </span>
            {step.reason}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {!step.isCopy && (
            <button type="button" onClick={onCopy} data-tip={TIPS.copy} className={otherButton}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          <button type="button" onClick={onEdit} disabled={editDisabled} data-tip={TIPS.editMyself} className={otherButton}>
            Edit
          </button>
          <button type="button" onClick={onChange} disabled={changeDisabled} data-tip={TIPS.goToChange} className={otherButton}>
            Change it
          </button>
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen(open => !open)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={otherButton}
            >
              More…
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-lg flex flex-col py-1"
              >
                {more.map(item => (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    data-tip={item.tip}
                    disabled={item.disabled}
                    onClick={() => {
                      setMoreOpen(false);
                      item.onClick();
                    }}
                    className="text-left min-h-[44px] px-4 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800">{jumpRow}</div>
    </div>
  );
};

export default QuickActionBar;
