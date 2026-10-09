import React from 'react';
import { Language, Tone } from '../types';
import { QUICK_DEFAULT_VARIANTS } from '../engine/buildQuickFormState';
import { QUICK_LANGUAGES, QUICK_TONES, QuickBrief } from '../engine/inferQuickBrief';
import type { PageSection, SectionChoice } from '../engine/pageSections';
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
  /** The parts of the page, from its own headings. One part means there is nothing to choose. */
  sections: PageSection[];
  choices: Record<string, SectionChoice>;
  onChoiceChange: (id: string, choice: SectionChoice) => void;
  /** Words Quick will rewrite with the current choices. */
  improveWords: number;
  /** Words of the run with the current choices: everything that is not left out. */
  usedWords: number;
  /** Most words one run works on. */
  maxWords: number;
  /** Why generating is not possible right now, if it is not. */
  blocked: string | null;
}

const CHOICES: { value: SectionChoice; label: string }[] = [
  { value: 'improve', label: 'Improve' },
  { value: 'keep', label: 'Keep as is' },
  { value: 'leave', label: 'Leave out' },
];

const PREVIEW_CHARS = 220;
/** From this many words on, the screen says how long the run will take. */
const LONG_RUN_FROM_WORDS = 2000;
/** Measured on 2026-10-08: a run takes about a minute for every 600 words. */
const WORDS_PER_MINUTE = 600;
const asNumber = (value: number) => value.toLocaleString('en-US');

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
  sections,
  choices,
  onChoiceChange,
  improveWords,
  usedWords,
  maxWords,
  blocked,
}) => {
  const choiceOf = (section: PageSection): SectionChoice => choices[section.id] ?? 'improve';
  const count = (value: SectionChoice) => sections.filter(section => choiceOf(section) === value).length;
  const couldNotRead = !brief.product && !brief.audience;
  // A page longer than one run works on: parts have to be left out first.
  const overLimit = words > maxWords;
  const stillOver = usedWords > maxWords;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 flex flex-col gap-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-gray-900 dark:text-white">Here is what I understood</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {couldNotRead
            ? 'CopyZap could not read this copy automatically. Fill in what you can, or generate as it is.'
            : 'Fix anything that is wrong, then generate.'}
        </p>
      </div>

      <section
        aria-label="Your input"
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-5 py-4 flex flex-col gap-2"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Your copy · {asNumber(words)} {words === 1 ? 'word' : 'words'} · Goal: {goalName}
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

      {sections.length > 1 && (
        <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
          <legend className="p-0 mb-1 font-semibold text-gray-900 dark:text-gray-100">
            What should CopyZap do with each part?
          </legend>
          {overLimit && (
            <p id="quick-over-limit" className="flex items-start gap-2.5 mb-1 text-gray-900 dark:text-gray-100">
              <span
                className={'w-1 h-5 mt-0.5 shrink-0 ' + (stillOver ? 'bg-status-warning' : 'bg-status-good')}
                aria-hidden="true"
              />
              <span>
                This copy has {asNumber(words)} words. CopyZap works on up to {asNumber(maxWords)} at a time. Set parts to
                "Leave out" until {asNumber(maxWords)} words or fewer are in use. Parts kept as they are count too.
              </span>
            </p>
          )}
          <ul className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {sections.map(section => {
              const current = choiceOf(section);
              return (
                <li key={section.id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-[1_1_220px] flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span
                      className={
                        'font-semibold break-words ' +
                        (current === 'leave'
                          ? 'text-gray-500 dark:text-gray-400 line-through'
                          : 'text-gray-900 dark:text-gray-100')
                      }
                    >
                      {section.title}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                      {asNumber(section.words)} {section.words === 1 ? 'word' : 'words'}
                    </span>
                    {section.hint && (
                      <span className="text-xs text-gray-900 dark:text-gray-100 border border-gray-400 dark:border-gray-600 px-1.5">
                        {section.hint}
                      </span>
                    )}
                  </div>
                  <div role="group" aria-label={`What to do with ${section.title}`} className="flex flex-wrap gap-1">
                    {CHOICES.map(option => {
                      const selected = current === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => onChoiceChange(section.id, option.value)}
                          className={
                            'min-h-[44px] px-3 border focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
                            (selected
                              ? 'bg-gray-900 border-gray-900 text-white dark:bg-gray-100 dark:border-gray-100 dark:text-gray-900'
                              : 'bg-white border-gray-400 text-gray-900 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800')
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-gray-600 dark:text-gray-400">
            Rewrites {count('improve')} {count('improve') === 1 ? 'part' : 'parts'} ({asNumber(improveWords)} words) · keeps{' '}
            {count('keep')} as {count('keep') === 1 ? 'it is' : 'they are'} · leaves out {count('leave')}. A part kept
            as it is goes into the new page unchanged, in its place. A part left out is dropped.
          </p>
          {overLimit && (
            <p
              id="quick-words-in-use"
              aria-live="polite"
              className={stillOver ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}
            >
              In use: {asNumber(usedWords)} of {asNumber(maxWords)} words.
            </p>
          )}
        </fieldset>
      )}

      {brief.unsupportedLanguage && (
        <div role="alert" className="flex items-start gap-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-4">
          <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-warning" aria-hidden="true" />
          <p className="text-gray-900 dark:text-gray-100">
            This copy looks like it is written in {brief.unsupportedLanguage}. CopyZap can write in{' '}
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
            disabled={blocked !== null}
            className="inline-flex items-center justify-center min-h-[48px] px-8 bg-primary-500 hover:bg-primary-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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
        {blocked ? (
          <p role="alert" className="text-gray-900 dark:text-gray-100 font-semibold">
            {blocked}
          </p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Writes {QUICK_DEFAULT_VARIANTS} versions and scores them. Uses credits.
            {usedWords >= LONG_RUN_FROM_WORDS &&
              ` A page of this length takes about ${Math.round(usedWords / WORDS_PER_MINUTE)} minutes. Keep this tab open.`}
          </p>
        )}
      </div>
    </main>
  );
};

export default QuickConfirm;
