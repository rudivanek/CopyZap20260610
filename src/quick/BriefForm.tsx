import React, { useState } from 'react';
import { GoalKey, Language, Tone, User } from '../types';
import { DEFAULT_GOAL_KEY, GOAL_OPTIONS } from '../utils/scoringContextStorage';
import {
  Brief,
  BriefLength,
  BriefNotAvailableError,
  BriefPieceKey,
  BRIEF_PIECES,
  briefPiece,
  generateFromBrief,
  trimSiteFacts,
} from '../engine/generateFromBrief';
import { fetchQuickPage } from '../engine/fetchQuickPage';
import type { QuickBriefRecord } from '../engine/runQuickPipeline';

interface BriefFormProps {
  currentUser: User;
  /** The language the rest of Quick is set to, used as the default here. */
  defaultLanguage: Language;
  disabled: boolean;
  /** Called with the generated draft; Quick treats it as pasted copy and runs its normal flow. */
  onDraft: (draft: string, goalKey: GoalKey, record: Omit<QuickBriefRecord, 'editedBeforeScoring'>) => void;
  /** Called when the brief mode is refused for this account (403 BRIEF_MODE_NOT_AVAILABLE). */
  onUnavailable: () => void;
  /** Called with an error message to show, on any other failure. */
  onError: (message: string) => void;
  /** Starts (or reuses) the Quick session, so the brief's usage is recorded on the same run. */
  getSessionId: (label: string) => Promise<string>;
}

const LENGTHS: { key: BriefLength; label: string }[] = [
  { key: 'short', label: 'Short' },
  { key: 'medium', label: 'Medium' },
  { key: 'long', label: 'Long' },
];

const TONES: Tone[] = ['Professional', 'Friendly', 'Bold', 'Minimalist', 'Creative', 'Persuasive'];
const LANGUAGES: Language[] = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];

const fieldClass =
  'w-full min-h-[44px] px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
const labelClass = 'font-semibold text-gray-900 dark:text-gray-100';
const hintClass = 'text-sm text-gray-600 dark:text-gray-400';

const PIECE_GROUPS: { label: string; keys: BriefPieceKey[] }[] = [
  { label: 'Web pages', keys: ['homepage', 'landing_page', 'service_page', 'about_page'] },
  { label: 'Short texts', keys: ['h1_headline', 'usp', 'slogan'] },
  { label: 'Email', keys: ['email', 'newsletter'] },
  { label: 'Other', keys: ['social_post', 'ad', 'product_description', 'other'] },
];

