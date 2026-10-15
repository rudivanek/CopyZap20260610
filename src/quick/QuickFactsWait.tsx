import React, { useEffect, useRef, useState } from 'react';
import { playSuccessSound } from '../utils/soundEffects';

/**
 * The waits of "Make it stronger" on the check screen. While one runs the whole
 * screen is locked (mouse and keyboard), so the user cannot generate, go back or
 * type before the questions are there. Short waits (most chat steps) only lock:
 * the modal with the running time appears after SHOW_AFTER_MS. The finish sound
 * plays only for the questions loading, and only when the modal was shown: never
 * for a chat answer or a page check on its own. Back-to-back waits (the questions
 * arrive, then the page check under the first question starts) count as one
 * wait, so the modal and the sound do not flicker in between.
 */
export type FactsWaitKind = 'questions' | 'answer' | 'page';

interface QuickFactsWaitProps {
  /** The wait running now, or null when nothing runs. */
  kind: FactsWaitKind | null;
  /** Stops waiting for this kind (see QuickPage): the screen unlocks at once. */
  onCancel: (kind: FactsWaitKind) => void;
}

const SHOW_AFTER_MS = 3000;
/** A wait that ends and another that starts within this time are one wait. */
const JOIN_MS = 400;

const TEXT: Record<FactsWaitKind, { title: string; detail: string; cancel: string }> = {
  questions: {
    title: 'Looking for what is missing',
    detail: 'CopyZap reads your copy and picks the questions that would make it stronger.',
    cancel: 'Skip the questions',
  },
  answer: {
    title: 'Reading your answer',
    detail: 'CopyZap takes the facts from your answer and picks the next question.',
    cancel: 'Stop the chat here',
  },
  page: {
    title: 'Checking your page',
    detail: 'Looking in your page for an answer to this question.',
    cancel: 'Skip this check',
  },
};

const button =
  'inline-flex items-center justify-center min-h-[44px] px-5 border font-medium ' +
  'bg-white border-gray-400 text-gray-900 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

const QuickFactsWait: React.FC<QuickFactsWaitProps> = ({ kind, onCancel }) => {
  // The kind on screen: stays a moment after a wait ends, in case the next one starts at once.
  const [shownKind, setShownKind] = useState<FactsWaitKind | null>(kind);
  const [startedAt, setStartedAt] = useState<number | null>(kind ? Date.now() : null);
  const [now, setNow] = useState(Date.now());
  const modalShown = useRef(false);
  const cancelled = useRef(false);
  // This wait included loading the questions: the only wait that ends with the sound.
  const hadQuestions = useRef(false);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (kind) {
      if (kind === 'questions') hadQuestions.current = true;
      setShownKind(kind);
      setStartedAt(at => at ?? Date.now());
      return;
    }
    if (shownKind === null) return;
    // Ended: unlock after JOIN_MS unless another wait starts.
    const timer = window.setTimeout(() => {
      if (modalShown.current && hadQuestions.current && !cancelled.current) playSuccessSound();
      modalShown.current = false;
      cancelled.current = false;
      hadQuestions.current = false;
      setShownKind(null);
      setStartedAt(null);
    }, JOIN_MS);
    return () => window.clearTimeout(timer);
  }, [kind, shownKind]);

  const active = shownKind !== null && startedAt !== null;

  // The running time.
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [active]);

  // Keys do nothing outside the modal while locked: no Enter on "Looks right, generate", no typing.
  useEffect(() => {
    if (!active) return;
    const block = (event: KeyboardEvent) => {
      if (overlay.current && event.target instanceof Node && overlay.current.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('keydown', block, true);
    window.addEventListener('keyup', block, true);
    window.addEventListener('keypress', block, true);
    return () => {
      window.removeEventListener('keydown', block, true);
      window.removeEventListener('keyup', block, true);
      window.removeEventListener('keypress', block, true);
    };
  }, [active]);

  if (!active || !shownKind || startedAt === null) return null;

  const elapsedMs = now - startedAt;
  const showModal = elapsedMs >= SHOW_AFTER_MS;
  if (showModal) modalShown.current = true;
  const { title, detail, cancel } = TEXT[shownKind];

  return (
    <div
      ref={overlay}
      aria-busy="true"
      className={
        'fixed inset-0 z-50 flex items-center justify-center p-4 cursor-wait ' + (showModal ? 'bg-gray-900/60' : 'bg-transparent')
      }
    >
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-facts-wait-title"
          className="w-full max-w-md max-h-full overflow-y-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-6 sm:p-8 flex flex-col gap-5 cursor-default"
        >
          <div className="flex flex-col gap-1">
            <h2 id="quick-facts-wait-title" className="text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{detail}</p>
          </div>

          <div className="flex items-center gap-3" role="status" aria-live="polite">
            <span className="w-1.5 h-10 bg-primary-500 animate-pulse" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-3xl font-semibold leading-none text-gray-900 dark:text-white tabular-nums">
                {formatElapsed(Math.floor(elapsedMs / 1000))}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Time running · keep this tab open</span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={() => {
                cancelled.current = true;
                onCancel(shownKind);
              }}
              className={button}
            >
              {cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickFactsWait;
