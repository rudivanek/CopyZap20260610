import React from 'react';
import { Language, Tone } from '../types';
import { QUICK_DEFAULT_VARIANTS } from '../engine/buildQuickFormState';
import { QUICK_LANGUAGES, QUICK_TONES, QuickBrief } from '../engine/inferQuickBrief';
import { stripMarkdown } from '../utils/markdownUtils';

interface QuickConfirmProps {
  copy: string;
  words: number;
  goalName: string;
  brief: QuickBrief;
  onBriefChange: (brief: QuickBrief) => void;
  onGenerate: () => void;
  onBack: () => void;
  /** Testimonials found in the copy. They are kept word for word. */
  testimonialCount: number;
}

const PREVIEW_CHARS = 220;

const field =
  'w-full min-h-[44px] px-3.5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
const label = 'font-semibold text-gray-900 dark:text-gray-100';

function preview(copy: string): string {
  const flat = stripMarkdown(copy).replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_CHARS ? `${flat.slice(0, PREVIEW_CHARS).trim()} …` : flat;
}

const QuickConfirm: React.FC<QuickConfirmProps> = ({
  copy,
  words,
  goalName,
  brief,
  onBriefChange,
  onGenerate,
  onBack,
  testimonialCount,
}) => {
  const couldNotRead = !brief.product && !brief.audience;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 flex flex-col gap-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-gray-900 dark:text-white">Here is what I understood</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {couldNotRead
            ? 'Quick could not read this copy automatically. Fill in what you can, or generate as it is.'
            : 'Fix anything that is wrong, then generate.'}
        </p>
      </div>

      <section
        aria-label="Your input"
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-5 py-4 flex flex-col gap-2"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Your copy · {words} {words === 1 ? 'word' : 'words'} · Goal: {goalName}
          </span>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-primary-800 dark:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Change
          </button>
        </div>
        <p className="text-gray-900 dark:text-gray-100 break-words">{preview(copy)}</p>
        {testimonialCount > 0 && (
          <p className="flex items-start gap-2.5 text-gray-900 dark:text-gray-100">
            <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-good" aria-hidden="true" />
            <span>
              {testimonialCount} {testimonialCount === 1 ? 'testimonial' : 'testimonials'} found. They are kept word for
              word and are not rewritten.
            </span>
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-4">
        <div className="flex-[2_1_200px] min-w-0 flex flex-col gap-1.5">
          <label htmlFor="quick-product" className={label}>
            Selling
          </label>
          <input
            id="quick-product"
            type="text"
            value={brief.product}
            onChange={event => onBriefChange({ ...brief, product: event.target.value })}
            placeholder="The product or service"
            className={field}
          />
        </div>
        <div className="flex-[2_1_200px] min-w-0 flex flex-col gap-1.5">
          <label htmlFor="quick-audience" className={label}>
            For
          </label>
          <input
            id="quick-audience"
            type="text"
            value={brief.audience}
            onChange={event => onBriefChange({ ...brief, audience: event.target.value })}
            placeholder="Who this copy speaks to"
            className={field}
          />
        </div>
        <div className="flex-[1_1_130px] min-w-0 flex flex-col gap-1.5">
          <label htmlFor="quick-tone" className={label}>
            Tone
          </label>
          <select
            id="quick-tone"
            value={brief.tone}
            onChange={event => onBriefChange({ ...brief, tone: event.target.value as Tone })}
            className={field}
          >
            {QUICK_TONES.map(tone => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-[1_1_130px] min-w-0 flex flex-col gap-1.5">
          <label htmlFor="quick-language" className={label}>
            Language
          </label>
          <select
            id="quick-language"
            value={brief.language}
            onChange={event =>
              onBriefChange({ ...brief, language: event.target.value as Language, unsupportedLanguage: undefined })
            }
            className={field}
          >
            {QUICK_LANGUAGES.map(language => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </div>

      {brief.unsupportedLanguage && (
        <div role="alert" className="flex items-start gap-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-4">
          <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-warning" aria-hidden="true" />
          <p className="text-gray-900 dark:text-gray-100">
            This copy looks like it is written in {brief.unsupportedLanguage}. Quick can write in{' '}
            {QUICK_LANGUAGES.slice(0, -1).join(', ')} and {QUICK_LANGUAGES[QUICK_LANGUAGES.length - 1]}. The new versions
            will be written in {brief.language}.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Looks right, generate
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center min-h-[48px] px-6 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Back
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Writes {QUICK_DEFAULT_VARIANTS} versions and scores them. Uses credits.
        </p>
      </div>
    </main>
  );
};

export default QuickConfirm;
