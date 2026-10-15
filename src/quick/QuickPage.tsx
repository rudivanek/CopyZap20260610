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
  QUICK_GOAL_OTHER_MAX_CHARS,
  QUICK_GOAL_OTHER_MIN_CHARS,
  cleanQuickGoalLabel,
  quickGoalName,
  quickMaxWords,
} from '../engine/buildQuickFormState';
import { fetchQuickPage, normalizeQuickUrl } from '../engine/fetchQuickPage';
import { inferQuickBrief, QuickBrief } from '../engine/inferQuickBrief';
import { asksForMissingFacts, findMissingFacts, MissingFactQuestion, missingInPlainWords } from '../engine/missingFacts';
import { FactAnswers, factsFromAnswers, OTHER_FACT_KEY } from './factAnswers';
import { chatFacts, CLOSING_QUESTION, EMPTY_FACT_CHAT, FactChat } from '../engine/factChat';
import { readChatChoice, saveChatChoice } from './QuickFactChat';
import { FACT_FIELDS_OFF } from './QuickMissingFacts';
import { getTextKind } from '../services/api/textKinds';
import { loadQuickResult, saveQuickResult, updateQuickResult } from '../engine/quickHistory';
import { changeQuickVersion, QuickChangeOutcome, QuickChangeParts, validateQuickChange } from '../engine/changeQuickVersion';
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
import QuickFactsWait, { FactsWaitKind } from './QuickFactsWait';
import QuickConfirm from './QuickConfirm';
import QuickHistory from './QuickHistory';
import QuickResult from './QuickResult';
import SquareRadio from './SquareRadio';
import QuickTips from './QuickTips';
import { GOAL_TIPS, TIPS } from './tips';
import { APP_VERSION } from '../lib/version';
import { useSessionCredits } from '../engine/quickCredits';

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

