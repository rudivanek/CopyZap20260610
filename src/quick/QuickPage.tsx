import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompleteAccess } from '../hooks/useCompleteAccess';
import { GoalKey, User } from '../types';
import { DEFAULT_GOAL_KEY, GOAL_OPTIONS } from '../utils/scoringContextStorage';
import { countWords } from '../utils/markdownUtils';
import { playSuccessSound } from '../utils/soundEffects';
import {
  QUICK_DEFAULT_VARIANTS,
  QUICK_MAX_INPUT_WORDS,
  QUICK_MIN_WORDS,
  quickMaxWords,
} from '../engine/buildQuickFormState';
import { fetchQuickPage, normalizeQuickUrl } from '../engine/fetchQuickPage';
import { inferQuickBrief, QuickBrief } from '../engine/inferQuickBrief';
import { loadQuickResult, saveQuickResult, updateQuickResult } from '../engine/quickHistory';
import { changeQuickVersion, QuickChangeOutcome, validateQuickChange } from '../engine/changeQuickVersion';
import { QuickEditDraft, scoreQuickEdit } from '../engine/editQuickVersion';
import { defaultChoices, planSections, SectionChoice, splitIntoSections } from '../engine/pageSections';
import {
  QUICK_SCORE_MARGIN,
  QuickPipelineError,
  QuickProgress,
  QuickRunResult,
  runQuickPipeline,
  scoreQuickVersions,
  startQuickSession,
  withQuickResult,
} from '../engine/runQuickPipeline';
import QuickHelp from './QuickHelp';
import QuickIntro from './QuickIntro';
import { hasSeenIntro, markIntroSeen } from './introSeen';
import QuickTopBar from './QuickTopBar';
import QuickBusyModal, { QuickBusyKind } from './QuickBusyModal';
import QuickConfirm from './QuickConfirm';
import QuickHistory from './QuickHistory';
import QuickResult from './QuickResult';
import { APP_VERSION } from '../lib/version';

interface QuickPageProps {
  currentUser: User;
  onLogout: () => void;
}

type Phase = 'start' | 'confirm' | 'result' | 'history';

type Notice = { tone: 'good' | 'neutral' | 'bad'; text: string };

/**
 * What to tell the user after a change or an edit was scored. Scores within
 * QUICK_SCORE_MARGIN points of each other are reported as about the same,
 * because the scorer cannot tell them apart.
 */
function outcomeNotice(name: 'Your change' | 'Your edit', outcome: QuickChangeOutcome): Notice {
  const { newScore, previousBestScore: best, becameBest } = outcome;
  const where = becameBest ? 'It is shown first because its score is slightly higher.' : 'It is listed under Other versions.';
  if (newScore === null) {
    return { tone: 'neutral', text: `${name} was saved as a version but could not be scored. It is listed under Other versions.` };
  }
  if (best === null) {
    return { tone: becameBest ? 'good' : 'neutral', text: `${name} scored ${newScore} / 100. ${becameBest ? 'It is now the best version.' : where}` };
  }
  const difference = newScore - best;
  if (Math.abs(difference) <= QUICK_SCORE_MARGIN) {
    return {
      tone: 'neutral',
      text: `${name} scored ${newScore} / 100, about the same as the best version before it (${best}). Scores within ${QUICK_SCORE_MARGIN} points of each other cannot be told apart. ${where}`,
    };
  }
  if (difference > 0 && becameBest) {
    return { tone: 'good', text: `${name} is now the best version, at ${newScore} / 100, ${difference} points above the previous best.` };
  }
  if (difference > 0) {
    return { tone: 'neutral', text: `${name} scored ${newScore} / 100 but was set aside, because it repeats a paragraph or is cut short. It is listed under Other versions.` };
  }
  return { tone: 'neutral', text: `${name} scored ${newScore} / 100, ${-difference} points below the best version (${best}). It is listed under Other versions.` };
}

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

