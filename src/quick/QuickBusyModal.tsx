import React from 'react';
import type { QuickProgress, QuickStage } from '../engine/runQuickPipeline';

/** The processes that show the modal. */
export type QuickBusyKind = 'fetch' | 'reading' | 'running' | 'rescoring' | 'opening' | 'changing';

interface QuickBusyModalProps {
  kind: QuickBusyKind;
  /** Seconds since the process started. */
  elapsed: number;
  /** Progress of a run (kind "running" only). */
  progress?: QuickProgress;
  /** How many versions a run writes. */
  versions: number;
}

const STAGE_ORDER: QuickStage[] = ['checking', 'writing', 'scoring'];

const TEXT: Record<QuickBusyKind, { title: string; detail: string }> = {
  fetch: { title: 'Fetching the page', detail: 'Reading the page and taking its copy. This can take a minute or two.' },
  reading: { title: 'Reading your copy', detail: 'Working out what it sells, who it is for and its tone.' },
  running: { title: 'Writing and scoring', detail: 'This can take a few minutes.' },
  rescoring: { title: 'Scoring again', detail: 'Scoring every version against your goal.' },
  opening: { title: 'Opening your result', detail: 'Loading the saved versions and scores.' },
  changing: { title: 'Changing your copy', detail: 'Rewriting the best version, then scoring it. About a minute.' },
};

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

const QuickBusyModal: React.FC<QuickBusyModalProps> = ({ kind, elapsed, progress, versions }) => {
  const { title, detail } = TEXT[kind];
  const activeStage = progress ? STAGE_ORDER.indexOf(progress.stage) : 0;
  const total = progress?.total ?? versions;
  const stageLabels: Record<QuickStage, string> =
    kind === 'changing'
      ? {
          checking: 'Checking your account',
          writing: 'Rewriting the best version',
          scoring: 'Scoring it and picking the best',
        }
      : {
          checking: 'Checking your account',
          writing:
            progress?.stage === 'writing'
              ? `Writing ${total} versions (${progress.done ?? 0} of ${total} done)`
              : `Writing ${total} versions`,
          scoring: 'Scoring them and picking the best',
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-busy-title"
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-6 sm:p-8 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <h2 id="quick-busy-title" className="text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{detail}</p>
        </div>

        {(kind === 'running' || kind === 'changing') && (
          <div role="status" aria-live="polite">
            <ol className="border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {STAGE_ORDER.map((stage, index) => {
                const state = index < activeStage ? 'done' : index === activeStage ? 'active' : 'waiting';
                return (
                  <li key={stage} className="flex items-center gap-3 px-4 min-h-[48px]">
                    <span
                      aria-hidden="true"
                      className={
                        'w-1 h-5 shrink-0 ' +
                        (state === 'done'
                          ? 'bg-status-good'
                          : state === 'active'
                            ? 'bg-primary-500 animate-pulse'
                            : 'bg-gray-300 dark:bg-gray-600')
                      }
                    />
                    <span
                      className={
                        state === 'waiting'
                          ? 'text-gray-500 dark:text-gray-400'
                          : 'text-gray-900 dark:text-gray-100 font-medium'
                      }
                    >
                      {stageLabels[stage]}
                      {state === 'done' && <span className="sr-only"> (done)</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="w-1.5 h-10 bg-primary-500 animate-pulse" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-3xl font-semibold leading-none text-gray-900 dark:text-white tabular-nums">
              {formatElapsed(elapsed)}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Time running · keep this tab open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBusyModal;
