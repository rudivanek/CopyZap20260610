import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';

const CreditsAndBilling: React.FC = () => {
  return (
    <HelpLayout
      title="Credits & Billing"
      breadcrumbs={[{ label: 'Credits & Billing' }]}
    >
      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Overview</p>
        <p className="text-gray-700 dark:text-gray-300">Credits are the currency of CopyZap. Every AI generation consumes credits based on the AI model and features you use. Your credit balance is always visible in the top navigation bar.</p>
      </div>

      <h2>What Are Credits?</h2>
      <p>Credits are the internal currency that powers CopyZap. When you use AI to generate, improve, or analyze copy, you consume credits based on:</p>
      <ul>
        <li><strong>AI model selected:</strong> Different models have different costs (e.g., Claude Sonnet 4.5 vs GPT-3.5 Turbo)</li>
        <li><strong>Amount of content:</strong> Longer inputs and outputs consume more credits</li>
        <li><strong>Optional features enabled:</strong> SEO metadata, scoring, GEO optimization, and other features add to credit usage</li>
        <li><strong>Number of variants:</strong> Generating 5 variants consumes more credits than generating 1</li>
      </ul>

      <p className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-6">
        <strong>Note:</strong> Credits are your account balance. Every AI operation consumes credits based on the model used and the length of your content. You only need to track your credit balance — everything else is handled automatically.
      </p>

      <h2>Where Your Credit Balance Is Shown</h2>
      <p>Your current credit balance is always visible in the <strong>top navigation bar</strong> (next to your email address) when you're logged in.</p>

      <p><strong>What you'll see:</strong></p>
      <ul>
        <li><strong>Credits Remaining:</strong> Your current available balance</li>
        <li><strong>Color indicators:</strong>
          <ul>
            <li><span className="text-green-600 dark:text-green-400 font-semibold">Green:</span> Healthy balance (&gt;1000 credits)</li>
            <li><span className="text-yellow-600 dark:text-yellow-400 font-semibold">Yellow:</span> Low balance (100-1000 credits)</li>
            <li><span className="text-red-600 dark:text-red-400 font-semibold">Red:</span> Very low or depleted (&lt;100 credits)</li>
          </ul>
        </li>
      </ul>

      <h2>What Actions Consume Credits</h2>
      <p>Every AI-powered operation in CopyZap consumes credits. Here are the main actions:</p>

      <div className="not-prose space-y-4 mb-8">
        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-lg font-bold mb-2">Primary Generation (Copy Maker)</h3>
          <p className="text-gray-700 dark:text-gray-300">Generating new copy or improving existing copy in Copy Maker.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Typical cost:</strong> 50-300 credits depending on length and model</p>
        </div>

        <div className="border-l-4 border-purple-600 pl-4">
          <h3 className="text-lg font-bold mb-2">Multi-Variant Generation</h3>
          <p className="text-gray-700 dark:text-gray-300">Creating multiple versions in one generation (2-10 variants).</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Typical cost:</strong> 2-10x the base generation cost</p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <h3 className="text-lg font-bold mb-2">Alternative Copy</h3>
          <p className="text-gray-700 dark:text-gray-300">Generating alternative versions of existing output.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Typical cost:</strong> 40-250 credits per alternative</p>
        </div>

        <div className="border-l-4 border-yellow-600 pl-4">
          <h3 className="text-lg font-bold mb-2">Voice Style Application</h3>
          <p className="text-gray-700 dark:text-gray-300">Applying voice styles (Humanize, Alex Hormozi, Steve Jobs, etc.) to outputs.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Typical cost:</strong> 30-200 credits per style application</p>
        </div>

        <div className="border-l-4 border-orange-600 pl-4">
          <h3 className="text-lg font-bold mb-2">Optional Features</h3>
          <p className="text-gray-700 dark:text-gray-300">Each optional feature is a separate AI operation:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 mt-2">
            <li><strong>SEO Metadata Generation:</strong> 40-150 credits</li>
            <li><strong>Content Scoring:</strong> 20-80 credits</li>
            <li><strong>GEO Scoring:</strong> 30-100 credits</li>
            <li><strong>Headlines Generation:</strong> 25-90 credits</li>
            <li><strong>FAQ Schema:</strong> 30-100 credits</li>
          </ul>
        </div>

        <div className="border-l-4 border-red-600 pl-4">
          <h3 className="text-lg font-bold mb-2">Comparison & Analysis</h3>
          <p className="text-gray-700 dark:text-gray-300">Using Grok AI to compare and analyze multiple outputs.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Typical cost:</strong> 100-400 credits depending on number of outputs</p>
        </div>

        <div className="border-l-4 border-indigo-600 pl-4">
          <h3 className="text-lg font-bold mb-2">Workflows</h3>
          <p className="text-gray-700 dark:text-gray-300">Automated multi-step workflows consume credits for each step.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Typical cost:</strong> Sum of all individual step costs (150-600 credits for 3-5 step workflow)</p>
        </div>

        <div className="border-l-4 border-teal-600 pl-4">
          <h3 className="text-lg font-bold mb-2">Brand Voice Creation</h3>
          <p className="text-gray-700 dark:text-gray-300">Using AI to analyze copy or generate brand voice from description.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Typical cost:</strong> 40-150 credits per analysis</p>
        </div>
      </div>

      <h2>What Happens When Credits Reach 0</h2>
      <p>When your credit balance reaches zero or goes negative:</p>
      <ol>
        <li><strong>Generation is blocked:</strong> You cannot generate new copy, alternatives, or use any AI-powered features</li>
        <li><strong>Credit Limit modal appears:</strong> A modal displays your current balance and instructs you to contact support</li>
        <li><strong>Read-only access:</strong> You can still view saved outputs, templates, and settings, but cannot create new content</li>
        <li><strong>No grace period:</strong> There is no "buffer" or grace credits—once you hit 0, generation stops immediately</li>
      </ol>

      <div className="not-prose bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">⚠️ Important</p>
        <p className="text-gray-700 dark:text-gray-300">Contact support <strong>before</strong> your credits run out to ensure uninterrupted service. Check your balance regularly in the top navigation bar.</p>
      </div>

      <h2>Best Practices to Reduce Credit Use</h2>
      <div className="not-prose bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
        <ol className="list-decimal ml-4 space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Choose the right AI model:</strong> Use GPT-3.5 Turbo or Claude Haiku for simple tasks instead of more expensive models. Claude Sonnet 4.5 is the default for balanced quality and cost.
          </li>
          <li>
            <strong>Disable unused optional features:</strong> Don't enable SEO metadata, scoring, or GEO optimization unless you need them for that specific generation.
          </li>
          <li>
            <strong>Generate fewer variants:</strong> Start with 1-2 variants instead of 5-10. You can always generate more alternatives later if needed.
          </li>
          <li>
            <strong>Use "Replace Input" for iterations:</strong> Instead of regenerating from scratch, use the "Replace Input" button to improve existing copy (saves on repeated input processing).
          </li>
          <li>
            <strong>Write clear, concise inputs:</strong> Vague inputs often require regeneration. Be specific to get good results on the first try.
          </li>
          <li>
            <strong>Use templates:</strong> Templates save time and reduce trial-and-error generations by reusing proven configurations.
          </li>
          <li>
            <strong>Avoid unnecessary comparisons:</strong> Grok comparison is powerful but credit-intensive. Use it only when you truly need objective analysis of 3+ outputs.
          </li>
          <li>
            <strong>Test workflows before scaling:</strong> Test workflows on single generations before using them on every project to ensure they're worth the credit cost.
          </li>
        </ol>
      </div>

      <h2>Viewing Credit Usage History</h2>
      <p>To see detailed credit consumption:</p>
      <ol>
        <li>Navigate to <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">Dashboard</Link></li>
        <li>Click the <strong>Usage History</strong> tab</li>
        <li>View usage grouped by generation (primary generation + all related operations)</li>
        <li>Filter by date range to analyze patterns</li>
        <li>Export to CSV for detailed analysis</li>
      </ol>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
        <strong>Note:</strong> Usage History shows your credit consumption per generation. Your current balance is always visible in the top navigation bar.
      </p>

      <h2>Frequently Asked Questions</h2>

      <div className="not-prose space-y-4 mb-8">
        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Why did my credits decrease even though generation failed?</summary>
          <p className="mt-2 text-gray-700 dark:text-gray-300">If the AI API successfully processed your request but you didn't like the result, credits are still consumed. However, if there's a system error (API timeout, network failure), credits are NOT consumed.</p>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Can I see credit costs before generating?</summary>
          <p className="mt-2 text-gray-700 dark:text-gray-300">CopyZap does not show estimated costs before generation because actual usage depends on output length and AI model decisions. Check your balance regularly and contact support if you need a credit refill.</p>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Do credits expire?</summary>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Credit expiration depends on your subscription plan. Contact support for details about your specific account.</p>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">What uses NO credits?</summary>
          <p className="mt-2 text-gray-700 dark:text-gray-300">The following actions are free: viewing the dashboard, loading templates, creating brand voices manually (without AI), editing form fields, copying outputs to clipboard, exporting as HTML or Markdown, and switching modes.</p>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Why do some generations cost more than others?</summary>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Credit costs vary based on: (1) AI model chosen, (2) length of input and output, (3) optional features enabled, (4) number of variants requested, and (5) whether word count enforcement required revisions (automatic retry consumes additional credits).</p>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Can I pause my subscription?</summary>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Contact support for subscription management, pausing, or upgrading your plan.</p>
        </details>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link to="/help/dashboard-and-history" className="text-blue-600 dark:text-blue-400 hover:underline">View Dashboard & History</Link> to track your usage patterns</li>
        <li><Link to="/help/getting-started" className="text-blue-600 dark:text-blue-400 hover:underline">Getting Started</Link> to learn efficient generation workflows</li>
        <li><Link to="/help/workflow-builder" className="text-blue-600 dark:text-blue-400 hover:underline">Workflow Builder</Link> to understand workflow credit costs</li>
        <li><Link to="/help/troubleshooting" className="text-blue-600 dark:text-blue-400 hover:underline">Troubleshooting</Link> if you encounter credit or billing issues</li>
      </ul>

      <hr className="my-8" />

      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2026-01-31</p>
    </HelpLayout>
  );
};

export default CreditsAndBilling;