const BriefForm: React.FC<BriefFormProps> = ({ currentUser, defaultLanguage, disabled, onDraft, onUnavailable, onError, getSessionId }) => {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState<GoalKey>(DEFAULT_GOAL_KEY);
  const [piece, setPiece] = useState<BriefPieceKey>('homepage');
  const [tone, setTone] = useState<Tone>('Professional');
  const [differentiators, setDifferentiators] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [website, setWebsite] = useState('');
  const [siteNotice, setSiteNotice] = useState<string | null>(null);
  const [proof, setProof] = useState('');
  const [mustInclude, setMustInclude] = useState('');
  const [avoid, setAvoid] = useState('');
  const [length, setLength] = useState<BriefLength>('long');
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [spanishForm, setSpanishForm] = useState<'tú' | 'usted'>('usted');
  const [moreOpen, setMoreOpen] = useState(false);
  const [stage, setStage] = useState<'idle' | 'reading' | 'writing'>('idle');
  const [missing, setMissing] = useState<string[]>([]);

  const group = briefPiece(piece).group;
  const busy = stage !== 'idle' || disabled;
  const showLength = group === 'page' || group === 'email';

  const handlePieceChange = (newKey: BriefPieceKey) => {
    setPiece(newKey);
    setLength(briefPiece(newKey).defaultLength);
    clearMissing('piece');
  };

  const required: { key: string; value: string }[] = [
    { key: 'product', value: product },
    { key: 'audience', value: audience },
    { key: 'goal', value: goal },
    { key: 'piece', value: piece },
  ];

  const isMissing = (key: string) => missing.includes(key);
  const clearMissing = (key: string) => setMissing(list => list.filter(item => item !== key));

  const handleWrite = async () => {
    if (busy) return;
    const empty = required.filter(item => !item.value || !String(item.value).trim()).map(item => item.key);
    if (empty.length > 0) {
      setMissing(empty);
      return;
    }
    setMissing([]);
    setSiteNotice(null);
    let sessionId: string | undefined;
    try {
      sessionId = await getSessionId(product.trim().slice(0, 60) || 'Brief');
    } catch {
      sessionId = undefined;
    }
    let siteFacts: string | undefined;
    if (website.trim() && (group === 'page' || group === 'short')) {
      setStage('reading');
      try {
        const page = await fetchQuickPage(website.trim(), currentUser, sessionId);
        siteFacts = trimSiteFacts(page.copy);
      } catch {
        setSiteNotice("We couldn't read that website, so the copy was written from your brief only.");
      }
    }
    setStage('writing');
    try {
      const brief: Brief = {
        product: product.trim(),
        audience: audience.trim(),
        goal,
        piece,
        tone,
        differentiators: differentiators.trim() || undefined,
        callToAction: callToAction.trim() || undefined,
        siteFacts,
        proof: proof.trim() || undefined,
        mustInclude: mustInclude.trim() || undefined,
        avoid: avoid.trim() || undefined,
        length: showLength ? length : briefPiece(piece).defaultLength,
        language,
        spanishForm: language === 'Spanish' ? spanishForm : undefined,
      };
      const draft = await generateFromBrief(brief, currentUser, sessionId);
      const goalOption = GOAL_OPTIONS.find(option => option.key === goal);
      const goalText = goal === 'custom' ? 'Other' : (goalOption?.label.split(' — ')[0] ?? String(goal));
      const languageText = language === 'Spanish' ? `Español (${spanishForm})` : language;
      const fields = [
        { label: 'What you need', value: briefPiece(piece).label },
        { label: 'What you are selling', value: product.trim() },
        { label: 'Who it is for', value: audience.trim() },
        { label: 'Goal', value: goalText },
        { label: 'Tone', value: String(tone) },
        { label: 'What makes you different', value: group === 'page' || group === 'short' ? differentiators.trim() : '' },
        { label: 'What the reader should do', value: group === 'page' || group === 'email' || group === 'post' || group === 'ad' ? callToAction.trim() : '' },
        { label: 'Proof or results', value: proof.trim() },
        { label: 'Must include', value: mustInclude.trim() },
        { label: 'Avoid', value: avoid.trim() },
        { label: 'Length', value: showLength ? (LENGTHS.find(option => option.key === length)?.label ?? String(length)) : '' },
        { label: 'Language', value: languageText },
      ].filter(field => field.value);
      const usedWebsite = website.trim() && (group === 'page' || group === 'short') ? website.trim() : undefined;
      onDraft(draft, goal, {
        fields,
        website: usedWebsite,
        websiteRead: usedWebsite ? siteFacts !== undefined : undefined,
        draft,
      });
    } catch (error) {
      if (error instanceof BriefNotAvailableError) {
        onUnavailable();
      } else if (error instanceof Error && error.message) {
        onError(error.message);
      } else {
        onError('Something went wrong. Please try again.');
      }
    } finally {
      setStage('idle');
    }
  };

  const writeLabel = stage === 'reading' ? 'Reading your website…' : stage === 'writing' ? 'Writing…' : 'Write copy';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="brief-product" className={labelClass}>
          What are you selling?
        </label>
        <textarea
          id="brief-product"
          rows={2}
          value={product}
          onChange={event => {
            setProduct(event.target.value);
            clearMissing('product');
          }}
          disabled={busy}
          placeholder="For example: a bookkeeping service for small restaurants"
          className={fieldClass}
        />
        {isMissing('product') && <p className="text-sm text-status-critical">Fill this in first.</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="brief-audience" className={labelClass}>
          Who is it for?
        </label>
        <textarea
          id="brief-audience"
          rows={2}
          value={audience}
          onChange={event => {
            setAudience(event.target.value);
            clearMissing('audience');
          }}
          disabled={busy}
          placeholder="For example: restaurant owners who do their own books"
          className={fieldClass}
        />
        {isMissing('audience') && <p className="text-sm text-status-critical">Fill this in first.</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="brief-goal" className={labelClass}>
          Goal
        </label>
        <select
          id="brief-goal"
          value={goal}
          onChange={event => {
            setGoal(event.target.value as GoalKey);
            clearMissing('goal');
          }}
          disabled={busy}
          className={fieldClass}
        >
          {GOAL_OPTIONS.map(option => (
            <option key={option.key} value={option.key}>
              {option.key === 'custom' ? 'Other' : option.label.split(' — ')[0]}
            </option>
          ))}
        </select>
        {isMissing('goal') && <p className="text-sm text-status-critical">Fill this in first.</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="brief-piece" className={labelClass}>
          What do you need?
        </label>
        <select
          id="brief-piece"
          value={piece}
          onChange={event => handlePieceChange(event.target.value as BriefPieceKey)}
          disabled={busy}
          className={fieldClass}
        >
          {PIECE_GROUPS.map(section => (
            <optgroup key={section.label} label={section.label}>
              {section.keys.map(key => (
                <option key={key} value={key}>
                  {BRIEF_PIECES.find(item => item.key === key)?.label ?? key}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {isMissing('piece') && <p className="text-sm text-status-critical">Fill this in first.</p>}
      </div>

      {(group === 'page' || group === 'short') && (
        <div className="flex flex-col gap-2">
          <label htmlFor="brief-differentiators" className={labelClass}>
            What makes you different? <span className="font-normal text-gray-600 dark:text-gray-400">(optional)</span>
          </label>
          <textarea
            id="brief-differentiators"
            rows={3}
            value={differentiators}
            onChange={event => setDifferentiators(event.target.value)}
            disabled={busy}
            placeholder="20 years building websites; every site custom-made, no templates; delivered in 6 weeks"
            className={fieldClass}
          />
          <p className={hintClass}>Two or three points. This is what makes the copy yours instead of generic.</p>
        </div>
      )}

      {(group === 'page' || group === 'email' || group === 'post' || group === 'ad') && (
        <div className="flex flex-col gap-2">
          <label htmlFor="brief-cta" className={labelClass}>
            What should the reader do? <span className="font-normal text-gray-600 dark:text-gray-400">(optional)</span>
          </label>
          <input
            id="brief-cta"
            type="text"
            value={callToAction}
            onChange={event => setCallToAction(event.target.value)}
            disabled={busy}
            placeholder="Book a free call"
            className={fieldClass}
          />
          <p className={hintClass}>The one action you want.</p>
        </div>
      )}

      {(group === 'page' || group === 'short') && (
        <div className="flex flex-col gap-2">
          <label htmlFor="brief-website" className={labelClass}>
            Your website (if you have one) <span className="font-normal text-gray-600 dark:text-gray-400">(optional)</span>
          </label>
          <input
            id="brief-website"
            type="text"
            value={website}
            onChange={event => setWebsite(event.target.value)}
            disabled={busy}
            placeholder="yourcompany.com"
            className={fieldClass}
          />
          <p className={hintClass}>CopyZap reads it for facts like your services and experience. It does not copy the text.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Tone</span>
        <div className="flex flex-wrap gap-2">
          {TONES.map(option => {
            const active = tone === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setTone(option)}
                disabled={busy}
                className={
                  'min-h-[40px] px-4 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
                  (active
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800')
                }
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <details className="flex flex-col gap-4" open={moreOpen} onToggle={event => setMoreOpen((event.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100">
          More details (optional)
        </summary>
        {moreOpen && (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="brief-proof" className={labelClass}>
                Proof or results <span className="font-normal text-gray-600 dark:text-gray-400">(optional)</span>
              </label>
              <textarea
                id="brief-proof"
                rows={3}
                value={proof}
                onChange={event => setProof(event.target.value)}
                disabled={busy}
                placeholder="For example: serves 40 restaurants, listed in X magazine"
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="brief-include" className={labelClass}>
                Must include <span className="font-normal text-gray-600 dark:text-gray-400">(optional)</span>
              </label>
              <input
                id="brief-include"
                type="text"
                value={mustInclude}
                onChange={event => setMustInclude(event.target.value)}
                disabled={busy}
                placeholder="Words or points that must appear"
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="brief-avoid" className={labelClass}>
                Avoid <span className="font-normal text-gray-600 dark:text-gray-400">(optional)</span>
              </label>
              <input
                id="brief-avoid"
                type="text"
                value={avoid}
                onChange={event => setAvoid(event.target.value)}
                disabled={busy}
                placeholder="Words or points to keep out"
                className={fieldClass}
              />
            </div>

            {showLength && (
              <div className="flex flex-col gap-2">
                <span className={labelClass}>Length</span>
                <div className="flex gap-2">
                  {LENGTHS.map(option => {
                    const active = length === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setLength(option.key)}
                        disabled={busy}
                        className={
                          'min-h-[40px] px-4 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
                          (active
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800')
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="brief-language" className={labelClass}>
                Language
              </label>
              <select
                id="brief-language"
                value={language}
                onChange={event => setLanguage(event.target.value as Language)}
                disabled={busy}
                className={fieldClass}
              >
                {LANGUAGES.map(option => (
                  <option key={option} value={option}>
                    {option === 'Spanish' ? 'Español' : option}
                  </option>
                ))}
              </select>
              {language === 'Spanish' && (
                <div className="flex gap-2">
                  {(['tú', 'usted'] as const).map(option => {
                    const active = spanishForm === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSpanishForm(option)}
                        disabled={busy}
                        className={
                          'min-h-[40px] px-4 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
                          (active
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800')
                        }
                      >
                        {option === 'tú' ? 'Tú (informal)' : 'Usted (formal)'}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </details>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="button"
          onClick={handleWrite}
          disabled={busy}
          className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {writeLabel}
        </button>
        <span className={hintClass}>
          CopyZap writes a draft from your brief, then scores and improves it.
        </span>
      </div>
      {siteNotice && <p className={hintClass}>{siteNotice}</p>}
    </div>
  );
};

export default BriefForm;
