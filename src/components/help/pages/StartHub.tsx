import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';

const StartHub: React.FC = () => {
  return (
    <HelpLayout
      title="Start Hub"
      breadcrumbs={[{ label: 'Start Hub' }]}
    >
      <div className="space-y-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
          <p className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">Quick Overview</p>
          <p className="text-gray-700 dark:text-gray-300">
            The StartHub is your launchpad for creating marketing copy. It appears when you first log in and provides three fast paths to get started with CopyZap Copy Maker.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What is Start Hub?</h2>
          <p className="text-gray-700 dark:text-gray-300">
            The <strong>Start Hub modal</strong> is an onboarding feature that helps you choose the best way to begin creating content. Instead of facing a blank form, Start Hub presents three clear paths tailored to different workflows and experience levels.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            The <strong>Start Hub button</strong> (with a rocket icon) is also available in the main menu, so you can access it anytime you need a fresh start or want to try a different approach.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">When Does Start Hub Appear?</h2>
          <p className="text-gray-700 dark:text-gray-300">
            The Start Hub modal appears automatically in two situations:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li><strong>First login:</strong> When you first sign in to CopyZap, Start Hub greets you and helps you choose your first workflow</li>
            <li><strong>App load with empty form:</strong> If "Show Start Hub on app load" is enabled in your preferences, it appears when you load the app with an empty Copy Maker form</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How to Open Start Hub Manually</h2>
          <p className="text-gray-700 dark:text-gray-300">
            You can open the Start Hub modal anytime from the main menu:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Look for the <strong>Start Hub button</strong> in the top navigation bar</li>
            <li>Click the orange button with the <strong>rocket icon</strong> and "Start Hub" label</li>
            <li>The Start Hub modal will open, showing all three start paths</li>
          </ol>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mt-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>💡 Tip:</strong> The Start Hub button is always visible in the main menu when you're in Copy Maker, making it easy to switch workflows mid-session.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">The Three Start Paths</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Start Hub offers three distinct ways to begin, each optimized for different use cases:
          </p>

          <div className="space-y-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800/50">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-2xl">🪄</span> 1. Start with Copy Wizard
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                A guided, outcome-driven flow perfect for new users or when you want quick results without thinking about technical details.
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Two wizard paths:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li><strong>Make new copy:</strong> Create fresh content from scratch by answering simple questions about your project</li>
                <li><strong>Improve existing copy:</strong> Paste your current content and let the wizard help you enhance it</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link to="/help/getting-started" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Learn more about Getting Started →
                </Link>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800/50">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-2xl">📝</span> 2. Start with Copy Form
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Manual control with varying complexity levels. For experienced users who know exactly what they want.
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Three complexity levels:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li><strong>Quick:</strong> Essential fields only (primary prompt, tone, length) — fastest path to generation</li>
                <li><strong>Standard:</strong> Balanced control with core inputs plus SEO fields — good for most projects</li>
                <li><strong>Advanced:</strong> Full control with all panels open including GEO optimization, competitors, and analysis options</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link to="/help/project-setup" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Learn more about Project Setup and form fields →
                </Link>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800/50">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-2xl">📁</span> 3. Start from a Template
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Load a saved template to reuse proven configurations. Perfect for recurring workflows or when you've already optimized settings for a specific content type.
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">What happens:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Opens the Template Picker showing your saved templates</li>
                <li>Select a template to instantly load all saved settings</li>
                <li>All form fields, optional features, and preferences are pre-filled</li>
                <li>Just update any specific details and generate</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link to="/help/setup-and-inputs" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Learn more about Setup & Inputs →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Controlling Start Hub Visibility</h2>
          <p className="text-gray-700 dark:text-gray-300">
            At the bottom of the Start Hub modal, you'll find a toggle: <strong>"Show Start Hub on app load"</strong>
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Enabled (default):</strong> Start Hub appears automatically when you load the app with an empty form</li>
              <li><strong>Disabled:</strong> Start Hub won't appear automatically, but you can still access it via the Start Hub button in the main menu</li>
            </ul>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mt-3">
            Your preference is saved to your account and persists across sessions. You can change this setting anytime.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Common Questions</h2>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                I closed Start Hub — how do I get it back?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Click the <strong>Start Hub button</strong> (orange button with rocket icon) in the main menu at the top of the screen. It's always available when you're in Copy Maker.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Which option should I choose?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">Here's a quick guide:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                <li><strong>New to CopyZap?</strong> Start with Copy Wizard → Make new copy</li>
                <li><strong>Want to improve existing content?</strong> Start with Copy Wizard → Improve existing copy</li>
                <li><strong>Know exactly what settings you need?</strong> Start with Copy Form (Quick, Standard, or Advanced)</li>
                <li><strong>Repeating a proven workflow?</strong> Start from a Template</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Does using Start Hub cost credits?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                No. Opening the Start Hub modal and selecting a start path is completely free. <strong>Credits are only consumed when you click the Generate button</strong> to create copy. Start Hub simply helps you set up your form — the actual AI generation is what uses credits.
              </p>
              <div className="mt-2">
                <Link to="/help/credits-and-billing" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Learn more about Credits & Billing →
                </Link>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I change my mind after selecting a path?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Yes! Start Hub just sets up your form. You can:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4 mt-2">
                <li>Click the Start Hub button again to choose a different path</li>
                <li>Manually adjust any form fields after Start Hub closes</li>
                <li>Switch between wizard and form modes anytime</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Why doesn't Start Hub show my brand voices?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Start Hub focuses on choosing how to start, not specific content settings. After selecting a path, you can apply your brand voice in the Copy Maker form using the Brand Voice selector or by loading a template that has your brand voice pre-configured.
              </p>
              <div className="mt-2">
                <Link to="/help/brand-voice" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Learn more about Brand Voice System →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tips for Using Start Hub</h2>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <ul className="list-disc list-inside space-y-2 text-green-900 dark:text-green-100">
              <li><strong>Experiment with different paths:</strong> Try all three options to discover which workflow suits your style</li>
              <li><strong>Use templates for efficiency:</strong> Once you find settings that work, save them as templates and access them via Start Hub</li>
              <li><strong>Don't overthink it:</strong> Start Hub is just a helper — you can always adjust settings after choosing a path</li>
              <li><strong>Keep it enabled for onboarding:</strong> If you're new, keep "Show Start Hub on app load" enabled until you're comfortable with the platform</li>
              <li><strong>Disable when you're advanced:</strong> Once you know your preferred workflow, disable auto-show and use the button only when needed</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Related Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/help/getting-started"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800/50"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Getting Started</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn the basics of CopyZap and Copy Maker</p>
            </Link>
            <Link
              to="/help/core-workflows"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800/50"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Core Workflows</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create, improve, compare, and apply brand voice</p>
            </Link>
            <Link
              to="/help/setup-and-inputs"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800/50"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Setup & Inputs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Brand voice, templates, and project configuration</p>
            </Link>
            <Link
              to="/help/credits-and-billing"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800/50"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Credits & Billing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Understand credit costs and usage</p>
            </Link>
          </div>
        </section>
      </div>
    </HelpLayout>
  );
};

export default StartHub;
