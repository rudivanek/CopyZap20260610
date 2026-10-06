import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoalKey, User } from '../types';
import { DEFAULT_GOAL_KEY, GOAL_OPTIONS } from '../utils/scoringContextStorage';
import { countWords } from '../utils/markdownUtils';
import { playSuccessSound } from '../utils/soundEffects';
import { QUICK_DEFAULT_VARIANTS, QUICK_MAX_WORDS, QUICK_MIN_WORDS } from '../engine/buildQuickFormState';
import { fetchQuickPage, normalizeQuickUrl } from '../engine/fetchQuickPage';
import { inferQuickBrief, QuickBrief } from '../engine/inferQuickBrief';
import { loadQuickResult, saveQuickResult, updateQuickResult } from '../engine/quickHistory';
import { defaultChoices, planSections, SectionChoice, splitIntoSections } from '../engine/pageSections';
import { lockTestimonials } from '../engine/quoteLock';
import {
  QuickPipelineError,
  QuickProgress,
  QuickRunResult,
  runQuickPipeline,
  scoreQuickVersions,
  startQuickSession,
  withQuickResult,
} from '../engine/runQuickPipeline';
import QuickTopBar from './QuickTopBar';
import QuickBusyModal, { QuickBusyKind } from './QuickBusyModal';
import QuickConfirm from './QuickConfirm';
import QuickHistory from './QuickHistory';
import QuickResult from './QuickResult';

interface QuickPageProps {
  currentUser: User;
  onLogout: () => void;
}

