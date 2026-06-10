import React from 'react';
import HelpLayout from '../HelpLayout';
import { Link } from 'react-router-dom';

const Tutorials: React.FC = () => {
  return (
    <HelpLayout
      title="Quick Tutorials"
      breadcrumbs={[{ label: 'Quick Tutorials' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Short practical tutorials showing how to use CopyZap features, from analyzing existing websites to generating stronger copy variations.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Step-by-Step Tutorials</h2>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/tutorials/improve-existing-copy-from-website" className="hover:text-primary-500 dark:hover:text-primary-400">
                Improve Existing Copy from a Website
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Turn any live web page into optimized, high-converting copy using CopyZap's URL analyzer and Quick Prompt Wizard.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">6 steps &middot; ~2 min</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Getting Started</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/getting-started" className="hover:text-primary-500 dark:hover:text-primary-400">
                Getting Started Guide
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              New to CopyZap? Start here to learn the basics of creating high-quality marketing copy with AI.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Core Features</h2>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/getting-started" className="hover:text-primary-500 dark:hover:text-primary-400">
                Getting Started
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Learn how to get started with CopyZap and the Quick Setup Wizard for quick copy generation.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/setup-and-inputs" className="hover:text-primary-500 dark:hover:text-primary-400">
                Setup & Inputs
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Understand project setup, brand voices, templates, and how to configure your inputs for better results.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/brand-voice" className="hover:text-primary-500 dark:hover:text-primary-400">
                Brand Voice System
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Maintain consistent brand messaging across all your content with custom brand voices.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Advanced Topics</h2>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/voice-styles-and-blending" className="hover:text-primary-500 dark:hover:text-primary-400">
                Voice Styles and Blending
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Apply distinctive communication styles and blend multiple voices for unique results.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/compare-blend" className="hover:text-primary-500 dark:hover:text-primary-400">
                Compare and Blend Copy
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Compare different copy versions and blend the best elements into one optimal result.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/optional-features" className="hover:text-primary-500 dark:hover:text-primary-400">
                Optional Features
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Explore advanced features like content scoring, headline generation, and SEO metadata.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Workflows</h2>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/workflows" className="hover:text-primary-500 dark:hover:text-primary-400">
                Common Workflows
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Learn proven workflows for different content types and use cases.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              <Link to="/help/best-practices" className="hover:text-primary-500 dark:hover:text-primary-400">
                Best Practices
              </Link>
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Tips and best practices for getting the most out of CopyZap.
            </p>
          </div>
        </section>

        <section className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Need Help?</h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            If you can't find what you're looking for, check out our{' '}
            <Link to="/help/troubleshooting" className="underline hover:text-blue-600 dark:hover:text-blue-300">
              troubleshooting guide
            </Link>
            {' '}or{' '}
            <Link to="/help/contact" className="underline hover:text-blue-600 dark:hover:text-blue-300">
              contact support
            </Link>.
          </p>
        </section>
      </div>
    </HelpLayout>
  );
};

export default Tutorials;
