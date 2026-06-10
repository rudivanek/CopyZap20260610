import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Image } from 'lucide-react';
import HelpLayout from '../../HelpLayout';

const steps = [
  {
    n: 1,
    action: 'Open Copy Maker → click "Quick Setup Wizard"',
    detail: 'The wizard button sits at the top of the form.',
    img: 'Copy Maker form with Quick Setup Wizard button highlighted',
  },
  {
    n: 2,
    action: 'Select "Improve Existing Copy"',
    detail: 'First wizard step. Choose this when you have existing content to rewrite.',
    img: 'Wizard step 1 — Improve Existing Copy option selected',
  },
  {
    n: 3,
    action: 'Choose "Analyze URL"',
    detail: 'Skip manual pasting. CopyZap fetches and reads the page for you.',
    img: 'Wizard input method selector — Analyze URL chosen',
  },
  {
    n: 4,
    action: 'Paste the full page URL',
    detail: 'Use the exact URL of the specific page (include https://). Not just the homepage.',
    img: 'URL input field with a full page address entered',
    note: 'Use a product or service page — not a homepage. Focused pages produce far better results.',
  },
  {
    n: 5,
    action: 'Select "Deep Crawl"',
    detail: 'Extracts more content from the page. Takes 15–30 seconds longer — worth it.',
    img: 'Crawl depth selector — Deep Crawl highlighted',
  },
  {
    n: 6,
    action: 'Review the summary and click Generate',
    detail: 'CopyZap crawls the page, analyzes the copy, and rewrites it. Takes 20–40 seconds.',
    img: 'Wizard summary screen with Generate Output button ready',
  },
  {
    n: 7,
    action: 'Score and compare your result',
    detail: 'Click "Score Content" on the output card. Then generate an alternative and compare both.',
    img: 'Output card with rewritten copy and Score Content button visible',
  },
];

const ImproveFromURL: React.FC = () => {
  return (
    <HelpLayout
      title="Improve copy using a website URL"
      breadcrumbs={[
        { label: 'Tutorials', path: '/help/tutorials' },
        { label: 'Improve copy using a website URL' },
      ]}
    >
      <div className="space-y-8">

        {/* Outcome */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">You will</p>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Rewrite any live web page into optimized, higher-converting copy — without touching your design.
          </p>
        </div>

        {/* When to use this */}
        <div className="grid grid-cols-2 gap-2">
          {[
            'Your page is live but not converting',
            "You don't want to manually copy-paste content",
            "You're working on a client's site",
            'You need a quick rewrite to compare against the original',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <span className="text-green-500 text-xs font-bold mt-0.5 shrink-0">✓</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{item}</span>
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

        {/* What you get */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-600 dark:text-green-400 mb-2">Result</p>
          <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
            <li>Rewritten copy matched to the page's original purpose and audience</li>
            <li>A quality score to measure improvement</li>
            <li>Ready to paste into your CMS or page builder</li>
          </ul>
        </div>

        {/* Don't do these */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Avoid these</p>
          <ul className="space-y-1.5">
            {[
              'Using the homepage — use a focused product or service page instead',
              'Choosing Quick Scan — Deep Crawl produces noticeably better output',
              "Accepting the first output — generate an alternative and score both",
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
              { title: 'Compare versions & pick a winner', path: '/help/tutorials/compare-and-select' },
              { title: 'Generate your first output', path: '/help/tutorials/create-first-output' },
              { title: 'Turn on optional output features', path: '/help/optional-features' },
              { title: 'See all core workflows', path: '/help/core-workflows' },
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

export default ImproveFromURL;