type Phase = 'start' | 'confirm' | 'result' | 'history';

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
  // The process currently running, if any. While one runs, a modal covers the screen.
  const [busy, setBusy] = useState<QuickBusyKind | null>(null);
  const isFetching = busy === 'fetch';
  const isRescoring = busy === 'rescoring';
  const [runSeconds, setRunSeconds] = useState<number | null>(null);
  // Saving: every result becomes a History entry without the user doing anything.
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed' | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const openAtStart = useRef(searchParams.get('r'));
  const [url, setUrl] = useState('');
  const [fetchedFrom, setFetchedFrom] = useState<string | null>(null);
  const [furnitureRemoved, setFurnitureRemoved] = useState(0);
  // One tracking session per piece of work, started at the first paid step.
  const [sessionId, setSessionId] = useState<string | null>(null);
  // What Quick understood about the copy, and the exact copy it was read from.
  const [brief, setBrief] = useState<QuickBrief | null>(null);
  const [briefCopy, setBriefCopy] = useState<string | null>(null);
  // What the user chose for parts of the page; reset whenever the copy changes.
  const [pickedChoices, setPickedChoices] = useState<Record<string, SectionChoice>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Count seconds while any process is running.
  const isTiming = busy !== null;
  useEffect(() => {
    if (!isTiming) return;
    setElapsed(0);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isTiming]);

  // Ask before closing the tab while a process runs: it has already used credits.
  useEffect(() => {
    if (!isTiming) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isTiming]);

  const words = copy.trim() ? countWords(copy) : 0;
  // The parts of the page and what the user wants done with each. Worked out
  // for the confirm screen only; choices the user has not made follow Quick's proposal.
  const sections = useMemo(() => (phase === 'confirm' ? splitIntoSections(copy.trim()) : []), [phase, copy]);
  const choices = useMemo(() => ({ ...defaultChoices(sections), ...pickedChoices }), [sections, pickedChoices]);
  const plan = useMemo(() => planSections(sections, choices), [sections, choices]);
  // Testimonials the automatic lock will keep, inside the parts that are improved.
  const testimonialCount = useMemo(
    () => (phase === 'confirm' ? lockTestimonials(plan.lockedCopy).count : 0),
    [phase, plan]
  );
  const blocked =
    phase === 'confirm' && sections.length > 1 && plan.improveWords < QUICK_MIN_WORDS
      ? `Choose at least one part to improve (${QUICK_MIN_WORDS} words or more).`
      : null;
  const tooShort = words < QUICK_MIN_WORDS;
  const tooLong = words > QUICK_MAX_WORDS;

  /** Saves a result as a new History entry, or over its existing one, and keeps its id in the address. */
  const persist = async (run: QuickRunResult, seconds: number | null, id: string | null) => {
    setSaveState('saving');
    try {
      if (id) {
        await updateQuickResult(id, run, seconds);
      } else {
        const newId = await saveQuickResult(run, currentUser, seconds);
        if (!isMounted.current) return;
        setSavedId(newId);
        setSearchParams({ r: newId }, { replace: true });
      }
      if (isMounted.current) setSaveState('saved');
    } catch {
      if (isMounted.current) setSaveState('failed');
    }
  };

  /** Opens a saved result exactly as it was: versions, scores and findings. */
  const openSaved = async (id: string) => {
    if (busy) return;
    setError(null);
    setBusy('opening');
    try {
      const loaded = await loadQuickResult(id);
      if (!isMounted.current) return;
      if (!loaded) {
        setSearchParams({}, { replace: true });
        setError('That result could not be found. It may have been deleted.');
        setPhase('start');
        return;
      }
      setResult(loaded.result);
      setRunSeconds(loaded.runSeconds);
      setSavedId(loaded.id);
      setSavedTitle(loaded.title);
      setSaveState('saved');
      setSearchParams({ r: loaded.id }, { replace: true });
      setPhase('result');
      window.scrollTo(0, 0);
    } catch (openError) {
      if (!isMounted.current) return;
      setError(messageOf(openError));
      setPhase('start');
    } finally {
      if (isMounted.current) setBusy(null);
    }
  };

  // A page reload, or a link with ?r=<id>, shows that result again.
  useEffect(() => {
    if (openAtStart.current) openSaved(openAtStart.current);
    // Runs once on arrival; openSaved is recreated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Returns the tracking session, starting it (with an access check) on first use. */
  const ensureSession = async (label: string): Promise<string> => {
    if (sessionId) return sessionId;
    const id = await startQuickSession(currentUser, label);
    if (isMounted.current) setSessionId(id);
    return id;
  };

  const handleFetch = async () => {
    if (busy) return;
    setError(null);
    let target: string;
    try {
      target = normalizeQuickUrl(url);
    } catch (urlError) {
      setError(messageOf(urlError));
      return;
    }

    setBusy('fetch');
    try {
      const id = await ensureSession(new URL(target).hostname);
      const page = await fetchQuickPage(target, currentUser, id);
      if (!isMounted.current) return;
      setCopy(page.copy);
      setUrl(page.url);
      setFetchedFrom(page.host);
      setFurnitureRemoved(page.furnitureRemoved);
      playSuccessSound();
    } catch (fetchError) {
      if (isMounted.current) setError(messageOf(fetchError));
    } finally {
      if (isMounted.current) setBusy(null);
    }
  };

  const handleContinue = async () => {
    if (tooShort || tooLong || busy) return;
    setError(null);

    // Same copy as last time: the earlier reading still applies.
    if (brief && briefCopy === copy) {
      setPhase('confirm');
      window.scrollTo(0, 0);
      return;
    }

    setBusy('reading');
    try {
      const id = await ensureSession(copy);
      const understood = await inferQuickBrief(copy, currentUser, id);
      if (!isMounted.current) return;
      setBrief(understood);
      setBriefCopy(copy);
      setPickedChoices({});
      setPhase('confirm');
      window.scrollTo(0, 0);
    } catch (readError) {
      if (!isMounted.current) return;
      setError(messageOf(readError));
      setPhase('start');
    } finally {
      if (isMounted.current) setBusy(null);
    }
  };

  const handleRun = async () => {
    if (tooShort || tooLong || busy || blocked) return;
    const usesParts = sections.length > 1 && (plan.kept > 0 || plan.leftOut > 0);
    setError(null);
    setProgress({ stage: 'checking' });
    setBusy('running');
    const startedAt = Date.now();

    try {
      const run = await runQuickPipeline(
        {
          // With parts kept or left out, "the copy" is the page without the left-out parts.
          copy: usesParts ? plan.copy : copy,
          keep: usesParts ? { lockedCopy: plan.lockedCopy, zones: plan.zones, leftOut: plan.leftOut } : undefined,
          goalKey,
          sessionId: sessionId ?? undefined,
          brief: brief
            ? { product: brief.product, audience: brief.audience, tone: brief.tone, language: brief.language }
            : undefined,
        },
        currentUser,
        update => {
          if (isMounted.current) setProgress(update);
        }
      );
      if (!isMounted.current) return;
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      setRunSeconds(seconds);
      setResult(run);
      setSavedId(null);
      setSavedTitle(null);
      setPhase('result');
      window.scrollTo(0, 0);
      playSuccessSound();
      persist(run, seconds, null);
    } catch (runError) {
      if (!isMounted.current) return;
      setError(messageOf(runError));
      setPhase('start');
      window.scrollTo(0, 0);
    } finally {
      if (isMounted.current) setBusy(null);
    }
  };

  const handleRescore = async () => {
    if (!result || busy) return;
    setBusy('rescoring');
    try {
      const scores = await scoreQuickVersions(result.formState, result.versions, result.goalKey, currentUser);
      if (!isMounted.current) return;
      const rescored: QuickRunResult = {
        ...result,
        scores,
        scoringError: undefined,
        formState: withQuickResult(result.formState, result.versions, scores),
      };
      setResult(rescored);
      playSuccessSound();
      persist(rescored, runSeconds, savedId);
    } catch (scoreError) {
      if (!isMounted.current) return;
      setResult({ ...result, scoringError: messageOf(scoreError) });
    } finally {
      if (isMounted.current) setBusy(null);
    }
  };

  const handleNew = () => {
    setResult(null);
    setRunSeconds(null);
    setSavedId(null);
    setSavedTitle(null);
    setSaveState(null);
    setSearchParams({}, { replace: true });
    setError(null);
    setUrl('');
    setFetchedFrom(null);
    setFurnitureRemoved(0);
    setSessionId(null);
    setBrief(null);
    setBriefCopy(null);
    setPickedChoices({});
    setCopy('');
    setPhase('start');
    window.scrollTo(0, 0);
  };

  const handleHistory = () => {
    if (busy) return;
    setError(null);
    setSearchParams({}, { replace: true });
    setPhase('history');
    window.scrollTo(0, 0);
  };

  /** A History entry was deleted: if it is the result that is open, it is no longer saved. */
  const handleDeleted = (id: string) => {
    if (id !== savedId) return;
    setSavedId(null);
    setSavedTitle(null);
    setSaveState(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      <QuickTopBar
        onNew={handleNew}
        onHistory={handleHistory}
        onLogout={onLogout}
        view={phase === 'history' ? 'history' : 'new'}
        isBusy={busy !== null}
      />

      {phase === 'start' && (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 flex flex-col gap-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-gray-900 dark:text-white">What do you want to improve?</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Paste your copy or take it from a page, and say what it is for. You get back the best version, with a
              score and the reason.
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
              disabled={isFetching}
              placeholder="Paste the text you want to improve"
              className="w-full px-3.5 py-3 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className={tooLong ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
              {words} {words === 1 ? 'word' : 'words'}.
              {tooLong && ` Quick handles up to ${QUICK_MAX_WORDS} words for now.`}
              {!tooLong && words > 0 && tooShort && ` Paste at least ${QUICK_MIN_WORDS}.`}
              {fetchedFrom && !isFetching && ` Taken from ${fetchedFrom}.`}
              {fetchedFrom && !isFetching && furnitureRemoved > 0 &&
                ` ${furnitureRemoved} ${furnitureRemoved === 1 ? 'line' : 'lines'} of page furniture left out (cookie notice, repeated labels, counters).`}
              {fetchedFrom && !isFetching && ' Check it and trim it if needed.'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="quick-url" className="font-semibold text-gray-900 dark:text-gray-100">
              Or take the copy from a page
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="quick-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                value={url}
                onChange={event => setUrl(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') handleFetch();
                }}
                disabled={isFetching}
                placeholder="https://"
                className="flex-[1_1_260px] min-w-0 min-h-[44px] px-3.5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleFetch}
                disabled={isFetching || !url.trim()}
                className="inline-flex items-center justify-center min-h-[44px] px-5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Fetch page
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching a page uses credits. It replaces the text in the box above.
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
              onClick={handleContinue}
              disabled={tooShort || tooLong || isFetching}
              className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Continue
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Next you check what Quick understood, then it writes and scores the versions.
            </span>
          </div>
        </main>
      )}

      {phase === 'confirm' && brief && (
        <QuickConfirm
          copy={copy}
          words={words}
          goalName={GOALS.find(goal => goal.key === goalKey)?.name ?? goalKey}
          brief={brief}
          onBriefChange={setBrief}
          testimonialCount={testimonialCount}
          sections={sections}
          choices={choices}
          onChoiceChange={(id, choice) => setPickedChoices(picked => ({ ...picked, [id]: choice }))}
          improveWords={plan.improveWords}
          blocked={blocked}
          onGenerate={handleRun}
          onBack={() => {
            setPhase('start');
            window.scrollTo(0, 0);
          }}
        />
      )}

      {phase === 'result' && result && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          <QuickResult
            result={result}
            isRescoring={isRescoring}
            onRescore={handleRescore}
            onNew={handleNew}
            elapsedLabel={runSeconds != null ? formatElapsed(runSeconds) : undefined}
            title={savedTitle ?? undefined}
            saveState={saveState}
            onRetrySave={() => persist(result, runSeconds, savedId)}
          />
        </main>
      )}

      {phase === 'history' && (
        <QuickHistory currentUser={currentUser} onOpen={openSaved} onNew={handleNew} onDeleted={handleDeleted} />
      )}

      {busy && (
        <QuickBusyModal kind={busy} elapsed={elapsed} progress={progress} versions={QUICK_DEFAULT_VARIANTS} />
      )}
    </div>
  );
};

export default QuickPage;
