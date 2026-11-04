import React, { useState } from 'react';
import { GoalKey, Language, Tone, User } from '../types';
import { GOAL_OPTIONS } from '../utils/scoringContextStorage';
import {
  Brief,
  BriefNotAvailableError,
  BriefPieceKey,
  BRIEF_PIECES,
  BRIEF_MIN_WORDS,
  BRIEF_MAX_WORDS,
  briefPiece,
  defaultSectionsFor,
  generateFromBrief,
  splitMetaDescription,
  suggestedWordsFor,
  suggestSectionWords,
  trimSiteFacts,
} from '../engine/generateFromBrief';
import { getWizardPlan, WizardFieldKey, WizardFormality, WizardPlan, WizardQuestion, WIZARD_FIELDS } from '../engine/wizardQuestions';
import { fetchQuickPage } from '../engine/fetchQuickPage';
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

const fieldClass =
  'w-full min-h-[44px] px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
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
  const [stage, setStage] = useState<'idle' | 'reading' | 'thinking' | 'writing'>('idle');
  const [plan, setPlan] = useState<WizardPlan | null>(null);
  const [siteFacts, setSiteFacts] = useState<string | undefined>(undefined);
  const [siteNotice, setSiteNotice] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const [piece, setPiece] = useState<BriefPieceKey>('other');
  const [topic, setTopic] = useState('');
  const [targetWords, setTargetWords] = useState<number | null>(null);
  const [goal, setGoal] = useState<GoalKey>('convert');
  const [tone, setTone] = useState<Tone>('Professional');
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [country, setCountry] = useState('');
  const [formality, setFormality] = useState<WizardFormality>('formal');
  const [answers, setAnswers] = useState<Answers>({ product: '', audience: '', differentiators: '', proof: '', experience: '', callToAction: '' });
  const [questions, setQuestions] = useState<WizardQuestion[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);

  const busy = stage !== 'idle' || disabled;
  const isPage = briefPiece(piece).group === 'page';
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
    let id: string | undefined;
    try {
      id = await getSessionId(request.trim().slice(0, 60) || 'Brief (2)');
    } catch {
      id = undefined;
    }
    setSessionId(id);
    let facts: string | undefined;
    if (website.trim()) {
      setStage('reading');
      try {
        const page = await fetchQuickPage(website.trim(), currentUser, id);
        facts = trimSiteFacts(page.copy);
      } catch {
        setSiteNotice("We couldn't read that website, so the questions are based on your request only.");
      }
    }
    setSiteFacts(facts);
    setStage('thinking');
    try {
      const next = await getWizardPlan(request, facts ? trimSiteFacts(facts, 1500) : undefined, currentUser, defaultLanguage, id);
      setPiece(next.piece);
      setTopic(next.topic);
      setTargetWords(next.targetWords);
      setGoal(next.goal);
      setTone(next.tone);
      setLanguage(next.language);
      setCountry(next.country);
      setFormality(next.formality ?? 'formal');
      setAnswers({ ...next.known });
      // Nothing to ask (the request could not be read): ask for every answer, with the default labels.
      setQuestions(
        next.questions.length > 0
          ? next.questions
          : WIZARD_FIELDS.map(field => ({ key: field.key, question: field.label, choices: [] }))
      );
      setPlan(next);
    } catch (error) {
      if (error instanceof BriefNotAvailableError) onUnavailable();
      else onError('Something went wrong. Please try again.');
    } finally {
      setStage('idle');
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
    const words = isPage ? targetWords ?? suggestedWordsFor(piece) : null;
    if (isPage && (!words || words < BRIEF_MIN_WORDS || words > BRIEF_MAX_WORDS)) {
      onError(`Set a length between ${BRIEF_MIN_WORDS} and ${BRIEF_MAX_WORDS} words.`);
      return;
    }
    setMissing([]);
    setStage('writing');
    try {
      const sections = isPage ? defaultSectionsFor(piece) : [];
      const sectionWords = isPage ? suggestSectionWords(sections, words) : [];
      const hasFormality = language !== 'English';
      const brief: Brief = {
        product: answers.product.trim(),
        audience: answers.audience.trim(),
        goal,
        piece,
        tone,
        differentiators: answers.differentiators.trim() || undefined,
        callToAction: answers.callToAction.trim() || undefined,
        siteFacts,
        proof: answers.proof.trim() || undefined,
        experience: answers.experience.trim() || undefined,
        length: briefPiece(piece).defaultLength,
        sections: isPage ? sections.map((section, index) => ({ ...section, words: sectionWords[index] ?? null })) : undefined,
        targetWords: isPage && words ? words : undefined,
        topic: isBlog ? topic.trim() || undefined : undefined,
        language,
        country: country.trim() || undefined,
        formality: hasFormality ? formality : undefined,
        spanishForm: language === 'Spanish' ? (formality === 'formal' ? 'usted' : 'tú') : undefined,
      };
      const written = await generateFromBrief(brief, currentUser, sessionId);
      const { draft, metaDescription } = isBlog ? splitMetaDescription(written) : { draft: written, metaDescription: undefined };
      const languageText = [
        language,
        country.trim() ? `(${country.trim()})` : '',
        hasFormality ? `· ${formality}` : '',
      ].filter(Boolean).join(' ');
      const fields = [
        { label: 'What you need', value: briefPiece(piece).label },
        { label: 'Your request', value: request.trim() },
        { label: 'Topic or title idea', value: isBlog ? topic.trim() : '' },
        { label: 'What you are selling', value: answers.product.trim() },
        { label: 'Who it is for', value: answers.audience.trim() },
        { label: 'Goal', value: goalName(goal) },
        { label: 'Tone', value: String(tone) },
        { label: 'What makes you different', value: answers.differentiators.trim() },
        { label: 'Proof or results', value: answers.proof.trim() },
        { label: 'Your experience', value: answers.experience.trim() },
        { label: 'What the reader should do', value: answers.callToAction.trim() },
        { label: 'Length', value: isPage && words ? `about ${words.toLocaleString('en-US')} words` : '' },
        { label: 'Language', value: languageText },
        { label: 'Started from', value: 'Brief (2)' },
      ].filter(field => field.value);
      onDraft(draft, goal, {
        fields,
        website: website.trim() || undefined,
        websiteRead: website.trim() ? siteFacts !== undefined : undefined,
        draft,
        ...(metaDescription ? { metaDescription } : {}),
      });
    } catch (error) {
      if (error instanceof BriefNotAvailableError) onUnavailable();
      else if (error instanceof Error && error.message) onError(error.message);
      else onError('Something went wrong. Please try again.');
    } finally {
      setStage('idle');
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
            }}
            disabled={busy}
            className={`${fieldClass} w-auto`}
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
                value={targetWords ?? ''}
                onChange={event => setTargetWords(event.target.value === '' ? null : Number(event.target.value))}
                disabled={busy}
                className={`${fieldClass} w-28`}
              />
              <span className={hintClass}>words</span>
            </label>
          )}
        </div>
        {isBlog && (
          <div className="flex flex-col gap-2">
            <label htmlFor="wizard-topic" className={labelClass}>Topic or title idea</label>
            <input id="wizard-topic" type="text" value={topic} onChange={event => setTopic(event.target.value)} disabled={busy} className={fieldClass} />
            {missing.includes('topic') && <p className="text-sm text-status-critical">Fill this in first.</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">A few questions</span>
        {questions.map(question =>
          question.key === 'goal'
            ? renderGoal(question.question)
            : renderAnswer(question.key, question.question, question.choices)
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className={labelClass}>Language</span>
        <div className="flex flex-wrap gap-3">
          <select aria-label="Language" value={language} onChange={event => setLanguage(event.target.value as Language)} disabled={busy} className={`${fieldClass} w-auto`}>
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
            className={`${fieldClass} w-48`}
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
          {!askedKeys.includes('goal') && renderGoal('Goal')}
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="button"
          onClick={handleWrite}
          disabled={busy}
          className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {stage === 'writing' ? 'Writing…' : 'Write it'}
        </button>
        <span className={hintClass}>CopyZap writes a draft from your answers, then scores and improves it.</span>
      </div>
    </div>
  );
};

export default WizardForm;
