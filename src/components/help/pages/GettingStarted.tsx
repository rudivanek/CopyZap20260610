import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';

const GettingStarted: React.FC = () => {
  return (
    <HelpLayout
      title="Getting Started with CopyZap"
      breadcrumbs={[{ label: 'Getting Started' }]}
    >
      {/* ─── SECTION: What is CopyZap ─────────────────────────────────── */}
      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Start</p>
        <p className="text-gray-700 dark:text-gray-300">CopyZap helps you create and improve marketing copy using AI. Fill out a few fields, click Generate, and get professional copy in seconds.</p>
      </div>

      <h2>What is CopyZap?</h2>
      <p>CopyZap is an AI-powered platform for creating marketing copy. The main tool is called <strong>Copy Maker</strong>, which generates copy based on your inputs.</p>

      <p><strong>What makes it different:</strong></p>
      <ul>
        <li><strong>Structured inputs:</strong> Fill specific fields instead of writing prompts</li>
        <li><strong>Consistent results:</strong> Same inputs = same quality</li>
        <li><strong>Brand voice:</strong> Save voice guidelines and apply them automatically</li>
        <li><strong>Templates:</strong> Save configurations and reuse them</li>
      </ul>

      <h2>When to Use CopyZap</h2>
      <p>Use CopyZap when you need to:</p>
      <ul>
        <li>Create new marketing copy from scratch (landing pages, emails, ads)</li>
        <li>Improve existing copy (make it clearer, more persuasive, better tone)</li>
        <li>Generate multiple variations for A/B testing</li>
        <li>Maintain consistent brand voice across all content</li>
        <li>Generate SEO metadata (meta descriptions, headings, OG tags)</li>
      </ul>

      <h2>Your First Generation: Step-by-Step</h2>

      <div className="not-prose space-y-6 mb-8">
        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 1: Choose Create or Improve</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2">At the top of Copy Maker, you'll see two options:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300">
            <li><strong>Create:</strong> Generate entirely new copy from a business description</li>
            <li><strong>Improve:</strong> Enhance existing copy you already have</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2"><strong>→ Choose based on what you have:</strong> If you're starting from scratch, pick Create. If you have a draft, pick Improve.</p>
        </div>

        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 2: Configure Your Inputs</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2">Copy Maker shows all available fields. Fill in the required fields and add optional details to improve results. You don't need to fill every field — start with the essentials and add more as needed.</p>
        </div>

        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 3: Fill Required Fields</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2">Three fields are always required:</p>
          <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-300 space-y-2">
            <li><strong>Project Description:</strong> Internal name (e.g., "Homepage Hero" or "Email Campaign Q4")</li>
            <li><strong>Product/Service Name:</strong> What you're promoting (e.g., "Acme CRM Software")</li>
            <li><strong>Business Description</strong> (Create mode) or <strong>Original Copy</strong> (Improve mode): Your main content</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2"><strong>Tip:</strong> The more specific you are in Business Description, the better your output.</p>
        </div>

        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 4: Optional Fields (Recommended)</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2">These aren't required but significantly improve results:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li><strong>Target Audience:</strong> Who is this for? (e.g., "B2B SaaS founders")</li>
            <li><strong>Key Message:</strong> Main point (e.g., "Save 10 hours per week")</li>
            <li><strong>Call to Action:</strong> What action to take (e.g., "Start free trial")</li>
            <li><strong>Tone:</strong> Professional, Friendly, Bold, etc.</li>
            <li><strong>Word Count:</strong> Target length (Short: 50-100, Medium: 100-200, Long: 200-400)</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 5: Click Generate</h3>
          <p className="text-gray-700 dark:text-gray-300">Click the blue <strong>Generate</strong> button. Your copy will appear below in an output card within 10-30 seconds.</p>
        </div>
      </div>

      <h2>What Happens After Generation?</h2>
      <p>After generating copy, you'll see an output card with your content. From here you can:</p>
      <ul>
        <li><strong>Copy to clipboard:</strong> Click the copy button to paste elsewhere</li>
        <li><strong>Generate alternative:</strong> Get a different version with a new angle</li>
        <li><strong>Apply voice style:</strong> Transform copy to match specific personas (Alex Hormozi, Steve Jobs, Humanize, etc.)</li>
        <li><strong>Modify content:</strong> Give custom instructions to adjust the copy</li>
        <li><strong>Score content:</strong> Get quality ratings (clarity, persuasiveness, tone match)</li>
        <li><strong>Compare versions:</strong> Use AI to compare multiple outputs and blend the best parts</li>
      </ul>

      <h2>Quick Tips for Better Results</h2>
      <div className="not-prose bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
        <ol className="list-decimal ml-4 space-y-2 text-gray-700 dark:text-gray-300">
          <li><strong>Be specific in your Business Description.</strong> "We help companies" is vague. "We help B2B SaaS companies automate customer onboarding" is specific.</li>
          <li><strong>Fill only the fields you need.</strong> You don't need to fill every field — the required three fields are enough to get started. Add optional fields only when they improve results for your specific copy.</li>
          <li><strong>Use Target Audience.</strong> This single field dramatically improves relevance.</li>
          <li><strong>Don't use all optional features at once.</strong> Start simple. Add features only when needed.</li>
          <li><strong>Generate alternatives.</strong> First output is rarely perfect. Generate 2-3 alternatives and pick the best.</li>
          <li><strong>Save as template.</strong> Once you find a configuration that works, save it and reuse it.</li>
        </ol>
      </div>

      <div className="not-prose bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Try this now:</p>
        <div className="space-y-2">
          <Link to="/" className="block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Go to Copy Maker →</Link>
          <p className="text-xs text-gray-600 dark:text-gray-400">Generate your first output to see Copy Maker in action</p>
        </div>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link to="/help/start-hub" className="text-blue-600 dark:text-blue-400 hover:underline">Learn about Start Hub</Link> — your launchpad for three fast paths</li>
        <li><Link to="/help/core-workflows" className="text-blue-600 dark:text-blue-400 hover:underline">Learn core workflows</Link> — create, improve, compare</li>
        <li><Link to="/help/setup-and-inputs" className="text-blue-600 dark:text-blue-400 hover:underline">Set up your inputs</Link> — brand voice, templates, project config</li>
        <li><Link to="/help/how-scoring-works" className="text-blue-600 dark:text-blue-400 hover:underline">Understand scoring and comparison</Link></li>
        <li><Link to="/help/credits-and-billing" className="text-blue-600 dark:text-blue-400 hover:underline">Understand credits</Link></li>
      </ul>

      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2026-04-17</p>
    </HelpLayout>
  );
};

export default GettingStarted;
