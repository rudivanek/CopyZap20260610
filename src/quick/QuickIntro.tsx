import React from 'react';
import { HELP_STEPS } from './helpContent';

/**
 * How it works, in three steps. Shown once, the first time a user arrives.
 * The same steps open the help page, which "Help" in the top bar shows.
 */

interface QuickIntroProps {
  onClose: () => void;
}

const QuickIntro: React.FC<QuickIntroProps> = ({ onClose }) => (
  <section
    id="quick-intro"
    aria-label="How it works"
    className="max-w-3xl mx-auto px-4 sm:px-6 pt-8"
  >
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-5 sm:p-6 flex flex-col gap-4">
      <h2 className="text-gray-900 dark:text-white">How it works</h2>
      <ol className="flex flex-col gap-3">
        {HELP_STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="shrink-0 w-7 h-7 inline-flex items-center justify-center bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold tabular-nums"
            >
              {index + 1}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{step.title}</span>
              <span className="text-gray-600 dark:text-gray-400">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-gray-600 dark:text-gray-400">
        CopyZap improves copy you already have; it does not write a page from nothing. Each run uses credits, and
        every result is saved under History.
      </p>
      <div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center min-h-[44px] px-6 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium hover:border-gray-900 dark:hover:border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Got it
        </button>
      </div>
    </div>
  </section>
);

export default QuickIntro;