// The five fixed goals, then "Other": the user says in a few words what the copy is for.
const GOALS = GOAL_OPTIONS.map(option => {
  if (option.key === 'custom') return { key: option.key, name: 'Other', description: 'Say it in your own words' };
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

/** Longest the check screen stays locked while the questions are asked again. */
const FACTS_UPDATE_MAX_MS = 15000;

const QuickPage: React.FC<QuickPageProps> = ({ currentUser, onLogout }) => {
  const [phase, setPhase] = useState<Phase>('start');
  const [copy, setCopy] = useState('');
  const [goalKey, setGoalKey] = useState<GoalKey>(DEFAULT_GOAL_KEY);
  // For the goal "Other": what the copy is for, in the user's own words.
  const [goalOther, setGoalOther] = useState('');
  const goalMissing = goalKey === 'custom' && cleanQuickGoalLabel(goalOther).length < QUICK_GOAL_OTHER_MIN_CHARS;
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
  // Credits used by the result on screen: the run and every change or score after it.
  const resultCredits = useSessionCredits(phase === 'result' ? result?.formState.sessionId : null, creditsTick);
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
  // "Make it stronger": what the copy is missing (see engine/missingFacts.ts),
  // for the copy and goal it was looked up for, and what the user answered.
  // questions is null while Quick is still looking.
  const [facts, setFacts] = useState<{ key: string; questions: MissingFactQuestion[] | null } | null>(null);
  const [factAnswers, setFactAnswers] = useState<FactAnswers>({});
  // The same questions as a chat (see engine/factChat.ts), when the user chose it.
  // Since 2026-10-13 always the chat: the answer fields are switched off (FACT_FIELDS_OFF in QuickMissingFacts.tsx).
  const [chatChoice, setChatOn] = useState<boolean>(readChatChoice);
  const chatOn = FACT_FIELDS_OFF || chatChoice;
  const [factChat, setFactChat] = useState<FactChat>(EMPTY_FACT_CHAT);
  // True while the questions are asked again after a change (kind of text, goal
  // or copy): the check screen is locked until they are there (see QuickConfirm).
  const [factsUpdating, setFactsUpdating] = useState(false);
  // The facts key (see factsKey below) for which the user skipped the questions while they loaded.
  const [factsSkipped, setFactsSkipped] = useState<string | null>(null);
  // True while the copy, goal and corrections above are the ones the result on
  // screen was run with: right after a run from this page. False for a result
  // opened from History or from its address.
  const inputsFromRun = useRef(false);
  /**
   * "Run again with your answers" (see runAgainOffer below): the inputs of the
   * last run, as one key, and the best score of the run the user came back
   * from. A new run with the same key (same copy, goal, choices and reading;
   * only the facts may differ) shows "Last run: best 76 → this run: best 83".
   */
  const lastRunKey = useRef<string | null>(null);
  const [lastBest, setLastBest] = useState<{ best: number; key: string } | null>(null);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
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

  // The questions belong to one copy, one goal and one kind of text: a change to any of them asks again.
  const factsKey = `${goalKey}\n${goalKey === 'custom' ? cleanQuickGoalLabel(goalOther) : ''}\n${brief?.kind ?? ''}\n${copy}`;
  // "Skip the questions" in the wait modal: no "Make it stronger" for this copy, goal and kind.
  const factQuestions = !asksForMissingFacts(goalKey) || factsSkipped === factsKey
    ? undefined
    : facts?.key === factsKey
      ? facts.questions
      : null;
  // What a run is made of, apart from the facts: compared to tell whether two runs are like for like.
  const runKey = JSON.stringify({
    copy: copy.trim(),
    goalKey,
    goalOther: goalKey === 'custom' ? cleanQuickGoalLabel(goalOther) : '',
    choices: sections.length > 1 ? choices : null,
    brief,
  });

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

  // The process that is running, so that its working window can stop it.
  const processRef = useRef<AbortController | null>(null);
  /**
   * Starts a process the user can stop. Inside a process, `alive` stands in for
   * `isMounted`: it also turns false once the process is stopped, so whatever a
   * stopped process still returns never reaches the screen. `signal` tells the
   * engine not to start further steps.
   */
  const startProcess = () => {
    const controller = new AbortController();
    processRef.current = controller;
    return {
      signal: controller.signal,
      alive: {
        get current() {
          return isMounted.current && !controller.signal.aborted;
        },
      },
    };
  };
  /**
   * Stops the running process, after the user has confirmed. The screen goes
   * back at once, as it was before the process started. A step that is already
   * with the model still finishes (and is charged); nothing follows it.
   */
  const stopProcess = () => {
    processRef.current?.abort();
    processRef.current = null;
    // A result that was being opened from its address: forget the address too.
    if (busy === 'opening') setSearchParams({}, { replace: true });
    setBusy(null);
  };

  /** Opens a saved result exactly as it was: versions, scores and findings. */
  const openSaved = async (id: string) => {
    if (busy) return;
    setError(null);
    setBusy('opening');
    const { alive: isMounted } = startProcess();
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
      inputsFromRun.current = false;
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
    const { alive: isMounted } = startProcess();
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

  /**
   * Looks for what the copy is missing once the check screen is open and the
   * kind of text is known (the questions depend on it; see engine/missingFacts.ts).
   * Not awaited here: while they load, the screen is locked (QuickFactsWait). The same copy, goal and kind as last time keep their
   * questions and answers. When the user changes the kind, Quick asks again and
   * keeps only what was written under "anything else".
   */
  const factsKind = brief?.kind;
  const factsKnown = facts?.key;
  useEffect(() => {
    if (phase !== 'confirm' || !factsKind || !asksForMissingFacts(goalKey) || factsKnown === factsKey) return;
    const key = factsKey;
    // Asked again after a change: lock the screen until the new questions are there.
    // The first time on the check screen nothing is locked: there is nothing yet to type into.
    setFactsUpdating(factsKnown !== undefined);
    setFacts({ key, questions: null });
    setFactAnswers((previous): FactAnswers => (previous[OTHER_FACT_KEY] ? { [OTHER_FACT_KEY]: previous[OTHER_FACT_KEY] } : {}));
    setFactChat(EMPTY_FACT_CHAT);
    findMissingFacts(
      copy,
      goalKey,
      goalKey === 'custom' ? cleanQuickGoalLabel(goalOther) : undefined,
      factsKind,
      currentUser,
      sessionId ?? undefined,
      brief?.language
    ).then(questions => {
      if (!isMounted.current) return;
      setFacts(current => (current?.key === key ? { key, questions } : current));
    });
  }, [phase, factsKind, factsKnown, factsKey, goalKey, goalOther, copy, currentUser, sessionId]);

  // Unlocked when the new questions are there, when the user leaves the check
  // screen, and after FACTS_UPDATE_MAX_MS at the latest: a slow call never keeps the screen locked.
  const factsArrived = facts?.questions != null;
  useEffect(() => {
    if (!factsUpdating) return;
    if (factsArrived || phase !== 'confirm') {
      setFactsUpdating(false);
      return;
    }
    const timer = window.setTimeout(() => setFactsUpdating(false), FACTS_UPDATE_MAX_MS);
    return () => window.clearTimeout(timer);
  }, [factsUpdating, factsArrived, phase]);

  const handleContinue = async () => {
    if (tooShort || tooLong || goalMissing || busy) return;
    setError(null);

    // Same copy as last time: the earlier reading still applies.
    if (brief && briefCopy === copy) {
      setPhase('confirm');
      window.scrollTo(0, 0);
      return;
    }

    setBusy('reading');
    const { alive: isMounted } = startProcess();
    try {
      const id = await ensureSession(copy);
      const understood = await inferQuickBrief(copy, currentUser, id);
      if (!isMounted.current) return;
      // Copy fetched from a web address is a web page, whatever the reading step made of it.
      setBrief(fetchedFrom && fetchedUrl ? { ...understood, kind: 'web_page', kindOther: '' } : understood);
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
    if (tooShort || tooLong || goalMissing || busy || blocked) return;
    // With more than one part the user has decided about each, testimonials included.
    const usesParts = sections.length > 1;
    // Facts the user added under "Make it stronger", in the chat or in the fields. While the questions are
    // still loading only "anything else" counts.
    const userFacts =
      factQuestions === undefined ? [] : chatOn ? chatFacts(factChat) : factsFromAnswers(factQuestions ?? [], factAnswers);
    setError(null);
    setProgress({ stage: 'checking' });
    setBusy('running');
    const keyAtRun = runKey;
    const { alive: isMounted, signal } = startProcess();
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
          goalLabel: goalKey === 'custom' ? goalOther : undefined,
          sessionId: sessionId ?? undefined,
          signal,
          userFacts,
          brief: brief
            ? {
                product: brief.product,
                audience: brief.audience,
                tone: brief.tone,
                language: brief.language,
                kind: brief.kind,
                kindOther: brief.kindOther,
              }
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
      inputsFromRun.current = true;
      lastRunKey.current = keyAtRun;
      // Came back with "Run again with your answers" and changed nothing but the facts: show both bests.
      setPreviousBest(lastBest && lastBest.key === keyAtRun ? lastBest.best : null);
      setLastBest(null);
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
    const { alive: isMounted, signal } = startProcess();
    try {
      const scores = await scoreQuickVersions(result.formState, result.versions, result.goalKey, currentUser, undefined, undefined, signal);
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
  const handleChange = async (instruction: string, parts?: QuickChangeParts) => {
    if (!result || busy) return;
    setChangeNotice(null);
    setProgress({ stage: 'checking' });
    setBusy('changing');
    const { alive: isMounted, signal } = startProcess();
    try {
      const outcome = await changeQuickVersion(result, instruction, currentUser, setProgress, signal, parts);
      if (!isMounted.current) return;
      setResult(outcome.result);
      const notice = outcomeNotice('Your change', outcome);
      // Shorter or Longer: say how close it came to the number asked for.
      if (outcome.length) {
        notice.text += ` It has ${asNumber(outcome.length.words)} words; you asked for about ${asNumber(outcome.length.target)}.`;
      }
      setChangeNotice(notice);
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
    const { alive: isMounted, signal } = startProcess();
    try {
      const outcome = await scoreQuickEdit(result, draft, text, currentUser, setProgress, signal);
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
    inputsFromRun.current = false;
    setLastBest(null);
    setPreviousBest(null);
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
    setFacts(null);
    setFactAnswers({});
    setFactChat(EMPTY_FACT_CHAT);
    setCopy('');
    setPhase('start');
    window.scrollTo(0, 0);
  };

  /**
   * "Start over" on a result: back to the start form with the same copy and
   * goal, to change something and run again. The reading and the corrections
   * of the check screen come along, so Continue costs nothing. The result stays
   * in History; a new run is saved as a new entry.
   */
  const handleStartOver = () => {
    if (!result || busy) return;
    setLastBest(null);
    setPreviousBest(null);
    // A result opened from History: take its copy and settings from the result.
    // Parts that were left out are not in it; a result saved before kinds of
    // text existed is read again on Continue.
    if (!inputsFromRun.current) {
      const form = result.formState;
      const runCopy = (form.originalCopy || '').trim();
      setCopy(runCopy);
      setGoalKey(result.goalKey);
      setGoalOther(result.goalKey === 'custom' ? form.quickGoalLabel ?? '' : '');
      setUrl(result.source?.url ?? '');
      setFetchedFrom(result.source?.host ?? null);
      setFetchedUrl(result.source?.url ?? null);
      setFurnitureRemoved(0);
      const kind = getTextKind(form.quickTextKind);
      if (kind) {
        setBrief({
          product: form.productServiceName ?? '',
          audience: form.targetAudience ?? '',
          tone: form.tone,
          language: form.language,
          kind: kind.key,
          kindOther: form.quickTextKindOther ?? '',
        });
        setBriefCopy(runCopy);
      } else {
        setBrief(null);
        setBriefCopy(null);
      }
      setPickedChoices({});
      // Asked again on Continue: a result from History keeps its facts, not the questions.
      setFacts(null);
      setFactAnswers({});
      setFactChat(EMPTY_FACT_CHAT);
    }
    inputsFromRun.current = false;
    setChangeNotice(null);
    setResult(null);
    setRunSeconds(null);
    setSavedId(null);
    setSavedTitle(null);
    setSaveState(null);
    setSearchParams({}, { replace: true });
    setError(null);
    setSessionId(null);
    setPhase('start');
    window.scrollTo(0, 0);
  };

  /**
   * "Run again with your answers": from a result the user ran without facts,
   * straight back to the check screen with the same copy, goal, choices and
   * reading (no cost, as "Start over" then Continue), the "Make it stronger"
   * chat started again and in view. The best score of this result is kept, so
   * the next result can show both. Tested 2026-10-14 on Sales Boost: the same
   * facts fitted into the finished best version with "Change it" left it at 76;
   * three new versions written with them reached 82 to 83. So this is a new run.
   */
  const handleRunAgainWithAnswers = () => {
    if (!result || busy || !inputsFromRun.current || !lastRunKey.current) return;
    const best = result.scores?.winnerId ? result.scores.absoluteByVersion[result.scores.winnerId]?.total : undefined;
    setLastBest(typeof best === 'number' ? { best, key: lastRunKey.current } : null);
    setPreviousBest(null);
    setFactChat(EMPTY_FACT_CHAT);
    setChangeNotice(null);
    setResult(null);
    setRunSeconds(null);
    setSavedId(null);
    setSavedTitle(null);
    setSaveState(null);
    setSearchParams({}, { replace: true });
    setError(null);
    setSessionId(null);
    setPhase('confirm');
    window.setTimeout(() => document.getElementById('quick-facts-title')?.scrollIntoView({ block: 'start' }), 250);
  };

  /**
   * The offer under the score: shown for a run made here (not opened from
   * History) that used no facts, when "Make it stronger" found questions for
   * this copy. It names what is missing in plain words, from the kinds of the
   * questions found; it promises no score.
   */
  const usedFacts = (result?.formState.quickUserFacts ?? []).length > 0;
  const runAgainOffer =
    phase === 'result' && result && inputsFromRun.current && !usedFacts && factQuestions && factQuestions.length > 0
      ? { missing: missingInPlainWords(factQuestions), onClick: handleRunAgainWithAnswers }
      : null;

  /**
   * "Make it stronger" waits on the check screen (see QuickFactsWait): the
   * questions loading, the chat reading an answer, and the check of the user's
   * page under a question. While one runs the screen is locked.
   */
  const lastFactTurn = factChat.turns[factChat.turns.length - 1];
  const factsWait: FactsWaitKind | null =
    phase !== 'confirm' || busy !== null || factQuestions === undefined
      ? null
      : factQuestions === null
        ? factsKind
          ? 'questions'
          : null
        : !chatOn || factChat.done
          ? null
          : factChat.waiting
            ? 'answer'
            : lastFactTurn?.from === 'copyzap' && lastFactTurn.text !== CLOSING_QUESTION && lastFactTurn.fromPage === undefined
              ? 'page'
              : null;

  const cancelFactsWait = (kind: FactsWaitKind) => {
    if (kind === 'questions') {
      setFactsSkipped(factsKey);
      setFactsUpdating(false);
      return;
    }
    if (kind === 'answer') {
      // A new turns array: the late reply for the old one is ignored (see QuickFactChat).
      setFactChat(current => ({ ...current, turns: [...current.turns], waiting: false, done: true }));
      return;
    }
    // No passage from the page for the question on screen.
    setFactChat(current => ({
      ...current,
      turns: current.turns.map((turn, index) =>
        index === current.turns.length - 1 && turn.from === 'copyzap' && turn.fromPage === undefined
          ? { ...turn, fromPage: '' }
          : turn
      ),
    }));
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
      {/* The tips of choices and buttons, shown on hover and keyboard focus. */}
      <QuickTips />
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
        openResultId={phase === 'result' && !helpOpen && saveState === 'saved' ? savedId : null}
        onHelp={toggleHelp}
        userId={currentUser.id}
        userEmail={currentUser.email || ''}
        userMetaName={
          (currentUser as { user_metadata?: { name?: string; full_name?: string } }).user_metadata?.name ||
          (currentUser as { user_metadata?: { name?: string; full_name?: string } }).user_metadata?.full_name
        }
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
                data-tip={TIPS.fetchPage}
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
            <legend className="p-0 mb-1 font-semibold text-gray-900 dark:text-gray-100">What is this copy for?</legend>
            <div className="grid grid-cols-1 sm:grid-flow-col sm:grid-rows-3 sm:auto-cols-fr gap-x-8">
              {GOALS.map(goal => (
                <SquareRadio
                  key={goal.key}
                  name="quick-goal"
                  checked={goal.key === goalKey}
                  onChange={() => setGoalKey(goal.key)}
                  tip={GOAL_TIPS[goal.key]}
                >
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="min-w-[5rem] font-semibold text-gray-900 dark:text-gray-100">{goal.name}</span>
                    <span className="text-gray-600 dark:text-gray-400">{goal.description}</span>
                  </span>
                </SquareRadio>
              ))}
            </div>
            {goalKey === 'custom' && (
              <div className="mt-1 flex flex-col gap-1">
                <label htmlFor="quick-goal-other" className="text-gray-900 dark:text-gray-100">
                  Your goal, in a few words
                </label>
                <input
                  id="quick-goal-other"
                  type="text"
                  value={goalOther}
                  onChange={event => setGoalOther(event.target.value)}
                  maxLength={QUICK_GOAL_OTHER_MAX_CHARS}
                  placeholder="For example: get sign-ups for the October webinar"
                  aria-describedby="quick-goal-other-note"
                  className="w-full sm:max-w-xl min-h-[44px] px-3.5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p id="quick-goal-other-note" className="text-gray-600 dark:text-gray-400">
                  The versions are scored by how well they do this.
                  {goalMissing && ' Type a few words to continue.'}
                </p>
              </div>
            )}
          </fieldset>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={tooShort || tooLong || goalMissing || isFetching}
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
          goalName={quickGoalName(goalKey, goalOther)}
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
          factQuestions={factQuestions}
          factsUpdating={factsUpdating}
          factAnswers={factAnswers}
          onFactAnswersChange={setFactAnswers}
          factChat={{
            on: chatOn,
            onToggle: on => {
              setChatOn(on);
              saveChatChoice(on);
            },
            state: factChat,
            setState: setFactChat,
            context: {
              copy,
              goalKey,
              goalLabel: goalKey === 'custom' ? cleanQuickGoalLabel(goalOther) : undefined,
              kind: brief?.kind,
              language: brief?.language,
              user: currentUser,
              sessionId: sessionId ?? undefined,
            },
          }}
          lastBest={lastBest && lastBest.key === runKey ? lastBest.best : null}
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
            onNew={handleStartOver}
            elapsedLabel={runSeconds != null ? formatElapsed(runSeconds) : undefined}
            creditsUsed={resultCredits}
            title={savedTitle ?? undefined}
            resultId={savedId}
            saveState={saveState}
            onRetrySave={() => persist(result, runSeconds, savedId)}
            onChange={handleChange}
            changeBlocked={text => validateQuickChange(result, text)}
            changeNotice={changeNotice}
            onScoreEdit={handleScoreEdit}
            runAgain={runAgainOffer}
            previousBest={previousBest}
          />
        </main>
      )}

      {phase === 'history' && (
        <QuickHistory currentUser={currentUser} onOpen={openSaved} onNew={handleNew} onDeleted={handleDeleted} />
      )}
      </div>

      {/* The version of the app, from src/lib/version.ts. Shown under every Quick screen. */}
      {/* On a result, the "Jump to" bar is fixed to the bottom of the window: leave room below the version so the bar does not cover it. */}
      <footer
        id="quick-version"
        className={(phase === 'result' && !helpOpen ? 'pb-20' : 'pb-8') + ' text-center text-xs text-gray-600 dark:text-gray-400'}
      >
        CopyZap {APP_VERSION}
      </footer>

      <QuickFactsWait kind={factsWait} onCancel={cancelFactsWait} />

      {busy && (
        <QuickBusyModal kind={busy} elapsed={elapsed} progress={progress} versions={QUICK_DEFAULT_VARIANTS} onStop={stopProcess} />
      )}
    </div>
  );
};

export default QuickPage;
