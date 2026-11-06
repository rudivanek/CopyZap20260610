import React, { useEffect, useRef, useState } from 'react';
import QuickBusyModal from './QuickBusyModal';
import BriefSectionsEditor from './BriefSectionsEditor';
import { GoalKey, Language, Tone, User } from '../types';
import { GOAL_OPTIONS } from '../utils/scoringContextStorage';
import {
  Brief,
  BriefNotAvailableError,
  BriefSection,
  BriefPieceKey,
  BRIEF_PIECES,
  BRIEF_MIN_WORDS,
  BRIEF_MAX_WORDS,
  briefPiece,
  briefSectionOption,
  briefShapeNote,
  defaultSectionsFor,
  generateFromBrief,
  splitMetaDescription,
  suggestedWordsFor,
  suggestSectionWords,
  trimSiteFacts,
} from '../engine/generateFromBrief';
import { getWizardFollowUps, getWizardPlan, WizardFieldKey, WizardFormality, WizardPlan, WizardQuestion, WIZARD_FIELDS } from '../engine/wizardQuestions';
import { fetchQuickPage } from '../engine/fetchQuickPage';
import { answerFixNote, applyAnswerNumbers } from '../engine/answerConflicts';
import { QUICK_LANGUAGES, QUICK_TONES } from '../engine/inferQuickBrief';
import type { QuickBriefRecord } from '../engine/runQuickPipeline';

interface WizardFormProps {
  currentUser: User;
  defaultLanguage: Language;
  disabled: boolean;
  onDraft: (draft: string, goalKey: GoalKey, record: Omit<QuickBriefRecord, 'editedBeforeScoring'>) => void;
  onUnavailable: () => void;
  onError: (message: string) => void;
  getSessionId: (label: string) => Promise<string>;
}

type Answers = Record<Exclude<WizardFieldKey, 'goal'>, string>;

/** The field look without a width, for fields that set their own width. */
const fieldBase =
  'min-h-[44px] px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
