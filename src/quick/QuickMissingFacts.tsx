import React from 'react';
import type { MissingFactQuestion } from '../engine/missingFacts';
import { USER_FACT_MAX_CHARS } from '../engine/missingFacts';
import SquareCheck from './SquareCheck';
import {
  EMPTY_FACT_ANSWER,
  FactAnswer,
  FactAnswers,
  factsFromAnswers,
  suggestionPieces,
  unfinishedPicks,
} from './factAnswers';
import { TIPS } from './tips';

/**
 * "Make it stronger" on the check screen: up to three questions about what the
 * copy is missing (see engine/missingFacts.ts), each with suggestions to tick
 * and a line for the user's own words. Everything is optional.
 */
interface QuickMissingFactsProps {
  /** null while Quick is still looking. */
  questions: MissingFactQuestion[] | null;
  answers: FactAnswers;
  onAnswersChange: (answers: FactAnswers) => void;
}

const BLANK_FIELD =
  'inline-block w-24 min-h-[32px] mx-1 px-2 align-baseline bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500';
const OWN_FIELD =
  'w-full min-h-[40px] px-3 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';

const QuickMissingFacts: React.FC<QuickMissingFactsProps> = ({ questions, answers, onAnswersChange }) => {
  if (questions !== null && questions.length === 0) return null;

  const answerOf = (index: number): FactAnswer => answers[index] ?? EMPTY_FACT_ANSWER;
  const update = (index: number, answer: FactAnswer) => onAnswersChange({ ...answers, [index]: answer });

  const setTicked = (index: number, pick: number, on: boolean) => {
    const answer = answerOf(index);
    const ticked = on ? [...new Set([...answer.ticked, pick])] : answer.ticked.filter(item => item !== pick);
    update(index, { ...answer, ticked });
  };
  // Typing into a blank ticks its suggestion: the user clearly means it.
  const setBlank = (index: number, pick: number, blank: number, value: string) => {
    const answer = answerOf(index);
    const values = [...(answer.blanks[pick] ?? [])];
    values[blank] = value;
    const ticked = value.trim() && !answer.ticked.includes(pick) ? [...answer.ticked, pick] : answer.ticked;
    update(index, { ...answer, ticked, blanks: { ...answer.blanks, [pick]: values } });
  };

  const used = questions ? factsFromAnswers(questions, answers).length : 0;
  const unfinished = questions ? unfinishedPicks(questions, answers) : 0;

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
          Your copy is missing a few things that help people act. CopyZap never invents them. Tick or fill in only what
          is true for you; anything you add goes into the new versions.
        </p>
      </div>

      {questions === null ? (
        <p className="text-gray-600 dark:text-gray-400" aria-live="polite">
          Looking for what is missing… You can generate without waiting.
        </p>
      ) : (
        questions.map((question, index) => {
          const answer = answerOf(index);
          return (
            <fieldset key={index} className="m-0 p-0 border-0 flex flex-col gap-0.5">
              <legend className="p-0 mb-1 font-semibold text-gray-900 dark:text-gray-100">{question.question}</legend>
              {question.suggestions.map((suggestion, pick) => {
                const pieces = suggestionPieces(suggestion);
                const values = answer.blanks[pick] ?? [];
                return (
                  <SquareCheck
                    key={pick}
                    checked={answer.ticked.includes(pick)}
                    onChange={on => setTicked(index, pick, on)}
                    tip={pieces.length > 1 ? TIPS.factBlank : TIPS.factTick}
                  >
                    <span className="text-gray-900 dark:text-gray-100">
                      {pieces.map((piece, part) => (
                        <React.Fragment key={part}>
                          {piece}
                          {part < pieces.length - 1 && (
                            <input
                              type="text"
                              value={values[part] ?? ''}
                              onChange={event => setBlank(index, pick, part, event.target.value)}
                              aria-label={`Fill in: ${suggestion}`}
                              maxLength={60}
                              className={BLANK_FIELD}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                  </SquareCheck>
                );
              })}
              <label className="mt-1 flex flex-col gap-1">
                <span className="sr-only">Your own words for: {question.question}</span>
                <input
                  type="text"
                  value={answer.own}
                  maxLength={USER_FACT_MAX_CHARS}
                  onChange={event => update(index, { ...answer, own: event.target.value })}
                  placeholder="Or in your own words"
                  data-tip={TIPS.factOwn}
                  className={OWN_FIELD}
                />
              </label>
            </fieldset>
          );
        })
      )}

      {questions !== null && (
        <p className="text-gray-600 dark:text-gray-400" aria-live="polite">
          {used === 0
            ? 'Nothing added: CopyZap uses only what your copy says.'
            : `${used} ${used === 1 ? 'fact' : 'facts'} added. The new versions use ${used === 1 ? 'it' : 'them'} as you wrote ${used === 1 ? 'it' : 'them'}.`}
          {unfinished > 0 &&
            ` ${unfinished} ticked ${unfinished === 1 ? 'line has' : 'lines have'} an empty blank and ${unfinished === 1 ? 'is' : 'are'} not used.`}
        </p>
      )}
    </section>
  );
};

export default QuickMissingFacts;
