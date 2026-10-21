/**
 * Quick — "Check with another AI": the panel under the result's toolbar.
 *
 * One click on an AI's name copies the check text (see buildAiCheckPrompt.ts)
 * and opens that AI in a new tab; the user pastes and sends. Nothing is
 * attached. "Copy only" is for any other AI. The two-step check, for users
 * who want the other AI fully blind to CopyZap's scores, is behind a small
 * link so it does not crowd the simple way.
 *
 * After step 1 is copied, step 2 becomes the obvious next click (its button
 * turns orange, its heading says "do this next"), and when the user comes
 * back from the other AI's tab without having sent step 2 a reminder box
 * appears above the step 2 heading and scrolls into view.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GeneratedContentItem } from '../types';
import { AI_CHECK_TARGETS, buildAiCheckPrompt } from '../engine/buildAiCheckPrompt';
import type { QuickRunResult } from '../engine/runQuickPipeline';
import { TIPS } from './tips';

interface QuickAiCheckProps {
  result: QuickRunResult;
  best: GeneratedContentItem;
  /** The name of the History entry, when it differs from the first line of the copy. */
  title?: string;
  /** The saved result's id, for the link back to it. Null while it is not saved. */
  resultId?: string | null;
  onClose: () => void;
}

const button =
  'inline-flex items-center justify-center min-h-[44px] px-5 bg-white dark:bg-gray-900 ' +
  'border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium ' +
  'hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500';
const primary =
  'inline-flex items-center justify-center min-h-[44px] px-5 bg-primary-500 hover:bg-primary-400 ' +
  'text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
