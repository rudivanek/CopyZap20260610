import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Image } from 'lucide-react';
import HelpLayout from '../../HelpLayout';

const steps = [
  {
    n: 1,
    action: 'Open Copy Maker',
    detail: 'Log in → click Copy Maker in the main menu.',
    img: 'Copy Maker in main nav, highlighted',
  },
  {
    n: 2,
    action: 'Click "Quick Setup Wizard"',
    detail: 'Top of the form. A guided modal opens.',
    img: 'Quick Setup Wizard button at top of Copy Maker form',
  },
  {
    n: 3,
    action: 'Describe your business and audience',
    detail: 'Be specific. "Project management tool for small agencies" beats "software company."',
    img: 'Wizard step 1 — business and audience fields',
  },
  {
    n: 4,
    action: 'Choose a tone',
    detail: 'Pick one that fits: Professional, Conversational, Bold. You can pick more than one.',
    img: 'Tone selector with options visible',
  },
  {
    n: 5,
    action: 'Set your goal and word count',
    detail: 'Choose what copy should do (Persuade / Inform / Educate). Set 150–250 words to start.',
    img: 'Goal selector and word count input',
  },
  {
    n: 6,
    action: 'Review the summary and click Generate',
    detail: 'Scan the auto-filled fields. Adjust anything that looks wrong. Hit Generate Output.',
    img: 'Wizard summary with Generate Output button',
    note: 'You can edit any field after the wizard — it is a starting point, not locked in.',
  },
  {
    n: 7,
    action: 'Read your output',
    detail: 'Copy appears below the form as a card. It includes the text, a quality score, and action buttons.',
    img: 'Output card with copy, score badge, and action buttons',
  },
];

const CreateFirstOutput: React.FC = () => {
  return (
    <HelpLayout
      title="Generate your first output"
      breadcrumbs={[
        { label: 'Tutorials', path: '/help/tutorials' },
        { label: 'Generate your first output' },
      ]}
    >
      <div className="space-y-8">

        {/* Outcome */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">You will</p>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Generate professional marketing copy in under 2 minutes using the Quick Prompt Wizard.
          </p>
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

        {/* What you get */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-600 dark:text-green-400 mb-2">Result</p>
          <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
            <li>A complete first draft with a quality score (0–100)</li>
            <li>Action buttons to generate an alternative, apply a voice style, or score further</li>
            <li>A saved session in your dashboard</li>
          </ul>
        </div>

        {/* Don't do these */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Avoid these</p>
          <ul className="space-y-1.5">
            {[
              'Describing your business too broadly — the more specific, the better the output',
              'Leaving audience blank — it is the biggest single driver of output quality',
              'Treating the first output as final — generate an alternative and compare',
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
              { title: 'Improve copy using a website URL', path: '/help/tutorials/improve-from-url' },
              { title: 'Compare versions & pick a winner', path: '/help/tutorials/compare-and-select' },
              { title: 'Apply a voice style', path: '/help/voice-styles-and-blending' },
              { title: 'Save as a template', path: '/help/setup-and-inputs' },
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

export default CreateFirstOutput;
