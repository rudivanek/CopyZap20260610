import React from 'react';
import type { MissingFactQuestion } from '../engine/missingFacts';
import { USER_FACT_MAX_CHARS } from '../engine/missingFacts';
import { FactAnswers, factsFromAnswers, OTHER_FACT_KEY, unfinishedAnswers } from './factAnswers';
import { TIPS } from './tips';
import GrowingField from './GrowingField';

/**
 * "Make it stronger" on the check screen: up to three questions about what the
 * copy is missing (see engine/missingFacts.ts), each with one answer field and
 * an example answer inside it, and one field for anything else that is true.
 * Everything is optional.
 */
interface QuickMissingFactsProps {
  /** null while Quick is still looking. Empty: nothing important is missing, only "anything else" is shown. */
  questions: MissingFactQuestion[] | null;
  answers: FactAnswers;
  onAnswersChange: (answers: FactAnswers) => void;
}

const FIELD =
  'w-full min-h-[44px] px-3.5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
const LABEL = 'font-semibold text-gray-900 dark:text-gray-100';

const QuickMissingFacts: React.FC<QuickMissingFactsProps> = ({ questions, answers, onAnswersChange }) => {
  const asked = questions ?? [];
  const used = factsFromAnswers(asked, answers).length;
  const unfinished = unfinishedAnswers(asked, answers);
  const setAnswer = (key: string, value: string) => onAnswersChange({ ...answers, [key]: value });

  return (
    <section
      aria-labelledby="quick-facts-title"
      aria-busy={questions === null}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-5 py-4 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="quick-facts-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Make it stronger <span className="font-normal text-gray-600 dark:text-gray-400">(optional)</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {questions !== null && questions.length === 0
            ? 'CopyZap found nothing important missing. If something true should be in the copy, add it below.'
            : 'Your copy is missing a few things that help people act. CopyZap never invents them.'}{' '}
          Answer only what is true for you, with your own figures and currency; anything you write goes into the new
          versions.
        </p>
      </div>

      {questions === null && (
        <p className="text-gray-600 dark:text-gray-400" aria-live="polite">
          Looking for what is missing… You can generate without waiting.
        </p>
      )}

      {asked.map((question, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <label htmlFor={`quick-fact-${index}`} className={LABEL}>
            {question.question}
          </label>
          {/* Grows with the text, like "Selling" and "For" above: an answer can be a long sentence. */}
          <GrowingField
            id={`quick-fact-${index}`}
            value={answers[String(index)] ?? ''}
            maxLength={USER_FACT_MAX_CHARS}
            onChange={value => setAnswer(String(index), value)}
            placeholder={question.example ? `e.g. ${question.example}` : 'Your answer'}
            tip={TIPS.factAnswer}
            className={FIELD}
          />
        </div>
      ))}

      {/* For facts CopyZap did not ask about. Changes of style belong in "What should change?" on the result. */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quick-fact-other" className={LABEL}>
          Anything else that is true and should be in the copy?
        </label>
        <GrowingField
          id="quick-fact-other"
          value={answers[OTHER_FACT_KEY] ?? ''}
          maxLength={USER_FACT_MAX_CHARS}
          onChange={value => setAnswer(OTHER_FACT_KEY, value)}
          placeholder="e.g. a service, an award, a language you work in"
          tip={TIPS.factOther}
          className={FIELD}
        />
      </div>

      <p className="text-gray-600 dark:text-gray-400" aria-live="polite">
        {used === 0
          ? 'Nothing added: CopyZap uses only what your copy says.'
          : `${used} ${used === 1 ? 'fact' : 'facts'} added. The new versions use ${used === 1 ? 'it' : 'them'} as you wrote ${used === 1 ? 'it' : 'them'}.`}
        {unfinished > 0 &&
          ` ${unfinished} ${unfinished === 1 ? 'answer still has' : 'answers still have'} a blank (___) and ${unfinished === 1 ? 'is' : 'are'} not used.`}
      </p>
    </section>
  );
};

export default QuickMissingFacts;