const asNumber = (value: number) => value.toLocaleString('en-US');

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
  // Counts finished processes, so the top bar reads the credits again after each.
  // It reads twice: at once, and a few seconds later, because the last bits of
  // usage can be recorded just after the process has finished.
  const [creditsTick, setCreditsTick] = useState(0);
  useEffect(() => {
    if (busy !== null) return;
    setCreditsTick(tick => tick + 1);
    const later = window.setTimeout(() => {
      if (isMounted.current) setCreditsTick(tick => tick + 1);
    }, 5000);
    return () => window.clearTimeout(later);
  }, [busy]);
  const isFetching = busy === 'fetch';
  const isRescoring = busy === 'rescoring';
  const [runSeconds, setRunSeconds] = useState<number | null>(null);
  // Saving: every result becomes a History entry without the user doing anything.
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed' | null>(null);
  // What the last "What should change?" request led to.
  const [changeNotice, setChangeNotice] = useState<{ tone: 'good' | 'neutral' | 'bad'; text: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  // Only power users and admins are offered the Complete interface.
  const completeAccess = useCompleteAccess();
  const openAtStart = useRef(searchParams.get('r'));
  // "How it works": open on a user's first visit (not when they arrive at a
  // saved result), and whenever they press Help.
  const [introOpen, setIntroOpen] = useState(() => !hasSeenIntro(currentUser.id) && !openAtStart.current);
  const closeIntro = () => {
    markIntroSeen(currentUser.id);
    setIntroOpen(false);
  };
  // The help page lies over whatever the user is doing. The view underneath is
  // hidden, not removed, so a result, an open editor or a half-typed request is
  // still there when the help is closed.
  const [helpOpen, setHelpOpen] = useState(false);
  const toggleHelp = () => {
    setHelpOpen(open => !open);
    window.scrollTo(0, 0);
  };
  const closeHelp = () => {
    setHelpOpen(false);
    window.scrollTo(0, 0);
  };
  const [url, setUrl] = useState('');
  const [fetchedFrom, setFetchedFrom] = useState<string | null>(null);
  // The address the copy in the box was fetched from; recorded with the result.
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
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
  const tooShort = words < QUICK_MIN_WORDS;
  // More words than Quick works on in one run. Such a page can still be brought
  // in when it has parts: the user leaves some out on the confirm screen.
  // The limit in force: QUICK_MAX_WORDS, unless this browser was given a higher one for a test.
  const maxWords = quickMaxWords();
  const overLimit = words > maxWords;
  const overInput = words > QUICK_MAX_INPUT_WORDS;
  // The parts of the page and what the user wants done with each. Worked out
  // for the confirm screen, and on the start screen for a page over the limit
  // (to know whether it has parts at all); choices the user has not made follow
  // Quick's proposal.
  const needsParts = phase === 'confirm' || (phase === 'start' && overLimit && !overInput);
  const sections = useMemo(() => (needsParts ? splitIntoSections(copy.trim()) : []), [needsParts, copy]);
  const choices = useMemo(() => ({ ...defaultChoices(sections), ...pickedChoices }), [sections, pickedChoices]);
  const plan = useMemo(() => planSections(sections, choices), [sections, choices]);
  // Every testimonial Quick finds is a row in the list of parts now, with its
  // own choice, so there is no separate "testimonials found" line any more.
  const testimonialCount = 0;
  // A page over the limit can go on only when it has parts to leave out, and
  // at least one of them is of a size Quick can work on.
  const canTrim =
    overLimit &&
    !overInput &&
    sections.length > 1 &&
    sections.some(section => section.words >= QUICK_MIN_WORDS && section.words <= maxWords);
  const tooLong = overInput || (overLimit && !canTrim);
  // The words of the run: everything that is not left out. This is the text
  // the engine is given, so it is what the limit applies to.
  const usedWords = sections.length > 1 ? (plan.copy.trim() ? countWords(plan.copy) : 0) : words;
  const blocked =
    phase !== 'confirm'
      ? null
      : usedWords > maxWords
        ? `${asNumber(usedWords)} words are in use. Leave out ${asNumber(usedWords - maxWords)} or more to generate.`
        : sections.length > 1 && plan.improveWords < QUICK_MIN_WORDS
          ? `Choose at least one part to improve (${QUICK_MIN_WORDS} words or more).`
          : null;

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
      setChangeNotice(null);
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
      setFetchedUrl(page.url);
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
    // With more than one part the user has decided about each, testimonials included.
    const usesParts = sections.length > 1;
    setError(null);
    setProgress({ stage: 'checking' });
    setBusy('running');
    const startedAt = Date.now();

    try {
      const run = await runQuickPipeline(
        {
          // With parts kept or left out, "the copy" is the page without the left-out parts.
          copy: usesParts ? plan.copy : copy,
          keep: usesParts
            ? {
                lockedCopy: plan.lockedCopy,
                zones: plan.zones,
                leftOut: plan.leftOut,
                kept: plan.kept,
                testimonialsKept: plan.testimonialsKept,
                autoLock: false,
              }
            : undefined,
          source: fetchedFrom && fetchedUrl ? { url: fetchedUrl, host: fetchedFrom } : undefined,
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

  /** Rewrites the best version as the user asked, scores it, and keeps whichever is better. */
  const handleChange = async (instruction: string) => {
    if (!result || busy) return;
    setChangeNotice(null);
    setProgress({ stage: 'checking' });
    setBusy('changing');
    try {
      const outcome = await changeQuickVersion(result, instruction, currentUser, setProgress);
      if (!isMounted.current) return;
      setResult(outcome.result);
      setChangeNotice(outcomeNotice('Your change', outcome));
      window.scrollTo(0, 0);
      playSuccessSound();
      persist(outcome.result, runSeconds, savedId);
    } catch (changeError) {
      if (!isMounted.current) return;
      setChangeNotice({ tone: 'bad', text: messageOf(changeError) });
    } finally {
      if (isMounted.current) setBusy(null);
    }
  };

  /** Scores a version the user edited by hand and keeps whichever version is better. */
  const handleScoreEdit = async (draft: QuickEditDraft, text: string) => {
    if (!result || busy) return;
    setChangeNotice(null);
    setProgress({ stage: 'checking' });
    setBusy('editing');
    try {
      const outcome = await scoreQuickEdit(result, draft, text, currentUser, setProgress);
      if (!isMounted.current) return;
      setResult(outcome.result);
      setChangeNotice(outcomeNotice('Your edit', outcome));
      window.scrollTo(0, 0);
      playSuccessSound();
      persist(outcome.result, runSeconds, savedId);
    } catch (editError) {
      if (!isMounted.current) return;
      setChangeNotice({ tone: 'bad', text: messageOf(editError) });
    } finally {
      if (isMounted.current) setBusy(null);
    }
  };

  const handleNew = () => {
    setChangeNotice(null);
    setResult(null);
    setRunSeconds(null);
    setSavedId(null);
    setSavedTitle(null);
    setSaveState(null);
    setSearchParams({}, { replace: true });
    setError(null);
    setUrl('');
    setFetchedFrom(null);
    setFetchedUrl(null);
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
        onNew={() => {
          setHelpOpen(false);
          handleNew();
        }}
        onHistory={() => {
          setHelpOpen(false);
          handleHistory();
        }}
        onLogout={onLogout}
        view={helpOpen ? 'help' : phase === 'history' ? 'history' : 'new'}
        isBusy={busy !== null}
        showComplete={completeAccess === true}
        onHelp={toggleHelp}
        userId={currentUser.id}
        creditsTick={creditsTick}
      />

      {helpOpen && (
        <QuickHelp
          onClose={closeHelp}
          backTo={phase === 'result' ? 'your result' : phase === 'history' ? 'History' : phase === 'confirm' ? 'your copy' : 'the start'}
        />
      )}

      {/* Everything below is hidden, not removed, while the help is open. */}
      <div className={helpOpen ? 'hidden' : ''}>
      {introOpen && <QuickIntro onClose={closeIntro} />}

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
              onChange={event => {
                setCopy(event.target.value);
                // An emptied box no longer holds the fetched page: forget where it came from.
                if (!event.target.value.trim()) {
                  setFetchedFrom(null);
                  setFetchedUrl(null);
                }
              }}
              disabled={isFetching}
              placeholder="Paste the text you want to improve"
              className="w-full px-3.5 py-3 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className={overLimit ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
              {asNumber(words)} {words === 1 ? 'word' : 'words'}.
              {overInput && ` CopyZap takes up to ${asNumber(QUICK_MAX_INPUT_WORDS)} words. Shorten the text.`}
              {canTrim &&
                ` CopyZap works on up to ${asNumber(maxWords)} words at a time. On the next screen you choose which parts to leave out.`}
              {overLimit && !overInput && !canTrim &&
                ` CopyZap works on up to ${asNumber(maxWords)} words at a time, and this text ${
                  sections.length > 1 ? 'has no part short enough to work on' : 'has no headings to split it at'
                }. Shorten it to ${asNumber(maxWords)} words.`}
              {!overLimit && words > 0 && tooShort && ` Paste at least ${QUICK_MIN_WORDS}.`}
              {fetchedFrom && !isFetching && ` Taken from ${fetchedFrom}.`}
              {fetchedFrom && !isFetching && furnitureRemoved > 0 &&
                ` ${furnitureRemoved} ${furnitureRemoved === 1 ? 'line' : 'lines'} of page furniture left out (link bars, cookie notice, repeated labels, counters).`}
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
              className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Continue
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Next you check what CopyZap understood, then it writes and scores the versions.
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
          usedWords={usedWords}
          maxWords={maxWords}
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
            onChange={handleChange}
            changeBlocked={text => validateQuickChange(result, text)}
            changeNotice={changeNotice}
            onScoreEdit={handleScoreEdit}
          />
        </main>
      )}

      {phase === 'history' && (
        <QuickHistory currentUser={currentUser} onOpen={openSaved} onNew={handleNew} onDeleted={handleDeleted} />
      )}
      </div>

      {/* The version of the app, from src/lib/version.ts. Shown under every Quick screen. */}
      <footer id="quick-version" className="pb-8 text-center text-xs text-gray-600 dark:text-gray-400">
        CopyZap {APP_VERSION}
      </footer>

      {busy && (
        <QuickBusyModal kind={busy} elapsed={elapsed} progress={progress} versions={QUICK_DEFAULT_VARIANTS} />
      )}
    </div>
  );
};

export default QuickPage;
