import React, { useEffect, useRef, useState } from 'react';
import { GoalKey, User } from '../types';
import { DEFAULT_GOAL_KEY, GOAL_OPTIONS } from '../utils/scoringContextStorage';
import { countWords } from '../utils/markdownUtils';
import { QUICK_DEFAULT_VARIANTS, QUICK_MAX_WORDS, QUICK_MIN_WORDS } from '../engine/buildQuickFormState';
import {
  QuickPipelineError,
  QuickProgress,
  QuickRunResult,
  QuickStage,
  runQuickPipeline,
  scoreQuickVersions,
  withQuickResult,
} from '../engine/runQuickPipeline';
import QuickTopBar from './QuickTopBar';
import QuickResult from './QuickResult';

interface QuickPageProps {
  currentUser: User;
  onLogout: () => void;
}

type Phase = 'start' | 'running' | 'result';

const STAGE_ORDER: QuickStage[] = ['checking', 'writing', 'scoring'];

const GOALS = GOAL_OPTIONS.filter(option => option.key !== 'custom').map(option => {
  const [name, description = ''] = option.label.split(' — ');
  return {
    key: option.key,
    name,
    description: description ? description.charAt(0).toUpperCase() + description.slice(1) : '',
  };
});

function messageOf(error: unknown): string {
  if (error instanceof QuickPipelineError) return error.message;
  if (error instanceof Error && error.message) return `Something went wrong. ${error.message}`;
  return 'Something went wrong. Please try again.';
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

const QuickPage: React.FC<QuickPageProps> = ({ currentUser, onLogout }) => {
  const [phase, setPhase] = useState<Phase>('start');
  const [copy, setCopy] = useState('');
  const [goalKey, setGoalKey] = useState<GoalKey>(DEFAULT_GOAL_KEY);
  const [progress, setProgress] = useState<QuickProgress>({ stage: 'checking' });
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuickRunResult | null>(null);
  const [isRescoring, setIsRescoring] = useState(false);
  const [runSeconds, setRunSeconds] = useState<number | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Count seconds while a run is in progress.
  useEffect(() => {
    if (phase !== 'running') return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // Ask before closing the tab mid-run: the run has already used credits.
  useEffect(() => {
    if (phase !== 'running') return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const words = copy.trim() ? countWords(copy) : 0;
  const tooShort = words < QUICK_MIN_WORDS;
  const tooLong = words > QUICK_MAX_WORDS;

  const handleRun = async () => {
    if (tooShort || tooLong) return;
    setError(null);
    setElapsed(0);
    setProgress({ stage: 'checking' });
    setPhase('running');
    window.scrollTo(0, 0);
    const startedAt = Date.now();

    try {
      const run = await runQuickPipeline({ copy, goalKey }, currentUser, update => {
        if (isMounted.current) setProgress(update);
      });
      if (!isMounted.current) return;
      setRunSeconds(Math.round((Date.now() - startedAt) / 1000));
      setResult(run);
      setPhase('result');
    } catch (runError) {
      if (!isMounted.current) return;
      setError(messageOf(runError));
      setPhase('start');
    }
  };

  const handleRescore = async () => {
    if (!result || isRescoring) return;
    setIsRescoring(true);
    try {
      const scores = await scoreQuickVersions(result.formState, result.versions, result.goalKey, currentUser);
      if (!isMounted.current) return;
      setResult({
        ...result,
        scores,
        scoringError: undefined,
        formState: withQuickResult(result.formState, result.versions, scores),
      });
    } catch (scoreError) {
      if (!isMounted.current) return;
      setResult({ ...result, scoringError: messageOf(scoreError) });
    } finally {
      if (isMounted.current) setIsRescoring(false);
    }
  };

  const handleNew = () => {
    setResult(null);
    setRunSeconds(null);
    setError(null);
    setCopy('');
    setPhase('start');
    window.scrollTo(0, 0);
  };

  const activeStage = STAGE_ORDER.indexOf(progress.stage);
  const total = progress.total ?? QUICK_DEFAULT_VARIANTS;
  const stageLabels: Record<QuickStage, string> = {
    checking: 'Checking your account',
    writing:
      progress.stage === 'writing'
        ? `Writing ${total} versions (${progress.done ?? 0} of ${total} done)`
        : `Writing ${total} versions`,
    scoring: 'Scoring them and picking the best',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      <QuickTopBar onNew={handleNew} onLogout={onLogout} isBusy={phase === 'running'} />

      {phase === 'start' && (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 flex flex-col gap-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-gray-900 dark:text-white">What do you want to improve?</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Paste your copy and say what it is for. You get back the best version, with a score and the reason.
            </p>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-4">
              <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-critical" aria-hidden="true" />
              <p className="text-gray-900 dark:text-gray-100 break-words">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="quick-copy" className="font-semibold text-gray-900 dark:text-gray-100">
              Your copy
            </label>
            <textarea
              id="quick-copy"
              rows={10}
              value={copy}
              onChange={event => setCopy(event.target.value)}
              placeholder="Paste the text you want to improve"
              className="w-full px-3.5 py-3 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className={tooLong ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
              {words} {words === 1 ? 'word' : 'words'}.
              {tooLong && ` Quick handles up to ${QUICK_MAX_WORDS} words for now.`}
              {!tooLong && words > 0 && tooShort && ` Paste at least ${QUICK_MIN_WORDS}.`}
            </p>
          </div>

          <fieldset className="m-0 p-0 border-0">
            <legend className="p-0 mb-2.5 font-semibold text-gray-900 dark:text-gray-100">What is this copy for?</legend>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(goal => {
                const selected = goal.key === goalKey;
                return (
                  <button
                    key={goal.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setGoalKey(goal.key)}
                    className={
                      'flex-[1_1_180px] min-h-[60px] px-3.5 py-2.5 flex flex-col items-start gap-0.5 text-left border ' +
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ' +
                      (selected
                        ? 'bg-gray-900 border-gray-900 dark:bg-gray-100 dark:border-gray-100'
                        : 'bg-white border-gray-400 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:hover:bg-gray-800')
                    }
                  >
                    <span className={selected ? 'font-semibold text-white dark:text-gray-900' : 'font-semibold text-gray-900 dark:text-gray-100'}>
                      {goal.name}
                    </span>
                    <span className={selected ? 'text-xs text-gray-300 dark:text-gray-700' : 'text-xs text-gray-600 dark:text-gray-400'}>
                      {goal.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              onClick={handleRun}
              disabled={tooShort || tooLong}
              className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Get the best version
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Writes {QUICK_DEFAULT_VARIANTS} versions and scores them. Uses credits.
            </span>
          </div>
        </main>
      )}

      {phase === 'running' && (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-gray-900 dark:text-white">Working on it</h1>
            <p className="text-gray-600 dark:text-gray-400">This can take a few minutes. Keep this tab open.</p>
          </div>
          <div role="status" aria-live="polite">
          <ol className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {STAGE_ORDER.map((stage, index) => {
              const state = index < activeStage ? 'done' : index === activeStage ? 'active' : 'waiting';
              return (
                <li key={stage} className="flex items-center gap-3 px-5 min-h-[52px]">
                  <span
                    aria-hidden="true"
                    className={
                      'w-1 h-5 shrink-0 ' +
                      (state === 'done' ? 'bg-status-good' : state === 'active' ? 'bg-primary-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600')
                    }
                  />
                  <span className={state === 'waiting' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100 font-medium'}>
                    {stageLabels[stage]}
                    {state === 'done' && <span className="sr-only"> (done)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          </div>
          <p className="text-gray-600 dark:text-gray-400 tabular-nums">Elapsed: {formatElapsed(elapsed)}</p>
        </main>
      )}

      {phase === 'result' && result && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          <QuickResult
            result={result}
            isRescoring={isRescoring}
            onRescore={handleRescore}
            onNew={handleNew}
            elapsedLabel={runSeconds != null ? formatElapsed(runSeconds) : undefined}
          />
        </main>
      )}
    </div>
  );
};

export default QuickPage;