const fieldClass = `w-full ${fieldBase}`;
const labelClass = 'font-semibold text-gray-900 dark:text-gray-100';
const hintClass = 'text-sm text-gray-600 dark:text-gray-400';
const chipClass = (active: boolean) =>
  'min-h-[40px] px-4 border text-sm font-medium text-left focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
  (active
    ? 'bg-primary-500 border-primary-500 text-white'
    : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800');

const goalName = (key: GoalKey) => {
  const option = GOAL_OPTIONS.find(item => item.key === key);
  return key === 'custom' ? 'Other' : (option?.label.split(' — ')[0] ?? String(key));
};

/** Tapping a choice adds it to the answer; tapping it again takes it out. */
function toggleChoice(current: string, choice: string): string {
  const parts = current.split(/\s*;\s*/).map(part => part.trim()).filter(Boolean);
  const index = parts.findIndex(part => part.toLowerCase() === choice.toLowerCase());
  if (index >= 0) parts.splice(index, 1);
  else parts.push(choice);
  return parts.join('; ');
}

const WizardForm: React.FC<WizardFormProps> = ({ currentUser, defaultLanguage, disabled, onDraft, onUnavailable, onError, getSessionId }) => {
  const [request, setRequest] = useState('');
  const [website, setWebsite] = useState('');
  const [stage, setStage] = useState<'idle' | 'reading' | 'thinking' | 'checking' | 'writing'>('idle');
  const [plan, setPlan] = useState<WizardPlan | null>(null);
  const [siteFacts, setSiteFacts] = useState<string | undefined>(undefined);
  const [siteNotice, setSiteNotice] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const [piece, setPiece] = useState<BriefPieceKey>('other');
  const [topic, setTopic] = useState('');
  const [targetWords, setTargetWords] = useState<number | null>(null);
  // Pages and blog posts: the sections to write, as in the earlier brief form.
  // They start as the suggested ones for the kind of text and can be changed.
  const [sections, setSections] = useState<BriefSection[]>([]);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [goal, setGoal] = useState<GoalKey>('convert');
  const [tone, setTone] = useState<Tone>('Professional');
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [country, setCountry] = useState('');
  const [formality, setFormality] = useState<WizardFormality>('formal');
  const [answers, setAnswers] = useState<Answers>({ product: '', audience: '', result: '', alternatives: '', differentiators: '', proof: '', experience: '', callToAction: '' });
  /** Follow-ups for answers that were too general: null until the answers were checked. */
  /** The answers as read from the website, before the user changed anything. */
  const [prefilled, setPrefilled] = useState<Answers | null>(null);
  const [followUps, setFollowUps] = useState<WizardQuestion[] | null>(null);
  const [followAnswers, setFollowAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<WizardQuestion[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);

  const busy = stage !== 'idle' || disabled;

  // While CopyZap reads, thinks or writes, the same modal as "Improve my copy"
  // shows the steps, the time and Cancel. Cancel stops waiting: what comes back
  // after it is ignored (the call itself cannot be taken back).
  const runToken = useRef(0);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (stage === 'idle') return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [stage, startedAt]);
  const startRun = (): number => {
    runToken.current += 1;
    setStartedAt(Date.now());
    setElapsed(0);
    return runToken.current;
  };
  const stopRun = () => {
    runToken.current += 1;
    setStage('idle');
  };
  const hasWebsite = !!website.trim();
  const modal =
    stage === 'idle' ? null : stage === 'reading' || stage === 'thinking' ? (
      <QuickBusyModal
        kind="questions"
        elapsed={elapsed}
        versions={1}
        onStop={stopRun}
        steps={hasWebsite ? ['Reading your website', 'Choosing your questions'] : ['Choosing your questions']}
        activeStep={hasWebsite && stage === 'thinking' ? 1 : 0}
      />
    ) : (
      <QuickBusyModal
        kind="drafting"
        elapsed={elapsed}
        versions={1}
        onStop={stopRun}
        steps={['Checking your answers', 'Writing your draft']}
        activeStep={stage === 'checking' ? 0 : 1}
      />
    );
  const isPage = briefPiece(piece).group === 'page';
  // When every section has a word count, the length is their total.
  const sectionWordsSum = sections.length > 0 && sections.every(section => section.words)
    ? sections.reduce((sum, section) => sum + (section.words ?? 0), 0)
    : null;
  const pageWords = isPage ? sectionWordsSum ?? targetWords ?? suggestedWordsFor(piece) : null;
  const isBlog = piece === 'blog_post';
  const askedKeys = questions.map(question => question.key);
  const otherFields = WIZARD_FIELDS.filter(field => !askedKeys.includes(field.key));

  const setAnswer = (key: keyof Answers, value: string) => {
    setAnswers(current => ({ ...current, [key]: value }));
    setMissing(list => list.filter(item => item !== key));
  };

  const handleNext = async () => {
    if (busy) return;
    if (!request.trim()) {
      setMissing(['request']);
      return;
    }
    setMissing([]);
    setSiteNotice(null);
    setFollowUps(null);
    setFollowAnswers({});
    const token = startRun();
    setStage(website.trim() ? 'reading' : 'thinking');
    let id: string | undefined;
    try {
      id = await getSessionId(request.trim().slice(0, 60) || 'Brief');
    } catch {
      id = undefined;
    }
    if (token !== runToken.current) return;
    setSessionId(id);
    let facts: string | undefined;
    if (website.trim()) {
      setStage('reading');
      try {
        const page = await fetchQuickPage(website.trim(), currentUser, id);
        if (token !== runToken.current) return;
        facts = trimSiteFacts(page.copy);
      } catch {
        setSiteNotice("We couldn't read that website, so the questions are based on your request only.");
      }
    }
    if (token !== runToken.current) return;
    setSiteFacts(facts);
    setStage('thinking');
    try {
      const next = await getWizardPlan(request, facts ? trimSiteFacts(facts, 1500) : undefined, currentUser, defaultLanguage, id);
      if (token !== runToken.current) return;
      setPiece(next.piece);
      setSections(defaultSectionsFor(next.piece));
      // Open, so the sections are seen before "Write it" (2026-11-05: closed, they were missed).
      setSectionsOpen(true);
      setTopic(next.topic);
      setTargetWords(next.targetWords);
      setGoal(next.goal);
      setTone(next.tone);
      setLanguage(next.language);
      setCountry(next.country);
      setFormality(next.formality ?? 'formal');
      setAnswers({ ...next.known });
      setPrefilled({ ...next.known });
      // Nothing to ask (the request could not be read): ask for every answer, with the default labels.
      setQuestions(
        next.questions.length > 0
          ? next.questions
          : WIZARD_FIELDS.map(field => ({ key: field.key, question: field.label, choices: [] }))
      );
      setPlan(next);
    } catch (error) {
      if (token !== runToken.current) return;
      if (error instanceof BriefNotAvailableError) onUnavailable();
      else onError('Something went wrong. Please try again.');
    } finally {
      if (token === runToken.current) setStage('idle');
    }
  };

  const handleWrite = async () => {
    if (busy || !plan) return;
    const empty: string[] = (['product', 'audience'] as const).filter(key => !answers[key].trim());
    if (isBlog && !topic.trim()) empty.push('topic');
    if (empty.length > 0) {
      setMissing(empty);
      // A missing answer that was not asked sits under "Already understood": open it.
      if (empty.some(key => otherFields.some(field => field.key === key))) setOtherOpen(true);
      return;
    }
    const words = pageWords;
    if (isPage && (!words || words < BRIEF_MIN_WORDS || words > BRIEF_MAX_WORDS)) {
      onError(`Set a length between ${BRIEF_MIN_WORDS} and ${BRIEF_MAX_WORDS} words.`);
      return;
    }
    setMissing([]);
    // First click: check the answers for ones too general to make the copy
    // specific, and ask one follow-up for each (at most two). The user can
    // answer or leave them blank; the next click writes.
    const token = startRun();
    if (followUps === null) {
      setStage('checking');
      const found = await getWizardFollowUps(
        briefPiece(piece).label,
        WIZARD_FIELDS.map(field => ({ key: field.key, label: field.label, value: answers[field.key] })),
        currentUser,
        sessionId,
      );
      if (token !== runToken.current) return;
      setFollowUps(found);
      if (found.length > 0) {
        setStage('idle');
        return;
      }
    }
    // The follow-up answers are added to the answer they belong to.
    const a: Answers = { ...answers };
    (followUps ?? []).forEach(item => {
      const extra = (followAnswers[item.key] ?? '').trim();
      if (!extra || item.key === 'goal') return;
      const key = item.key as keyof Answers;
      a[key] = a[key].trim() ? `${a[key].trim()} — ${extra}` : extra;
    });
    // Answers that were read from the website, not asked, and left as they were:
    // the user may never have seen them, so the brief marks them as website facts.
    const websiteKeys: NonNullable<Brief['fromWebsite']> = (['proof', 'experience', 'differentiators', 'result', 'alternatives'] as const).filter(key =>
      !askedKeys.includes(key) && !!prefilled && !!prefilled[key].trim() && a[key].trim() === prefilled[key].trim()
    );
    setStage('writing');
    try {
      const chosen = isPage ? (sections.length > 0 ? sections : defaultSectionsFor(piece)) : [];
      const sectionWords = isPage ? suggestSectionWords(chosen, words) : [];
      const hasFormality = language !== 'English';
      const brief: Brief = {
        product: a.product.trim(),
        audience: a.audience.trim(),
        goal,
        piece,
        tone,
        differentiators: a.differentiators.trim() || undefined,
        callToAction: a.callToAction.trim() || undefined,
        siteFacts,
        proof: a.proof.trim() || undefined,
        experience: a.experience.trim() || undefined,
        result: a.result.trim() || undefined,
        alternatives: a.alternatives.trim() || undefined,
        fromWebsite: websiteKeys.length > 0 ? websiteKeys : undefined,
        length: briefPiece(piece).defaultLength,
        sections: isPage ? chosen.map((section, index) => ({ ...section, words: section.words ?? sectionWords[index] ?? null })) : undefined,
        targetWords: isPage
          ? words || undefined
          : ['email', 'other'].includes(briefPiece(piece).group)
            ? targetWords || undefined
            : undefined,
        topic: isBlog ? topic.trim() || undefined : undefined,
        language,
        country: country.trim() || undefined,
        formality: hasFormality ? formality : undefined,
        spanishForm: language === 'Spanish' ? (formality === 'formal' ? 'usted' : 'tú') : undefined,
      };
      const written = await generateFromBrief(brief, currentUser, sessionId);
      if (token !== runToken.current) return;
      const split = isBlog ? splitMetaDescription(written) : { draft: written, metaDescription: undefined };
      const metaDescription = split.metaDescription;
      // A number from the website never replaces the user's own answer (see answerConflicts.ts).
      // An answer that was filled in from the website and left as it was, under
      // "Already understood", counts as website text, not as the user's answer.
      const answerKeys = (['proof', 'experience', 'differentiators', 'result', 'alternatives'] as const);
      const ownAnswers = answerKeys.filter(key => a[key].trim() && !websiteKeys.includes(key)).map(key => a[key].trim());
      const websiteAnswers = answerKeys.filter(key => websiteKeys.includes(key)).map(key => a[key].trim());
      const checked = applyAnswerNumbers(split.draft, ownAnswers, [a.product, ...websiteAnswers, siteFacts ?? '']);
      const draft = checked.text;
      const answerNotes = checked.fixes.map(answerFixNote);
      const languageText = [
        language,
        country.trim() ? `(${country.trim()})` : '',
        hasFormality ? `· ${formality}` : '',
      ].filter(Boolean).join(' ');
      const fields = [
        { label: 'What you need', value: briefPiece(piece).label },
        { label: 'Your request', value: request.trim() },
        { label: 'Topic or title idea', value: isBlog ? topic.trim() : '' },
        { label: 'What you are selling', value: a.product.trim() },
        { label: 'Who it is for', value: a.audience.trim() },
        { label: 'What the customer gets', value: a.result.trim() },
        { label: 'Who they compare you with', value: a.alternatives.trim() },
        { label: 'Goal', value: goalName(goal) },
        { label: 'Tone', value: String(tone) },
        { label: 'What makes you different', value: a.differentiators.trim() },
        { label: 'Proof or results', value: a.proof.trim() },
        { label: 'Your experience', value: a.experience.trim() },
        { label: 'What the reader should do', value: a.callToAction.trim() },
        {
          label: 'Length',
          value: isPage && words
            ? `about ${words.toLocaleString('en-US')} words`
            : !isPage && targetWords && ['email', 'other'].includes(briefPiece(piece).group)
              ? `about ${targetWords.toLocaleString('en-US')} words`
              : '',
        },
        {
          label: 'Sections',
          value: isPage
            ? chosen
                .map((section, index) => {
                  const label = section.words ? `${section.label} (${section.words})` : sectionWords[index] ? `${section.label} (≈ ${sectionWords[index]})` : section.label;
                  // The brief check may not mark the draft down for leaving such a section out
                  // (2026-11-05: Selected work and Testimonials, rightly left out, cost 6 points).
                  return briefSectionOption(section.key).factsOnly ? `${label}, only if facts exist` : label;
                })
                .join(' · ')
            : '',
        },
        { label: 'Language', value: languageText },
        { label: 'Started from', value: 'Questions' },
      ].filter(field => field.value);
      // These answers must survive the improve step word for word in meaning.
      // Answers read from the website and left as they were are not locked: they are website facts.
      const own = (key: NonNullable<Brief['fromWebsite']>[number]) => (websiteKeys.includes(key) ? '' : a[key].trim());
      const lockedFacts = [
        own('experience') ? `The company's own experience or view: ${own('experience')}` : '',
        own('proof') ? `Proof: ${own('proof')}` : '',
        own('differentiators') ? `What makes the company different: ${own('differentiators')}` : '',
        own('result') ? `What the customer gets: ${own('result')}` : '',
        own('alternatives') ? `Why customers choose the company over others: ${own('alternatives')}` : '',
      ].filter(Boolean);
      const shapeNote = briefShapeNote(piece);
      // What the draft may state: the answers and the website text. The run checks the
      // draft against these, so a detail in neither is listed for the user to check.
      const sourceLabels = ['Your request', 'Topic or title idea', 'What you are selling', 'Who it is for', 'What the customer gets', 'Who they compare you with', 'What makes you different', 'Proof or results', 'Your experience', 'What the reader should do'];
      const claimSource = [
        ...fields.filter(field => sourceLabels.includes(field.label)).map(field => `${field.label}: ${field.value}`),
        siteFacts ?? '',
      ].filter(Boolean).join('\n\n');
      onDraft(draft, goal, {
        fields,
        claimSource,
        ...(answerNotes.length > 0 ? { answerNotes } : {}),
        ...(lockedFacts.length > 0 ? { lockedFacts } : {}),
        // The draft is the result, for every kind of text (see runQuickPipeline.ts draftOnly):
        // in blind tests (2026-11-04) rewrites of it were no better. "Write alternatives" asks for them.
        draftOnly: true,
        ...(shapeNote ? { shapeNote } : {}),
        website: website.trim() || undefined,
        websiteRead: website.trim() ? siteFacts !== undefined : undefined,
        draft,
        ...(metaDescription ? { metaDescription } : {}),
      });
    } catch (error) {
      if (token !== runToken.current) return;
      if (error instanceof BriefNotAvailableError) onUnavailable();
      else if (error instanceof Error && error.message) onError(error.message);
      else onError('Something went wrong. Please try again.');
    } finally {
      if (token === runToken.current) setStage('idle');
    }
  };

  const renderAnswer = (key: keyof Answers, label: string, choices: string[]) => {
    const placeholder = WIZARD_FIELDS.find(field => field.key === key)?.placeholder ?? '';
    return (
      <div key={key} className="flex flex-col gap-2">
        <label htmlFor={`wizard-${key}`} className={labelClass}>{label}</label>
        {choices.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {choices.map(choice => {
              const active = answers[key].split(/\s*;\s*/).some(part => part.trim().toLowerCase() === choice.toLowerCase());
              return (
                <button key={choice} type="button" disabled={busy} onClick={() => setAnswer(key, toggleChoice(answers[key], choice))} className={chipClass(active)}>
                  {choice}
                </button>
              );
            })}
          </div>
        )}
        <textarea
          id={`wizard-${key}`}
          rows={2}
          value={answers[key]}
          onChange={event => setAnswer(key, event.target.value)}
          disabled={busy}
          placeholder={placeholder}
          className={fieldClass}
        />
        {missing.includes(key) && <p className="text-sm text-status-critical">Fill this in first.</p>}
      </div>
    );
  };

  const renderGoal = (label: string) => (
    <div key="goal" className="flex flex-col gap-2">
      <span className={labelClass}>{label}</span>
      <div className="flex flex-wrap gap-2">
        {GOAL_OPTIONS.filter(option => option.key !== 'custom').map(option => (
          <button key={option.key} type="button" disabled={busy} onClick={() => setGoal(option.key)} className={chipClass(goal === option.key)}>
            {goalName(option.key)}
          </button>
        ))}
      </div>
    </div>
  );

  if (!plan) {
    const nextLabel = stage === 'reading' ? 'Reading your website…' : stage === 'thinking' ? 'Thinking of questions…' : 'Next';
    return (
      <div className="flex flex-col gap-6">
        {modal}
        <div className="flex flex-col gap-2">
          <label htmlFor="wizard-request" className={labelClass}>What do you want written?</label>
          <textarea
            id="wizard-request"
            rows={3}
            value={request}
            onChange={event => {
              setRequest(event.target.value);
              setMissing([]);
            }}
            disabled={busy}
            placeholder="For example: a blog post about how to choose a web development agency, about 900 words"
            className={fieldClass}
          />
          {missing.includes('request') && <p className="text-sm text-status-critical">Fill this in first.</p>}
          <p className={hintClass}>Write it the way you would ask a person. CopyZap then asks a few questions to make the copy yours.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="wizard-website" className={labelClass}>
            Your website <span className="font-normal text-gray-600 dark:text-gray-400">(optional)</span>
          </label>
          <input
            id="wizard-website"
            type="text"
            value={website}
            onChange={event => setWebsite(event.target.value)}
            disabled={busy}
            placeholder="yourcompany.com"
            className={fieldClass}
          />
          <p className={hintClass}>Read for facts like your services and experience, so there is less to answer.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleNext}
            disabled={busy}
            className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {nextLabel}
          </button>
        </div>
        {siteNotice && <p className={hintClass}>{siteNotice}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {modal}
      <div className="flex flex-col gap-3 border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>What you're getting</span>
          <button type="button" disabled={busy} onClick={() => setPlan(null)} className="text-sm underline text-gray-700 dark:text-gray-300">
            Change my request
          </button>
        </div>
        <p className={hintClass}>"{request.trim()}"</p>
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="What you need"
            value={piece}
            onChange={event => {
              const key = event.target.value as BriefPieceKey;
              setPiece(key);
              setTargetWords(suggestedWordsFor(key));
              setSections(defaultSectionsFor(key));
            }}
            disabled={busy}
            className={`${fieldBase} w-auto`}
          >
            {BRIEF_PIECES.map(item => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>
          {isPage && (
            <label className="flex items-center gap-2">
              <input
                type="number"
                aria-label="Length in words"
                min={BRIEF_MIN_WORDS}
                max={BRIEF_MAX_WORDS}
                step={50}
                value={sectionWordsSum ?? targetWords ?? ''}
                onChange={event => setTargetWords(event.target.value === '' ? null : Number(event.target.value))}
                disabled={busy || sectionWordsSum !== null}
                className={`${fieldBase} w-28`}
              />
              <span className={hintClass}>words</span>
            </label>
          )}
        </div>
        {isPage && (
          <details
            className="flex flex-col gap-3 border border-gray-200 dark:border-gray-700 p-3"
            open={sectionsOpen}
            onToggle={event => setSectionsOpen((event.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100">
              Sections (suggested) · <span className="font-normal">{sections.length} sections · about {(pageWords ?? 0).toLocaleString('en-US')} words</span>
            </summary>
            {sectionsOpen && (
              <div className="mt-3 flex flex-col gap-2">
                <p className={hintClass}>
                  Remove, move or add sections. Sections marked "only if facts exist" are left out when your answers and website give nothing for them.
                  {sectionWordsSum !== null ? ` Every section has a word count, so the length is their total: ${sectionWordsSum.toLocaleString('en-US')} words.` : ''}
                </p>
                <BriefSectionsEditor sections={sections} onChange={setSections} disabled={busy} totalWords={pageWords} />
              </div>
            )}
          </details>
        )}
        {isBlog && (
          <div className="flex flex-col gap-2">
            <label htmlFor="wizard-topic" className={labelClass}>Topic or title idea</label>
            <input id="wizard-topic" type="text" value={topic} onChange={event => setTopic(event.target.value)} disabled={busy} className={fieldClass} />
            {missing.includes('topic') && <p className="text-sm text-status-critical">Fill this in first.</p>}
          </div>
        )}
        {renderGoal('What should it do?')}
      </div>

      <div className="flex flex-col gap-5">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">A few questions</span>
        {questions
          .filter(question => question.key !== 'goal')
          .map(question => renderAnswer(question.key as keyof Answers, question.question, question.choices))}
      </div>

      <div className="flex flex-col gap-3">
        <span className={labelClass}>Language</span>
        <div className="flex flex-wrap gap-3">
          <select aria-label="Language" value={language} onChange={event => setLanguage(event.target.value as Language)} disabled={busy} className={`${fieldBase} w-auto`}>
            {QUICK_LANGUAGES.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input
            type="text"
            aria-label="Country"
            value={country}
            onChange={event => setCountry(event.target.value)}
            disabled={busy}
            placeholder="Country, e.g. Mexico"
            className={`${fieldBase} w-48`}
          />
          {language !== 'English' && (
            <div className="flex gap-2">
              {(['formal', 'informal'] as const).map(option => (
                <button key={option} type="button" disabled={busy} onClick={() => setFormality(option)} className={chipClass(formality === option)}>
                  {option === 'formal' ? 'Formal' : 'Informal'}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className={hintClass}>The country sets local words, spelling, currency and dates. Formal is usted, Sie or vous; informal is tú, du or tu.</p>
        {plan.unsupportedLanguage && (
          <p className={hintClass}>CopyZap can't write in {plan.unsupportedLanguage} yet. Pick one of the languages above.</p>
        )}
      </div>

      <details
        className="flex flex-col gap-4 border border-gray-200 dark:border-gray-700 p-3"
        open={otherOpen}
        onToggle={event => setOtherOpen((event.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100">
          Already understood (check or change)
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          {otherFields.map(field => renderAnswer(field.key, field.label, []))}
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Tone</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_TONES.map(option => (
                <button key={option} type="button" disabled={busy} onClick={() => setTone(option)} className={chipClass(tone === option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      {followUps && followUps.length > 0 && (
        <div className="flex flex-col gap-4 border-2 border-primary-500 p-4">
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {followUps.length === 1 ? 'One more detail makes it much stronger' : 'Two more details make it much stronger'}
          </span>
          <p className={hintClass}>Some answers are what many companies say. A concrete detail makes the copy yours. Leave a box empty to skip it.</p>
          {followUps.map(item => (
            <div key={item.key} className="flex flex-col gap-2">
              <label htmlFor={`wizard-follow-${item.key}`} className={labelClass}>{item.question}</label>
              {item.choices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.choices.map(choice => {
                    const current = followAnswers[item.key] ?? '';
                    const active = current.split(/\s*;\s*/).some(part => part.trim().toLowerCase() === choice.toLowerCase());
                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={busy}
                        onClick={() => setFollowAnswers(list => ({ ...list, [item.key]: toggleChoice(list[item.key] ?? '', choice) }))}
                        className={chipClass(active)}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              )}
              <textarea
                id={`wizard-follow-${item.key}`}
                rows={2}
                value={followAnswers[item.key] ?? ''}
                onChange={event => {
                  const value = event.target.value;
                  setFollowAnswers(list => ({ ...list, [item.key]: value }));
                }}
                disabled={busy}
                className={fieldClass}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="button"
          onClick={handleWrite}
          disabled={busy}
          className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {stage === 'checking' ? 'Checking your answers…' : stage === 'writing' ? 'Writing…' : 'Write it'}
        </button>
        <span className={hintClass}>Writing the draft uses about 10 credits for up to 1,000 words. Scoring it, on the next screen, uses about 15 to 20 more.</span>
      </div>
    </div>
  );
};

export default WizardForm;
