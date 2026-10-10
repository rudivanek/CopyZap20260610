import React from 'react';
import { HELP_SECTIONS, HELP_STEPS } from './helpContent';

/**
 * The help page: the three steps, then one section per thing a user meets.
 * Opened with "Help" in the top bar. It lies over whatever the user was doing
 * and gives it back unchanged when closed.
 */

interface QuickHelpProps {
  onClose: () => void;
  /** What "Back" returns to, in words: "your result", "the start", ... */
  backTo: string;
}

const card = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700';
const backButton =
  'inline-flex items-center justify-center min-h-[44px] px-6 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 font-medium hover:border-gray-900 dark:hover:border-gray-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';

/** The step-by-step guide on the home site. Opens in a new tab. */
const GUIDE_URL = 'https://copyzap.app/help/';
/** Help section id -> the part of the guide that covers it. Sections not listed have no matching part. */
const GUIDE_ANCHORS: Record<string, string> = {
  copy: 'copy',
  check: 'check',
  score: 'result',
  after: 'change',
  credits: 'credits',
  trouble: 'problems',
};
const guideLink =
  'inline-flex items-center self-start min-h-[44px] text-gray-900 dark:text-gray-100 underline hover:text-primary-800 dark:hover:text-primary-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';

const QuickHelp: React.FC<QuickHelpProps> = ({ onClose, backTo }) => {
  const jumpTo = (id: string) =>
    document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <main id="quick-help" className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-gray-900 dark:text-white">Help</h1>
          <p className="text-gray-600 dark:text-gray-400">How CopyZap works, and what each thing on the screen means.</p>
          <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer" className={guideLink}>
            Open the step-by-step guide with screenshots (new tab)
          </a>
        </div>
        <button type="button" onClick={onClose} className={backButton}>
          Back to {backTo}
        </button>
      </div>

      <section aria-label="How it works" className={`${card} p-5 sm:p-6 flex flex-col gap-4`}>
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
      </section>

      <nav aria-label="Help topics" className="flex flex-wrap gap-x-4 gap-y-1">
        {HELP_SECTIONS.map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => jumpTo(section.id)}
            className="inline-flex items-center min-h-[44px] text-gray-900 dark:text-gray-100 underline hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {section.title}
          </button>
        ))}
      </nav>

      {HELP_SECTIONS.map(section => (
        <section
          key={section.id}
          id={`help-${section.id}`}
          aria-label={section.title}
          className={`${card} p-5 sm:p-6 flex flex-col gap-3 scroll-mt-4`}
        >
          <h2 className="text-gray-900 dark:text-white">{section.title}</h2>
          {section.intro && <p className="text-gray-600 dark:text-gray-400">{section.intro}</p>}
          <dl className="flex flex-col gap-3">
            {section.items.map((item, index) => (
              <div key={index} className="flex flex-col gap-0.5">
                {item.term && <dt className="font-semibold text-gray-900 dark:text-gray-100">{item.term}</dt>}
                <dd className="text-gray-700 dark:text-gray-300">{item.text}</dd>
              </div>
            ))}
          </dl>
          {GUIDE_ANCHORS[section.id] && (
            <a
              href={`${GUIDE_URL}#${GUIDE_ANCHORS[section.id]}`}
              target="_blank"
              rel="noopener noreferrer"
              className={guideLink}
            >
              See this in the step-by-step guide (new tab)
            </a>
          )}
        </section>
      ))}

      <div>
        <button type="button" onClick={onClose} className={backButton}>
          Back to {backTo}
        </button>
      </div>
    </main>
  );
};

export default QuickHelp;
