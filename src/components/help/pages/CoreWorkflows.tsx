import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Image } from 'lucide-react';
import HelpLayout from '../HelpLayout';

const CoreWorkflows: React.FC = () => {
  return (
    <HelpLayout
      title="Core Workflows"
      breadcrumbs={[{ label: 'Core Workflows' }]}
    >
      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">TL;DR</p>
        <p className="text-gray-700 dark:text-gray-300">CopyZap has five core workflows: Create New Copy, Improve Existing Copy, Generate Alternatives, Apply Brand Voice, and Compare &amp; Blend Outputs. Master these to get maximum value.</p>
      </div>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Use this when:</p>
          <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>You need to create, improve, or compare copy</li>
            <li>You want consistent brand voice across content</li>
            <li>You're looking for proven workflow patterns</li>
          </ul>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-400 mb-2">What you'll get:</p>
          <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>5 proven workflows for different copywriting tasks</li>
            <li>Step-by-step walkthroughs with tutorials</li>
            <li>Real-world examples for common scenarios</li>
          </ul>
        </div>
      </div>

      {/* ─── SECTION 1: Create New Copy ───────────────────────────────── */}
      <h2>Workflow 1: Create New Copy</h2>
      <p><strong>When to use:</strong> Starting from scratch. You have no existing copy.</p>

      <div className="not-prose bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">Step-by-Step</h3>
        <ol className="list-decimal ml-6 space-y-3 text-gray-700 dark:text-gray-300">
          <li>Select <strong>Create</strong> mode at the top</li>
          <li>Fill required fields:
            <ul className="list-disc ml-6 mt-2">
              <li>Project Description (internal name)</li>
              <li>Product/Service Name</li>
              <li>Business Description (be specific about what you offer and who it's for)</li>
            </ul>
          </li>
          <li>Add recommended fields:
            <ul className="list-disc ml-6 mt-2">
              <li>Target Audience</li>
              <li>Key Message</li>
              <li>Call to Action</li>
              <li>Tone</li>
            </ul>
          </li>
          <li>Set Word Count (Short: 50-100, Medium: 100-200, Long: 200-400)</li>
          <li>Click <strong>Generate</strong> to create your first version</li>
        </ol>
      </div>

      <div className="not-prose bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">Pro Tip</p>
        <p className="text-gray-700 dark:text-gray-300">The more detailed your Business Description, the better your output. Include: who you serve, what problem you solve, what makes you different, and key benefits.</p>
      </div>

      <div className="not-prose bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">Tutorial: Generate your first output</p>
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">7-step walkthrough using the Quick Prompt Wizard to generate professional copy in under 2 minutes.</p>
        <div className="space-y-3 mt-3">
          {[
            { n: 1, action: 'Open Copy Maker', detail: 'Log in → click Copy Maker in the main menu.' },
            { n: 2, action: 'Click "Quick Setup Wizard"', detail: 'Top of the form. A guided modal opens.' },
            { n: 3, action: 'Describe your business and audience', detail: 'Be specific. "Project management tool for small agencies" beats "software company."' },
            { n: 4, action: 'Choose a tone', detail: 'Pick one that fits: Professional, Conversational, Bold. You can pick more than one.' },
            { n: 5, action: 'Set your goal and word count', detail: 'Choose what copy should do (Persuade / Inform / Educate). Set 150–250 words to start.' },
            { n: 6, action: 'Review the summary and click Generate', detail: 'Scan the auto-filled fields. Adjust anything that looks wrong. Click Generate.' },
            { n: 7, action: 'Read your output', detail: 'Copy appears below the form as a card. It includes the text and action buttons. Click Score on the card to evaluate quality.' },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <div className="shrink-0 w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-bold mt-0.5">
                {step.n}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Note: You can edit any field after the wizard — it is a starting point, not locked in.</p>
      </div>

      {/* ─── SECTION 2: Improve Existing Copy ────────────────────────── */}
      <h2>Workflow 2: Improve Existing Copy</h2>
      <p><strong>When to use:</strong> You already have copy but want to make it better.</p>

      <div className="not-prose bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">Step-by-Step</h3>
        <ol className="list-decimal ml-6 space-y-3 text-gray-700 dark:text-gray-300">
          <li>Select <strong>Improve</strong> mode at the top</li>
          <li>Fill required fields:
            <ul className="list-disc ml-6 mt-2">
              <li>Project Description</li>
              <li>Product/Service Name</li>
              <li>Original Copy (paste your existing content)</li>
            </ul>
          </li>
          <li>Specify what to improve:
            <ul className="list-disc ml-6 mt-2">
              <li>Use <strong>Key Message</strong> to clarify main point</li>
              <li>Use <strong>Tone</strong> to change style</li>
              <li>Use <strong>Special Instructions</strong> to be explicit (e.g., "Make it more concise" or "Add more urgency")</li>
            </ul>
          </li>
          <li>Click <strong>Generate</strong> to create your first version</li>
        </ol>
      </div>

      <div className="not-prose bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Common Mistake</p>
        <p className="text-gray-700 dark:text-gray-300">Don't paste copy and expect magic without guidance. Tell the AI <em>what</em> to improve using the Special Instructions field.</p>
      </div>

      <div className="not-prose bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">Tutorial: Improve copy from a URL</p>
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Use the Quick Prompt Wizard to extract and improve copy from a live website.</p>
        <div className="space-y-3 mt-3">
          {[
            { n: 1, action: 'Open the Quick Prompt Wizard', detail: 'Click the wizard button at the top of Copy Maker.' },
            { n: 2, action: 'Select "Improve Existing Copy"', detail: 'Choose this mode at the top of the wizard.' },
            { n: 3, action: 'Enter the URL to analyze', detail: 'Paste the full web address (https://...). The analyzer will extract the copy.' },
            { n: 4, action: 'Choose crawl depth', detail: 'Quick Scan is faster; Deep Crawl captures more content.' },
            { n: 5, action: 'Review the extracted content', detail: 'Check the copy pulled from the URL. Adjust what to focus on.' },
            { n: 6, action: 'Generate improved copy', detail: 'Click Generate. Your improved output appears as an output card.' },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <div className="shrink-0 w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-bold mt-0.5">
                {step.n}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 3: Generate Alternatives ────────────────────────── */}
      <h2>Workflow 3: Generate Alternatives</h2>
      <p><strong>When to use:</strong> You have one version but want different options or approaches.</p>

      <div className="not-prose bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">Two Ways to Generate Alternatives</h3>

        <div className="mb-6">
          <h4 className="font-bold mb-2">Method 1: During Initial Generation</h4>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Before clicking Generate, scroll to Optional Features section</li>
            <li>Enable <strong>Create Variants</strong> toggle</li>
            <li>Set <strong>Number of Variants</strong> (2-10)</li>
            <li>Click Generate → all variants appear together</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold mb-2">Method 2: After Generation (On-Demand)</h4>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Generate your first output normally</li>
            <li>Look at the output card</li>
            <li>Click <strong>Create Alternative Copy</strong> button</li>
            <li>New alternative appears as separate output card</li>
            <li>Repeat as needed</li>
          </ol>
        </div>
      </div>

      <p><strong>What's the difference?</strong> Each alternative uses a different angle or structure while maintaining the core message. Think of it as A/B test variations.</p>

      {/* ─── SECTION 4: Compare & Select ─────────────────────────────── */}
      <h2>Workflow 4: Compare &amp; Select</h2>
      <p><strong>When to use:</strong> You have 2+ versions and want to pick the best one objectively.</p>

      <div className="not-prose bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">Tutorial: Compare versions &amp; pick a winner</p>
        <div className="space-y-3 mt-3">
          {[
            { n: 1, action: 'Generate 2+ versions', detail: 'Use Create Alternative Copy to add versions, or apply a voice style (e.g., Ogilvy, Hormozi) to an existing output.' },
            { n: 2, action: 'Click "Compare All Outputs"', detail: 'This button appears in the results bar when you have multiple output cards.' },
            { n: 3, action: 'Review the comparison', detail: 'Each version is scored on Conversion, Trust, and Risk. A ranked winner is shown with a written AI analysis.' },
            { n: 4, action: 'Pick your version', detail: 'The comparison is a snapshot — your original cards remain. Copy or export whichever version wins.' },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <div className="shrink-0 w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-bold mt-0.5">
                {step.n}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 5: Brand Voice ───────────────────────────────────── */}
      <h2>Workflow 5: Apply Brand Voice</h2>
      <p><strong>When to use:</strong> Maintaining consistent style across all content, especially for agencies managing multiple clients.</p>

      <div className="not-prose bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">Setup (One-Time)</h3>
        <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Open Copy Maker</li>
          <li>Create a <strong>Customer</strong> (the client or brand)</li>
          <li>Create a <strong>Brand Voice</strong> for that customer:
            <ul className="list-disc ml-6 mt-2">
              <li><strong>Option A:</strong> Paste existing copy → AI analyzes and extracts voice</li>
              <li><strong>Option B:</strong> Describe the brand → AI generates voice profile</li>
            </ul>
          </li>
        </ol>

        <h3 className="font-bold text-lg mb-4 mt-6">Usage (Every Generation)</h3>
        <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Select your <strong>Customer</strong> from dropdown</li>
          <li>Select associated <strong>Brand Voice</strong></li>
          <li>Fill form and generate normally</li>
          <li>All outputs automatically match brand voice</li>
        </ol>
      </div>

      <p><strong>What Brand Voice includes:</strong> Personality traits, tone style, sentence style, preferred vocabulary, forbidden terms, punctuation rules, and advanced style controls (formality, rhythm, POV, etc.).</p>

      {/* ─── SECTION 6: Real Workflow Examples ───────────────────────── */}
      <hr className="my-8" />
      <h2>Real Workflow Examples</h2>
      <p>Learn proven workflows for different content types and copywriting scenarios.</p>

      <div className="not-prose space-y-4 mb-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">New Project from Scratch</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Click "Quick Wizard" for guided setup</li>
            <li>Answer questions about your project</li>
            <li>Review and adjust filled fields</li>
            <li>Generate initial copy</li>
            <li>Refine based on results</li>
            <li>Save as template for similar projects</li>
          </ol>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Improving Existing Copy</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Paste existing copy into Original Copy field</li>
            <li>Select "Improve" mode</li>
            <li>Specify what to improve (clarity, engagement, etc.)</li>
            <li>Generate improved version</li>
            <li>Compare original vs improved</li>
            <li>Use blend feature to combine best of both</li>
          </ol>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">A/B Testing Content</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Generate main copy with base settings</li>
            <li>Generate 2-3 alternatives with different approaches</li>
            <li>Apply different voice styles to each</li>
            <li>Score all versions</li>
            <li>Select top 2 for A/B testing</li>
            <li>Export both versions</li>
          </ol>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Agency Workflow</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Select Customer → apply Brand Voice</li>
            <li>Create new copy</li>
            <li>Generate 3 alternatives</li>
            <li>Compare &amp; blend best elements</li>
            <li>Apply final polish with voice style</li>
          </ol>
        </div>
      </div>

      <div className="not-prose bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Try this now:</p>
        <div className="space-y-2">
          <Link to="/" className="block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Go to Copy Maker →</Link>
          <p className="text-xs text-gray-600 dark:text-gray-400">Practice one of these workflows to see results</p>
        </div>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link to="/help/setup-and-inputs" className="text-blue-600 dark:text-blue-400 hover:underline">Set up Brand Voice and Templates</Link></li>
        <li><Link to="/help/optional-features" className="text-blue-600 dark:text-blue-400 hover:underline">Explore optional features</Link> (SEO, GEO, scoring)</li>
        <li><Link to="/help/how-scoring-works" className="text-blue-600 dark:text-blue-400 hover:underline">Understand scoring and comparison</Link></li>
      </ul>

      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2026-04-17</p>
    </HelpLayout>
  );
};

export default CoreWorkflows;