const link =
  'inline-flex items-center min-h-[40px] text-sm text-primary-800 dark:text-primary-300 underline ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const QuickAiCheck: React.FC<QuickAiCheckProps> = ({ result, best, title, resultId, onClose }) => {
  const prompt = useMemo(() => {
    // The address that opens this result again: this page with ?r=<id>.
    const resultUrl = resultId
      ? `${window.location.origin}${window.location.pathname}?r=${encodeURIComponent(resultId)}`
      : undefined;
    return buildAiCheckPrompt(result, best, { title, resultUrl });
  }, [result, best, title, resultId]);
  // What the last click did, shown as one line under the buttons.
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  // The one-message check, where the other AI sees our scores with the copy. Not the default (see buildAiCheckPrompt.ts).
  const [oneMessage, setOneMessage] = useState(false);
  // Which steps have been copied: step 2 turns orange once step 1 is done, and a
  // reminder box appears when the user comes back from the other AI without it.
  const [step1Copied, setStep1Copied] = useState(false);
  const [step2Copied, setStep2Copied] = useState(false);
  const [backAfterStep1, setBackAfterStep1] = useState(false);
  const reminderRef = useRef<HTMLDivElement | null>(null);

  // When the user returns to this tab from the other AI's, after step 1 and
  // before step 2, show the "now send step 2" reminder and scroll it in.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && step1Copied && !step2Copied) {
        setBackAfterStep1(true);
      }
    };
    const onFocus = () => {
      if (step1Copied && !step2Copied) setBackAfterStep1(true);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [step1Copied, step2Copied]);

  useEffect(() => {
    if (backAfterStep1 && !step2Copied && reminderRef.current) {
      reminderRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [backAfterStep1, step2Copied]);

  // Copy first, then open: copying needs this page to have the focus.
  const copyAndOpen = async (target: (typeof AI_CHECK_TARGETS)[number]) => {
    const ok = await copyText(prompt.step1);
    if (!ok) {
      setStatus({ ok: false, text: 'Copying did not work in this browser. Use "Copy step 1 only" and try again.' });
      return;
    }
    window.open(target.url, '_blank', 'noopener,noreferrer');
    setStep1Copied(true);
    setBackAfterStep1(false);
    setStatus({
      ok: true,
      text: `Step 1 copied. In the ${target.name} tab, paste it into the message box (Ctrl+V or ⌘V) and send. When it has scored, come back for step 2.`,
    });
  };

  const copyOnly = async (text: string, done: string) => {
    const ok = await copyText(text);
    setStatus(ok ? { ok: true, text: done } : { ok: false, text: 'Copying did not work in this browser. Try again.' });
  };

  const copyStep1Only = async () => {
    const ok = await copyText(prompt.step1);
    if (!ok) {
      setStatus({ ok: false, text: 'Copying did not work in this browser. Try again.' });
      return;
    }
    setStep1Copied(true);
    setBackAfterStep1(false);
    setStatus({ ok: true, text: 'Step 1 copied. Paste it into any AI chat, send, and wait for its scores.' });
  };

  const copyStep2 = async () => {
    const ok = await copyText(prompt.step2);
    if (!ok) {
      setStatus({ ok: false, text: 'Copying did not work in this browser. Try again.' });
      return;
    }
    setStep2Copied(true);
    setBackAfterStep1(false);
    setStatus({ ok: true, text: 'Step 2 copied. Paste it into the same chat and send.' });
  };

  // Once step 1 is copied and step 2 is not, step 2 is the obvious next click:
  // its button turns orange, and the step 1 buttons go back to the outline style.
  const step2IsPrimary = step1Copied && !step2Copied;
  const step1BtnClass = step2IsPrimary ? button : primary;
  const step2BtnClass = step2IsPrimary ? primary : button;
  const showReminder = backAfterStep1 && !step2Copied;

  return (
    <section
      aria-label="Check with another AI"
      className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 whitespace-normal"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Check this score with another AI</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Don't take our word for it. Pick an AI: we copy a ready-made check and open it. It scores your original and our
            best version with our rubric before it sees our scores. Then you send our scores, and it tells you whether the
            new version is better and where it agrees with us.
          </p>
        </div>
        <button type="button" onClick={onClose} className={`${button} shrink-0 px-3`} aria-label="Close">
          Close
        </button>
      </div>

      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Step 1: the copy, without our scores</p>
      <div className="flex flex-wrap items-center gap-2">
        {AI_CHECK_TARGETS.map(target => (
          <button key={target.key} type="button" onClick={() => copyAndOpen(target)} className={step1BtnClass}>
            Copy &amp; open {target.name}
          </button>
        ))}
        <button
          type="button"
          onClick={copyStep1Only}
          data-tip={TIPS.aiCheckCopyOnly}
          className={step1BtnClass}
        >
          Copy step 1 only
        </button>
      </div>

      {showReminder && (
        <div
          ref={reminderRef}
          role="status"
          className="flex flex-col gap-2 p-3 border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20"
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Back from the other AI? Now send step 2.</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Without it you only have the other AI's own scores. Step 2 shows whether it finds the best version better and
            whether it agrees with ours.
          </p>
          <button type="button" onClick={copyStep2} data-tip={TIPS.aiCheckTwoSteps} className={`${primary} self-start`}>
            Copy step 2: our scores
          </button>
        </div>
      )}

      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {step2IsPrimary ? 'Step 2: our scores, in the same chat — do this next' : 'Step 2: our scores, in the same chat'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyStep2}
          data-tip={TIPS.aiCheckTwoSteps}
          className={step2BtnClass}
        >
          Copy step 2: our scores
        </button>
      </div>

      {status && (
        <p role="status" className="flex items-start gap-2.5 text-sm text-gray-900 dark:text-gray-100">
          <span
            className={`w-1 h-5 shrink-0 ${status.ok ? 'bg-status-good' : 'bg-status-critical'}`}
            aria-hidden="true"
          />
          <span>{status.text}</span>
        </p>
      )}

      <p className="text-xs text-gray-600 dark:text-gray-400">
        Small differences are normal: any AI, including ours, scores the same text a few points apart on different
        readings, and some AIs grade a little more generously than others. What matters most is the first line of its
        answer: is the new version better than your original?
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOneMessage(open => !open)}
          aria-expanded={oneMessage}
          className={`${link} self-start`}
        >
          {oneMessage ? 'Hide the one-message check' : 'Prefer one message? Quick check, with our scores included'}
        </button>
        {oneMessage && (
          <div className="flex flex-col gap-2 pl-3 border-l-2 border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Everything in one message: faster, but the other AI sees our scores while it scores, so it is less
              independent than the two steps above.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyOnly(prompt.full, 'Copied. Paste it into any AI chat and send.')}
                className={button}
              >
                Copy the one-message check
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default QuickAiCheck;
