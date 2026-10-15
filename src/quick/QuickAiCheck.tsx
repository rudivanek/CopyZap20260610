/**
 * Quick — "Check with another AI": the panel under the result's toolbar.
 *
 * One click on an AI's name copies the check text (see buildAiCheckPrompt.ts)
 * and opens that AI in a new tab; the user pastes and sends. Nothing is
 * attached. "Copy only" is for any other AI. The two-step check, for users
 * who want the other AI fully blind to CopyZap's scores, is behind a small
 * link so it does not crowd the simple way.
 */
import React, { useMemo, useState } from 'react';
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
  const [twoSteps, setTwoSteps] = useState(false);

  // Copy first, then open: copying needs this page to have the focus.
  const copyAndOpen = async (target: (typeof AI_CHECK_TARGETS)[number]) => {
    const ok = await copyText(prompt.full);
    if (!ok) {
      setStatus({ ok: false, text: 'Copying did not work in this browser. Use "Copy only" and try again.' });
      return;
    }
    window.open(target.url, '_blank', 'noopener,noreferrer');
    setStatus({
      ok: true,
      text: `Copied. In the ${target.name} tab, paste it into the message box (Ctrl+V or ⌘V) and send.`,
    });
  };

  const copyOnly = async (text: string, done: string) => {
    const ok = await copyText(text);
    setStatus(ok ? { ok: true, text: done } : { ok: false, text: 'Copying did not work in this browser. Try again.' });
  };

  return (
    <section
      aria-label="Check with another AI"
      className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 whitespace-normal"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Check this score with another AI</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Don't take our word for it. Pick an AI: we copy a ready-made check and open it. Paste, send, and it scores the
            copy itself with our rubric, then tells you where it agrees and where it doesn't.
          </p>
        </div>
        <button type="button" onClick={onClose} className={`${button} shrink-0 px-3`} aria-label="Close">
          Close
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {AI_CHECK_TARGETS.map(target => (
          <button key={target.key} type="button" onClick={() => copyAndOpen(target)} className={primary}>
            Copy &amp; open {target.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => copyOnly(prompt.full, 'Copied. Paste it into any AI chat and send.')}
          data-tip={TIPS.aiCheckCopyOnly}
          className={button}
        >
          Copy only
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
        readings. A gap of up to 5 points on the total is not a disagreement.
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setTwoSteps(open => !open)}
          aria-expanded={twoSteps}
          data-tip={TIPS.aiCheckTwoSteps}
          className={`${link} self-start`}
        >
          {twoSteps ? 'Hide the strict check' : 'Strict check: the other AI scores before it sees our scores'}
        </button>
        {twoSteps && (
          <div className="flex flex-col gap-2 pl-3 border-l-2 border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Two messages in the same chat. Send step 1, wait for the answer, then send step 2.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyOnly(prompt.step1, 'Step 1 copied. Paste it into an AI chat, send, and wait for its scores.')}
                className={button}
              >
                Copy step 1: the copy
              </button>
              <button
                type="button"
                onClick={() => copyOnly(prompt.step2, 'Step 2 copied. Paste it into the same chat and send.')}
                className={button}
              >
                Copy step 2: our scores
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default QuickAiCheck;
