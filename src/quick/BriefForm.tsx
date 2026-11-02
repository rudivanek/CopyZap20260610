import React, { useState } from 'react';
import { GoalKey, Language, Tone, User } from '../types';
import { TextKindKey } from '../services/api/textKinds';
import { DEFAULT_GOAL_KEY, GOAL_OPTIONS } from '../utils/scoringContextStorage';
import { Brief, BriefLength, BriefNotAvailableError, generateFromBrief } from '../engine/generateFromBrief';

interface BriefFormProps {
  currentUser: User;
  /** The language the rest of Quick is set to, used as the default here. */
  defaultLanguage: Language;
  disabled: boolean;
  /** Called with the generated draft; Quick treats it as pasted copy and runs its normal flow. */
  onDraft: (draft: string, goalKey: GoalKey) => void;
  /** Called when the brief mode is refused for this account (403 BRIEF_MODE_NOT_AVAILABLE). */
  onUnavailable: () => void;
  /** Called with an error message to show, on any other failure. */
  onError: (message: string) => void;
}

const CHANNELS: { key: TextKindKey; label: string }[] = [
  { key: 'web_page', label: 'Web page' },
  { key: 'short_text', label: 'Short text (headline, slogan)' },
  { key: 'email', label: 'Email' },
  { key: 'social_post', label: 'Social post' },
  { key: 'ad', label: 'Ad' },
  { key: 'other', label: 'Other' },
];

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

const BriefForm: React.FC<BriefFormProps> = ({ currentUser, defaultLanguage, disabled, onDraft, onUnavailable, onError }) => {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState<GoalKey>(DEFAULT_GOAL_KEY);
  const [channel, setChannel] = useState<TextKindKey>('web_page');
  const [tone, setTone] = useState<Tone>('Professional');
  const [proof, setProof] = useState('');
  const [mustInclude, setMustInclude] = useState('');
  const [avoid, setAvoid] = useState('');
  const [length, setLength] = useState<BriefLength>('medium');
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [spanishForm, setSpanishForm] = useState<'tú' | 'usted'>('usted');
  const [moreOpen, setMoreOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

  const required: { key: string; value: string }[] = [
    { key: 'product', value: product },
    { key: 'audience', value: audience },
    { key: 'goal', value: goal },
    { key: 'channel', value: channel },
  ];

  const isMissing = (key: string) => missing.includes(key);
  const clearMissing = (key: string) => setMissing(list => list.filter(item => item !== key));

  const handleWrite = async () => {
    if (disabled || writing) return;
    const empty = required.filter(item => !item.value || !String(item.value).trim()).map(item => item.key);
    if (empty.length > 0) {
      setMissing(empty);
      return;
    }
    setMissing([]);
    setWriting(true);
    try {
      const brief: Brief = {
        product: product.trim(),
        audience: audience.trim(),
        goal,
        channel,
        tone,
        proof: proof.trim() || undefined,
        mustInclude: mustInclude.trim() || undefined,
        avoid: avoid.trim() || undefined,
        length,
        language,
        spanishForm: language === 'Spanish' ? spanishForm : undefined,
      };
      const draft = await generateFromBrief(brief, currentUser);
      onDraft(draft, goal);
    } catch (error) {
      if (error instanceof BriefNotAvailableError) {
        onUnavailable();
      } else if (error instanceof Error && error.message) {
        onError(error.message);
      } else {
        onError('Something went wrong. Please try again.');
      }
    } finally {
      setWriting(false);
    }
  };

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
          disabled={writing || disabled}
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
          disabled={writing || disabled}
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
          disabled={writing || disabled}
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
        <label htmlFor="brief-channel" className={labelClass}>
          Where will it appear?
        </label>
        <select
          id="brief-channel"
          value={channel}
          onChange={event => {
            setChannel(event.target.value as TextKindKey);
            clearMissing('channel');
          }}
          disabled={writing || disabled}
          className={fieldClass}
        >
          {CHANNELS.map(option => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        {isMissing('channel') && <p className="text-sm text-status-critical">Fill this in first.</p>}
      </div>

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
                disabled={writing || disabled}
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
                disabled={writing || disabled}
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
                disabled={writing || disabled}
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
                disabled={writing || disabled}
                placeholder="Words or points to keep out"
                className={fieldClass}
              />
            </div>

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
                      disabled={writing || disabled}
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

            <div className="flex flex-col gap-2">
              <label htmlFor="brief-language" className={labelClass}>
                Language
              </label>
              <select
                id="brief-language"
                value={language}
                onChange={event => setLanguage(event.target.value as Language)}
                disabled={writing || disabled}
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
                        disabled={writing || disabled}
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
          disabled={writing || disabled}
          className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {writing ? 'Writing…' : 'Write copy'}
        </button>
        <span className="text-gray-600 dark:text-gray-400">
          CopyZap writes a draft from your brief, then scores and improves it.
        </span>
      </div>
    </div>
  );
};

export default BriefForm;
