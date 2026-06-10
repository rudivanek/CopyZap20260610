import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Image } from 'lucide-react';
import HelpLayout from '../../HelpLayout';

const steps = [
  {
    n: 1,
    action: 'Generate your first output',
    detail: 'You need at least one output card before you can compare.',
    img: 'Single output card below the Copy Maker form',
  },
  {
    n: 2,
    action: 'Generate at least one alternative',
    detail: 'Click "Create Alternative Copy" on the output card. Repeat for a third. More versions = better analysis.',
    img: 'Two output cards visible, Create Alternative Copy button highlighted',
    note: 'Apply a voice style (e.g. Ogilvy, Hormozi) to one version for maximum contrast in the comparison.',
  },
  {
    n: 3,
    action: 'Click "Compare All Outputs"',
    detail: 'Appears in the results bar when you have 2+ output cards. Analyzes every card currently visible.',
    img: 'Compare All Outputs button in the results action bar',
  },
  {
    n: 4,
    action: 'Read the comparison card',
    detail: 'Shows: ranked winner, per-version scores (Conversion / Trust / Risk), and written analysis for each version.',
    img: 'Comparison card with winner highlighted, score breakdown, and written analysis',
  },
  {
    n: 5,
    action: 'Understand the scores',
    detail: 'Conversion = drives action. Trust = sounds credible. Risk = flags over-promises or vague claims.',
    img: 'Score breakdown showing Conversion, Trust, and Risk per version',
  },
  {
    n: 6,
    action: 'Pick your winner and export',
    detail: 'Use the winning output card. Click "Copy to Clipboard" or export as PDF / DOCX / Markdown.',
    img: 'Winning output card with Copy and Export buttons',
  },
];

const CompareAndSelect: React.FC = () => {
  return (
    <HelpLayout
      title="Compare versions & pick a winner"
      breadcrumbs={[
        { label: 'Tutorials', path: '/help/tutorials' },
        { label: 'Compare versions & pick a winner' },
      ]}
    >
      <div className="space-y-8">

        {/* Outcome */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">You will</p>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Score multiple copy versions on Conversion, Trust, and Risk — and pick the best one with a written explanation.
          </p>
        </div>

        {/* Score legend */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Conversion', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', desc: 'Drives action' },
            { label: 'Trust', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', desc: 'Sounds credible' },
            { label: 'Risk', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', desc: 'Flags problems' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg p-3 ${s.bg}`}>
              <p className={`text-xs font-bold ${s.color}`}>{s.label}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Steps */}
        <section>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-4">
                <div className="shrink-0 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-bold mt-0.5">
                  {step.n}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.action}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{step.detail}</p>
                  {step.note && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-2.5 py-1.5 mt-2">
                      {step.note}
                    </p>
                  )}
                  <div className="mt-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2.5 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                    <Image className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400 italic">{step.img}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Important note */}
        <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Comparisons are snapshots</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            A comparison card only includes the outputs that existed when you clicked the button. Add new versions after? Click "Compare All Outputs" again — a new card is created, the old one stays.
          </p>
        </div>

        {/* What you get */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-600 dark:text-green-400 mb-2">Result</p>
          <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
            <li>Ranked list of all versions with per-metric scores</li>
            <li>Written AI analysis explaining each ranking decision</li>
            <li>A clear recommendation you can act on or share with a client</li>
          </ul>
        </div>

        {/* Don't do these */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Avoid these</p>
          <ul className="space-y-1.5">
            {[
              'Comparing only 2 versions — 3 or 4 gives much more useful signal',
              'Ignoring the Risk score — a high-conversion version with high risk can backfire in production',
              'Skipping the written analysis — it often reveals a simple fix that makes the winner even stronger',
            ].map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Up next */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Up next</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { title: 'Export as PDF, DOCX, or Markdown', path: '/help/export-management' },
              { title: 'Apply a voice style to a version', path: '/help/voice-styles-and-blending' },
              { title: 'Use the evaluation tools in depth', path: '/help/compare-blend' },
              { title: 'Generate your first output', path: '/help/tutorials/create-first-output' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group"
              >
                <span>{link.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

      </div>
    </HelpLayout>
  );
};

export default CompareAndSelect;
